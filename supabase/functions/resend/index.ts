import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type SubjectType = "claim_ticket" | "close_ticket" | "reopen_ticket";

interface TicketMeta {
  ticket_id?: string;
  ticket_title?: string;
  agent_name?: string;
  ticket_url?: string;
}

interface ResendReqBody {
  targets: string[];
  subject: SubjectType;
  meta?: TicketMeta;
}

// ---------------------------------------------------------------------------
// Design tokens — dark-blue "glass" surface with an orange accent.
// Email clients don't support CSS vars or backdrop-filter, so these are
// baked in as literal values and the "glass" look is faked with layered
// translucent panels + a soft border instead of a real blur.
// ---------------------------------------------------------------------------
const COLORS = {
  bg: "#050914",          // page background, near-black navy
  panel: "#0d1730",       // base card surface
  panelGlass: "#132043",  // lighter translucent-look inset panel
  border: "#24365f",      // hairline border on dark
  textPrimary: "#eef2fb",
  textSecondary: "#9fb0d1",
  textMuted: "#6d7ea6",
  orange: "#ff8a3d",
  orangeDark: "#c4601f",
  orangeText: "#ffd9b8",
};

const SUBJECT_COPY: Record<
  SubjectType,
  { label: string; heading: string; badge: string; badgeColor: string; body: (m: TicketMeta) => string }
