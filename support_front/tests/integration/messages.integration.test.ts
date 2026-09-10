import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { supabase } from "@/lib/supabase";
import {
    createTestUser,
    deleteTestUserByEmail,
    adminClient,
    type TestUserFixture,
    makeTestEmail,
} from "./helpers";
import {
    findUserConversations,
    findConversationById,
    findMessagesForTicket,
    findTicketUsers,
    sendMessage,
    fetchUnreadCounts,
    markTicketRead,
} from "@/apis/messages";
import { createTicket } from "@/apis/public";
import { v4 as uuidv4 } from "uuid";

const trackedEmails: string[] = [];

const clientEmail = makeTestEmail();
const clientPassword = "P@ssw0rd1";
let client: TestUserFixture | undefined;

const agentEmail = makeTestEmail();
const agentPassword = "P@ssw0rd2";
let agent: TestUserFixture | undefined;

// A totally uninvolved third user, used to prove tickets/messages are scoped
// to their real participants and not leaked to everyone.
const strangerEmail = makeTestEmail();
const strangerPassword = "P@ssw0rd3";
let stranger: TestUserFixture | undefined;

function track(email: string): void {
    trackedEmails.push(email);
}

async function signIn(email: string, password: string) {
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({ email, password });
}

async function insertMessageAt(
    ticketId: string,
    senderId: string,
    content: string,
    createdAt: string
) {
    const { error } = await adminClient.from("messages").insert({
        ticket_id: ticketId,
        sender_id: senderId,
        content,
        created_at: createdAt,
    });
    if (error) throw new Error(`Failed to seed message: ${error.message}`);
}

afterAll(async () => {
    await supabase.auth.signOut();
    for (const email of trackedEmails) {
        await deleteTestUserByEmail(email);
    }
});

beforeAll(async () => {
    client = await createTestUser({ email: clientEmail, password: clientPassword });
    agent = await createTestUser({ email: agentEmail, password: agentPassword });
    stranger = await createTestUser({ email: strangerEmail, password: strangerPassword });
    await adminClient.from("profiles").update({ role: "agent" }).eq("id", agent!.userId);
    track(clientEmail);
    track(agentEmail);
    track(strangerEmail);
});

beforeEach(async () => {
    // messages cascade-delete with their ticket, ticket_reads cascade too
    const { error } = await adminClient
        .from("tickets")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`Failed to reset tickets table: ${error.message}`);
});

