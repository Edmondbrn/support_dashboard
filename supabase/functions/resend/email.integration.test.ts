// deno-lint-ignore-file no-import-prefix
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { assert, assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Env / config
// ---------------------------------------------------------------------------

await load({ envPath: ".env", export: true });

function requireEnv(name: string): string {
  const val = Deno.env.get(name);
  if (!val) {
    throw new Error(
      `Missing required env var "${name}". Make sure it's set in your .env file.`,
    );
  }
  return val;
}

const DB_URL = requireEnv("DB_URL");
const DB_SERVICE_ROLE_KEY = requireEnv("DB_SECRET_KEY");
const RESEND_API_KEY = requireEnv("RESEND_API_KEY");
const RPC_SECRET = requireEnv("RPC_RESEND");

const RESEND_READ_API_KEY = Deno.env.get("RESEND_API_KEY_FULL_ACCESS") ?? RESEND_API_KEY;

const FUNCTION_SLUG = Deno.env.get("FUNCTION_SLUG") ?? "resend";
const FUNCTIONS_BASE_URL = Deno.env.get("SUPABASE_FUNCTIONS_URL") ??
  `${DB_URL.replace(/\/$/, "")}/functions/v1`;
const FUNCTION_URL = `${FUNCTIONS_BASE_URL}/${FUNCTION_SLUG}`;

// Resend's sandbox address: mail "sent" to this address is always accepted
// and simulated as delivered, without needing a real mailbox.
const TEST_EMAIL = "delivered@resend.dev";

const supabaseAdmin = createClient(DB_URL, DB_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function invokeFunction(
  body: unknown,
  headers: Record<string, string> = { "X-RPC-Secret": RPC_SECRET },
): Promise<Response> {
  return await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function createThrowawayUser(email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }
  return data.user;
}

async function deleteUser(userId: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.warn(`[cleanup] Failed to delete test user ${userId}:`, error.message);
  }
}

interface ResendEmailStatus {
  id: string;
  last_event?: string;
  to?: string[];
  subject?: string;
}

/** Fetch email status straight from Resend: GET /emails/:id */
async function getResendEmail(id: string): Promise<ResendEmailStatus> {
  const res = await fetch(`https://api.resend.com/emails/${id}`, {
    headers: { Authorization: `Bearer ${RESEND_READ_API_KEY}` },
  });
  if (res.status === 401) {
    const body = await res.text();
    if (body.includes("restricted_api_key")) {
      throw new Error(
        `Resend key can't read email status (send-only key). Create a "Full access" ` +
          `API key in the Resend dashboard and set it as RESEND_API_KEY_FULL_ACCESS ` +
          `in your .env — don't downgrade RESEND_API_KEY itself, since that one is ` +
          `also used by the edge function to send mail. Raw response: ${body}`,
      );
    }
  }
  if (!res.ok) {
    throw new Error(`Resend GET /emails/${id} failed: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

/** Poll Resend until the email reaches a terminal "delivered"-ish state. */
async function waitForDelivery(
  id: string,
  { retries = 15, delayMs = 1500 } = {},
): Promise<ResendEmailStatus> {
  let last: ResendEmailStatus | undefined;
  for (let i = 0; i < retries; i++) {
    last = await getResendEmail(id);
    if (last.last_event && last.last_event !== "queued") {
      return last;
    }
    await sleep(delayMs);
  }
  throw new Error(
    `Email ${id} never left "queued" state after ${retries} polls. Last status: ${
      JSON.stringify(last)
    }`,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

Deno.test("send-resend-email: rejects requests with no X-RPC-Secret", async () => {
  const res = await invokeFunction(
    { targets: ["whatever"], subject: "claim_ticket" },
    {},
  );
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Unauthorized");
});

Deno.test("send-resend-email: rejects requests with a wrong X-RPC-Secret", async () => {
  const res = await invokeFunction(
    { targets: ["whatever"], subject: "claim_ticket" },
    { "X-RPC-Secret": "definitely-not-the-secret" },
  );
  assertEquals(res.status, 401);
  await res.json();
});

Deno.test("send-resend-email: rejects missing/invalid subject", async () => {
  const res = await invokeFunction({ targets: ["some-user-id"] });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "Invalid or missing subject");
});

Deno.test("send-resend-email: rejects unknown subject value", async () => {
  const res = await invokeFunction({
    targets: ["some-user-id"],
    subject: "not_a_real_subject",
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "Invalid or missing subject");
});

Deno.test("send-resend-email: rejects missing/empty targets", async () => {
  const res = await invokeFunction({ subject: "claim_ticket", targets: [] });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "No targets provided");
});

Deno.test("send-resend-email: rejects targets that resolve to no emails", async () => {
  const res = await invokeFunction({
    subject: "claim_ticket",
    targets: ["00000000-0000-0000-0000-000000000000"], // valid uuid, no such user
  });
  assertEquals(res.status, 500);
  const body = await res.json();
  assertEquals(body.error, "Target mails not found.");
});

Deno.test({
  name: "send-resend-email: claim_ticket happy path is actually delivered via Resend",
  async fn(t) {
    let user: Awaited<ReturnType<typeof createThrowawayUser>>;

    await t.step("create throwaway test user", async () => {
      user = await createThrowawayUser(TEST_EMAIL);
      assertExists(user.id);
    });

    let resendId: string;

    await t.step("invoke edge function", async () => {
      const res = await invokeFunction({
        targets: [user.id],
        subject: "claim_ticket",
        meta: {
          ticket_id: "abcdef12-3456-7890-abcd-ef1234567890",
          ticket_title: "Integration test ticket",
          agent_name: "Test Agent",
        },
      });

      assertEquals(res.status, 200);
      const body = await res.json();
      // Resend's /emails POST response includes an `id` field.
      assertExists(body.id, `Expected Resend response to include an id, got: ${JSON.stringify(body)}`);
      resendId = body.id;
    });

    await t.step("verify delivery via Resend GET /emails/:id", async () => {
      const status = await waitForDelivery(resendId);
      assertEquals(status.id, resendId);
      // Sandbox address always simulates a successful delivery.
      assert(
        ["delivered", "delivery_delayed"].includes(status.last_event ?? ""),
        `Unexpected last_event: ${status.last_event}`,
      );
      assert(
        status.to?.includes(TEST_EMAIL),
        `Expected recipient ${TEST_EMAIL} in ${JSON.stringify(status.to)}`,
      );
      assertEquals(status.subject, "Your ticket has been claimed");
    });

    await t.step("cleanup: delete test user", async () => {
      await deleteUser(user.id);
    });
  },
  // Network + timers used for polling; don't fail the test on that basis.
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "send-resend-email: close_ticket and reopen_ticket subjects also send successfully",
  async fn(t) {
    let user: Awaited<ReturnType<typeof createThrowawayUser>>;

    await t.step("create throwaway test user", async () => {
      user = await createThrowawayUser(TEST_EMAIL);
    });

    for (const subject of ["close_ticket", "reopen_ticket"] as const) {
      await t.step(`invoke + verify for subject=${subject}`, async () => {
        const res = await invokeFunction({
          targets: [user.id],
          subject,
          meta: { ticket_title: `Integration test - ${subject}` },
        });
        assertEquals(res.status, 200);
        const body = await res.json();
        assertExists(body.id);

        const status = await waitForDelivery(body.id);
        assert(["delivered", "delivery_delayed"].includes(status.last_event ?? ""));
      });
    }

    await t.step("cleanup: delete test user", async () => {
      await deleteUser(user.id);
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});