> = {
  claim_ticket: {
    label: "Ticket claimed",
    heading: "Your ticket has been picked up",
    badge: "Claimed",
    badgeColor: COLORS.orange,
    body: (m) =>
      `${m.agent_name ? escapeHtml(m.agent_name) : "An agent"} is now handling ${
        m.ticket_title ? `“${escapeHtml(m.ticket_title)}”` : "your ticket"
      }. You'll hear back as soon as there's an update.`,
  },
  close_ticket: {
    label: "Ticket closed",
    heading: "Your ticket has been closed",
    badge: "Closed",
    badgeColor: "#4fb37a",
    body: (m) =>
      `${m.ticket_title ? `“${escapeHtml(m.ticket_title)}”` : "Your ticket"} has been marked as resolved. If anything's still off, you can reopen it any time.`,
  },
  reopen_ticket: {
    label: "Ticket reopened",
    heading: "Your ticket is back open",
    badge: "Reopened",
    badgeColor: "#5b8def",
    body: (m) =>
      `${m.ticket_title ? `“${escapeHtml(m.ticket_title)}”` : "Your ticket"} has been reopened and is back in the queue. We're on it.`,
  },
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build the HTML body for the mail based on the subject.
 * Table-based layout for email-client compatibility (Outlook/Gmail strip
 * flexbox, grid, and most modern CSS). Inline styles only.
 */
function getHtmlForSubject(subject: SubjectType, meta: TicketMeta = {}): string {
  const copy = SUBJECT_COPY[subject];
  if (!copy) return "";

  const ticketRef = meta.ticket_id ? `#${escapeHtml(meta.ticket_id.slice(0, 8))}` : null;
  const ctaUrl = meta.ticket_url;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${copy.label}</title>
</head>
<body style="margin:0; padding:0; background-color:${COLORS.bg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <span style="display:none; max-height:0; overflow:hidden; opacity:0;">${copy.heading}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg}; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Wordmark -->
          <tr>
            <td style="padding:0 4px 20px 4px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:8px; height:8px; border-radius:2px; background-color:${COLORS.orange};"></td>
                  <td style="width:8px;"></td>
                  <td style="font-size:13px; font-weight:600; letter-spacing:0.06em; color:${COLORS.textSecondary}; text-transform:uppercase;">Support desk</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card ("glass" panel) -->
          <tr>
            <td style="background-color:${COLORS.panel}; border:1px solid ${COLORS.border}; border-radius:16px; padding:0; overflow:hidden;">

              <!-- Accent top bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="height:4px; background-color:${COLORS.orange}; line-height:4px; font-size:0;">&nbsp;</td></tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 32px 28px 32px;">

                <!-- Status badge -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:${COLORS.panelGlass}; border:1px solid ${COLORS.border}; border-radius:999px; padding:6px 14px;">
                          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:${copy.badgeColor}; margin-right:8px; vertical-align:middle;"></span>
                          <span style="font-size:12px; font-weight:600; letter-spacing:0.03em; color:${COLORS.textPrimary}; vertical-align:middle;">${copy.badge}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <span style="font-size:22px; line-height:1.35; font-weight:600; color:${COLORS.textPrimary};">${copy.heading}</span>
                  </td>
                </tr>

                ${
                  ticketRef
                    ? `<tr><td style="padding-bottom:16px;"><span style="font-size:13px; color:${COLORS.textMuted}; font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">Ticket ${ticketRef}</span></td></tr>`
                    : ""
                }

                <!-- Body copy -->
                <tr>
                  <td style="padding-bottom:${ctaUrl ? "28px" : "4px"};">
                    <span style="font-size:15px; line-height:1.6; color:${COLORS.textSecondary};">${copy.body(meta)}</span>
                  </td>
                </tr>

                ${
                  ctaUrl
                    ? `<tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-radius:10px; background-color:${COLORS.orange};">
                                <a href="${escapeHtml(ctaUrl)}" style="display:inline-block; padding:12px 22px; font-size:14px; font-weight:600; color:#1a0f00; text-decoration:none; border-radius:10px;">View ticket</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`
                    : ""
                }

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 8px 0 8px;">
              <span style="font-size:12px; line-height:1.6; color:${COLORS.textMuted};">
                This is an automated notification. If you weren't expecting this, you can ignore this email.
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Send the email to the destinations using the Resend API.
 */
async function sendResendMail(destinations: string[], subject: string, html: string): Promise<Response> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: destinations,
      subject,
      html,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const errBody = await res.text();
  console.error("[ERROR] Resend API failed", res.status, errBody);
  return new Response(JSON.stringify({ error: "Cannot send email" }), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

const SUBJECT_LINES: Record<SubjectType, string> = {
  claim_ticket: "Your ticket has been claimed",
  close_ticket: "Your ticket has been closed",
  reopen_ticket: "Your ticket has been reopened",
};


Deno.serve(async (req: Request) => {
  console.log("[INFO] New email request received")
  const rpcSecret = req.headers.get("X-RPC-Secret");
  const expectedSecret = Deno.env.get("RPC_RESEND");
  
  // origin check
  if (!rpcSecret || !expectedSecret || rpcSecret !== expectedSecret) {
    console.log("[ERROR] Unauthorized access");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload: ResendReqBody = await req.json();

    //payload check
    if (!payload?.subject || !SUBJECT_COPY[payload.subject]) {
      return new Response(JSON.stringify({ error: "Invalid or missing subject" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(payload.targets) || payload.targets.length === 0) {
      return new Response(JSON.stringify({ error: "No targets provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const meta: TicketMeta = { ...payload.meta };
    const appBaseUrl = Deno.env.get("APP_BASE_URL");
    if (appBaseUrl && meta.ticket_id && !meta.ticket_url) {
      meta.ticket_url = `${appBaseUrl.replace(/\/$/, "")}/messages/${meta.ticket_id}`;
    }

    const html = getHtmlForSubject(payload.subject, meta);

    const targetUsers = await Promise.all(
      payload.targets.map(async (targetId) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(targetId);
        return data;
      })
    );

    const targetMails = targetUsers
      .map((targetUser) => targetUser.user?.email)
      .filter((email): email is string => Boolean(email));

    if (targetMails.length === 0) {
      throw new Error("Target mails not found.");
    }

    return await sendResendMail(
      targetMails,
      SUBJECT_LINES[payload.subject],
      html,
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ERROR]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});