describe("messages/conversation APIs", () => {
    describe("findUserConversations", () => {
        it("only returns tickets the current user participates in", async () => {
            await signIn(clientEmail, clientPassword);
            const mine = (await createTicket(client!.userId, "software", "low", "Mine")).data as {
                id: string;
            };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", mine.id);

            // A ticket between the agent and the stranger — client should never see this.
            await signIn(strangerEmail, strangerPassword);
            const notMine = (
                await createTicket(stranger!.userId, "hardware", "low", "Not mine")
            ).data as { id: string };
            await adminClient
                .from("tickets")
                .update({ agent_id: agent!.userId })
                .eq("id", notMine.id);

            await signIn(clientEmail, clientPassword);
            const res = await findUserConversations(undefined, undefined);

            expect(res.status).toBe("success");
            const rows = res.data as { id: string }[];
            expect(rows.map((r) => r.id)).toContain(mine.id);
            expect(rows.map((r) => r.id)).not.toContain(notMine.id);
        });

        it("resolves other_user_id/username as the counterpart, from both sides", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Both sides"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);

            const asClient = await findUserConversations(undefined, undefined);
            const clientRow = (asClient.data as { id: string; username: string }[]).find(
                (r) => r.id === ticket.id
            );
            expect(clientRow?.username).toBe(agent!.username);

            await signIn(agentEmail, agentPassword);
            const asAgent = await findUserConversations(undefined, undefined);
            const agentRow = (asAgent.data as { id: string; username: string }[]).find(
                (r) => r.id === ticket.id
            );
            expect(agentRow?.username).toBe(client!.username);
        });

        it("still returns a ticket with no messages yet, ordered by ticket creation time", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "No messages"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);

            const res = await findUserConversations(undefined, undefined);
            const row = (res.data as { id: string; last_message_content: string | null }[]).find(
                (r) => r.id === ticket.id
            );
            expect(row).toBeDefined();
            expect(row!.last_message_content).toBeNull();
        });

        it("orders conversations by most recent message, not by ticket creation date", async () => {
            await signIn(clientEmail, clientPassword);
            const older = (await createTicket(client!.userId, "software", "low", "Older ticket"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", older.id);

            const newer = (await createTicket(client!.userId, "hardware", "low", "Newer ticket"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", newer.id);

            // Bump the OLDER ticket to the top with a fresh message.
            await insertMessageAt(older.id, client!.userId, "bump", new Date().toISOString());

            const res = await findUserConversations(undefined, undefined);
            const rows = res.data as { id: string }[];
            const olderIdx = rows.findIndex((r) => r.id === older.id);
            const newerIdx = rows.findIndex((r) => r.id === newer.id);
            expect(olderIdx).toBeLessThan(newerIdx);
        });

        it("paginates using the last loaded ticket id and last message timestamp", async () => {
            await signIn(clientEmail, clientPassword);
            const ids: string[] = [];
            for (let i = 0; i < 11; i++) {
                const t = (
                    await createTicket(client!.userId, "software", "low", `Ticket ${i}`)
                ).data as { id: string };
                await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", t.id);
                ids.push(t.id);
            }

            const page1 = await findUserConversations(undefined, undefined);
            const page1Rows = page1.data as { id: string; last_message_at: string | null; created_at: string}[];
            expect(page1Rows).toHaveLength(10);

            const last = page1Rows[page1Rows.length - 1];
            const page2 = await findUserConversations(
                last.id,
                last.last_message_at ?? last.created_at
            );
            const page2Rows = page2.data as { id: string }[];
            
            expect(page2Rows).toHaveLength(1);
            expect(page1Rows.map((r) => r.id)).not.toContain(page2Rows[0].id);
        });

        it("still surfaces the client's own ticket even when it has not been claimed by an agent", async () => {
            await signIn(clientEmail, clientPassword);
            const unassigned = (
                await createTicket(client!.userId, "software", "low", "Unassigned")
            ).data as { id: string };

            const res = await findUserConversations(undefined, undefined);
            const rows = res.data as { id: string }[];
            expect(rows.map((r) => r.id)).toContain(unassigned.id);
        });

        it("fails for an unauthenticated caller", async () => {
            await supabase.auth.signOut();
            const res = await findUserConversations(undefined, undefined);
            expect(res.status).toBe("fail");
        });
    });

    describe("findConversationById", () => {
        it("returns the ticket for a participant", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Detail"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);

            const res = await findConversationById(ticket.id);
            expect(res.status).toBe("success");
            expect((res.data as { id: string }).id).toBe(ticket.id);
        });

        it("returns null data for a ticket the caller is not part of", async () => {
            await signIn(strangerEmail, strangerPassword);
            const notMine = (
                await createTicket(stranger!.userId, "software", "low", "Not visible")
            ).data as { id: string };

            await signIn(clientEmail, clientPassword);
            const res = await findConversationById(notMine.id);
            expect(res.status).toBe("success");
            expect(res.data).toBeNull();
        });

        it("includes the latest message content", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Latest msg"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);

            await insertMessageAt(ticket.id, client!.userId, "first", "2024-01-01T00:00:00Z");
            await insertMessageAt(ticket.id, client!.userId, "latest", "2024-01-02T00:00:00Z");

            const res = await findConversationById(ticket.id);
            expect((res.data as { last_message_content: string }).last_message_content).toBe(
                "latest"
            );
        });

        it("fails for an unauthenticated caller", async () => {
            await supabase.auth.signOut();
            const res = await findConversationById(uuidv4());
            expect(res.status).toBe("error");
        });
    });

    describe("findMessagesForTicket", () => {
        it("returns messages in ascending chronological order", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Order test"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);

            await insertMessageAt(ticket.id, client!.userId, "second", "2024-01-02T00:00:00Z");
            await insertMessageAt(ticket.id, client!.userId, "first", "2024-01-01T00:00:00Z");

            const res = await findMessagesForTicket(ticket.id);
            expect(res.status).toBe("success");
            const contents = (res.data as { content: string }[]).map((m) => m.content);
            expect(contents).toEqual(["first", "second"]);
        });

        it("returns an empty array for a ticket with no messages", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Empty"))
                .data as { id: string };

            const res = await findMessagesForTicket(ticket.id);
            expect(res.status).toBe("success");
            expect(res.data).toEqual([]);
        });

        it("includes the sender's username via the profiles join", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Sender join"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);
            await insertMessageAt(ticket.id, client!.userId, "hi", new Date().toISOString());

            const res = await findMessagesForTicket(ticket.id);
            const msg = (res.data as { sender: { username: string } }[])[0];
            expect(msg.sender.username).toBe(client!.username);
        });

        it("round-trips attachment metadata", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Attachment"))
                .data as { id: string };

            const send = await sendMessage(ticket.id, client!.userId, undefined, {
                attachment_name: "report.pdf",
                attachment_size: 1024,
                attachment_path: `${ticket.id}/report.pdf`,
                attachment_mime_type: "application/pdf",
            });
            expect(send.status).toBe("success");

            const res = await findMessagesForTicket(ticket.id);
            const msg = (
                res.data as {
                    attachment_name: string;
                    attachment_mime_type: string;
                    attachment_size: number;
                    attachment_url: string;
                }[]
            )[0];
            expect(msg.attachment_name).toBe("report.pdf");
            expect(msg.attachment_mime_type).toBe("application/pdf");
            expect(msg.attachment_size).toBe(1024);
            expect(msg.attachment_url).toBe(`${ticket.id}/report.pdf`);
        });

        it("does not leak messages to a non-participant", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Private"))
                .data as { id: string };
            await insertMessageAt(ticket.id, client!.userId, "secret", new Date().toISOString());

            await signIn(strangerEmail, strangerPassword);
            const res = await findMessagesForTicket(ticket.id);
            // Depending on the messages table's RLS this should either fail or
            // return an empty array -- it must never return the row.
            const rows = (res.data ?? []) as unknown[];
            expect(rows).toHaveLength(0);
        });
    });

    describe("findTicketUsers", () => {
        it("returns both usernames once a ticket is assigned", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Both users"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);

            const res = await findTicketUsers(ticket.id);
            expect(res.status).toBe("success");
            const data = res.data as { client: { username: string }; agent: { username: string } };
            expect(data.client.username).toBe(client!.username);
            expect(data.agent.username).toBe(agent!.username);
        });

        it("returns a null agent for an unclaimed ticket", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Unclaimed"))
                .data as { id: string };

            const res = await findTicketUsers(ticket.id);
            expect(res.status).toBe("success");
            expect((res.data as { agent: unknown }).agent).toBeNull();
        });

        it("returns null for a non-participant", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Hidden"))
                .data as { id: string };

            await signIn(strangerEmail, strangerPassword);
            const res = await findTicketUsers(ticket.id);
            expect(res.status).toBe("success");
            const data = res.data as {agent: {username: string}, client: {username: string}}
            expect(data.agent).toBeNull();
            expect(data.client).toBeNull();
        });
    });

    describe("sendMessage", () => {
        it("sends a plain text message", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Text only"))
                .data as { id: string };

            const res = await sendMessage(ticket.id, client!.userId, "hello there");
            expect(res.status).toBe("success");
            expect((res.data as { content: string }).content).toBe("hello there");
        });

        it("sends an attachment-only message with no content", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Attach only"))
                .data as { id: string };

            const res = await sendMessage(ticket.id, client!.userId, undefined, {
                attachment_name: "photo.png",
                attachment_size: 2048,
                attachment_path: `${ticket.id}/photo.png`,
                attachment_mime_type: "image/png",
            });
            expect(res.status).toBe("success");
        });

        it("rejects impersonating another user's sender_id", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Impersonation"))
                .data as { id: string };

            // Authenticated as the client, but claiming to send as the agent.
            const res = await sendMessage(ticket.id, agent!.userId, "spoofed");
            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });

        it("rejects sending to a ticket the caller is not part of", async () => {
            await signIn(strangerEmail, strangerPassword);
            const foreignTicket = (
                await createTicket(stranger!.userId, "software", "low", "Foreign")
            ).data as { id: string };

            await signIn(clientEmail, clientPassword);
            const res = await sendMessage(foreignTicket.id, client!.userId, "intrusion");
            expect(res.status).toBe("fail");
        });

        it("rejects sending a message to a closed ticket (client blocked by RLS)", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Closed ticket"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);

            // Close the ticket bypassing RLS so the test focuses on the messages policy.
            const { error: closeError } = await adminClient
                .from("tickets")
                .update({ status: "closed", closed_by: agent!.userId })
                .eq("id", ticket.id);
            expect(closeError).toBeNull();

            const res = await sendMessage(ticket.id, client!.userId, "after close");
            expect(res.status).toBe("fail");
            expect(res.errorMsg).toBeDefined();
            expect(res.errorCode).toBe("42501");

            // No message must have been persisted.
            const { data: rows, error } = await adminClient
                .from("messages")
                .select("id")
                .eq("ticket_id", ticket.id);
            expect(error).toBeNull();
            expect(rows).toHaveLength(0);
        });

        it("rejects sending a message to a closed ticket (assigned agent blocked by RLS)", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (
                await createTicket(client!.userId, "software", "low", "Closed for agent")
            ).data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);
            const { error: closeError } = await adminClient
                .from("tickets")
                .update({ status: "closed", closed_by: agent!.userId })
                .eq("id", ticket.id);
            expect(closeError).toBeNull();

            await signIn(agentEmail, agentPassword);
            const res = await sendMessage(ticket.id, agent!.userId, "agent after close");
            expect(res.status).toBe("fail");
            expect(res.errorMsg).toBeDefined();
            expect(res.errorCode).toBe("42501");

            const { data: rows, error } = await adminClient
                .from("messages")
                .select("id")
                .eq("ticket_id", ticket.id);
            expect(error).toBeNull();
            expect(rows).toHaveLength(0);
        });
    });

    describe("fetchUnreadCounts", () => {
        it("does not count the caller's own sent messages", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Own messages"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);
            await sendMessage(ticket.id, client!.userId, "from me");

            const res = await fetchUnreadCounts();
            const rows = (res.data ?? []) as { ticket_id: string }[];
            expect(rows.find((r) => r.ticket_id === ticket.id)).toBeUndefined();
        });

        it("counts messages sent by the other participant", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "From agent"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);

            await signIn(agentEmail, agentPassword);
            await sendMessage(ticket.id, agent!.userId, "hi client");
            await sendMessage(ticket.id, agent!.userId, "still there?");

            await signIn(clientEmail, clientPassword);
            const res = await fetchUnreadCounts();
            const row = (res.data as { ticket_id: string; unread_count: number }[]).find(
                (r) => r.ticket_id === ticket.id
            );
            expect(row?.unread_count).toBe(2);
        });

        it("drops to zero after the ticket is marked read", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Mark read"))
                .data as { id: string };
            await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);

            await signIn(agentEmail, agentPassword);
            await sendMessage(ticket.id, agent!.userId, "unread message");

            await signIn(clientEmail, clientPassword);
            await markTicketRead(ticket.id);

            const res = await fetchUnreadCounts();
            const rows = (res.data ?? []) as { ticket_id: string }[];
            expect(rows.find((r) => r.ticket_id === ticket.id)).toBeUndefined();
        });

        it("excludes tickets the caller is not part of", async () => {
            await signIn(strangerEmail, strangerPassword);
            const foreignTicket = (
                await createTicket(stranger!.userId, "software", "low", "Not counted")
            ).data as { id: string };
            await adminClient
                .from("tickets")
                .update({ agent_id: agent!.userId })
                .eq("id", foreignTicket.id);
            await sendMessage(foreignTicket.id, stranger!.userId, "hi agent");

            await signIn(clientEmail, clientPassword);
            const res = await fetchUnreadCounts();
            const rows = (res.data ?? []) as { ticket_id: string }[];
            expect(rows.find((r) => r.ticket_id === foreignTicket.id)).toBeUndefined();
        });
    });

    describe("markTicketRead", () => {
        it("creates a read marker on first call", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "First read"))
                .data as { id: string };

            const res = await markTicketRead(ticket.id);
            expect(res.status).toBe("success");

            const { data } = await adminClient
                .from("ticket_reads")
                .select("last_read_at")
                .eq("ticket_id", ticket.id)
                .eq("user_id", client!.userId)
                .maybeSingle();
            expect(data).not.toBeNull();
        });

        it("updates the timestamp on a subsequent call (upsert)", async () => {
            await signIn(clientEmail, clientPassword);
            const ticket = (await createTicket(client!.userId, "software", "low", "Upsert read"))
                .data as { id: string };

            await markTicketRead(ticket.id);
            const first = await adminClient
                .from("ticket_reads")
                .select("last_read_at")
                .eq("ticket_id", ticket.id)
                .eq("user_id", client!.userId)
                .maybeSingle();

            await new Promise((r) => setTimeout(r, 1000));
            await markTicketRead(ticket.id);
            const second = await adminClient
                .from("ticket_reads")
                .select("last_read_at")
                .eq("ticket_id", ticket.id)
                .eq("user_id", client!.userId)
                .maybeSingle();

            expect(new Date(second.data!.last_read_at).getTime()).toBeGreaterThan(
                new Date(first.data!.last_read_at).getTime()
            );
        });

        it("refuses to mark a ticket the caller is not part of", async () => {
            await signIn(strangerEmail, strangerPassword);
            const foreignTicket = (
                await createTicket(stranger!.userId, "software", "low", "Foreign read")
            ).data as { id: string };

            await signIn(clientEmail, clientPassword);
            const res = await markTicketRead(foreignTicket.id);
            expect(res.status).toBe("fail");
        });
    });
});