import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { supabase } from "@/lib/supabase";
import {
    createTestUser,
    deleteTestUserByEmail,
    adminClient,
    type TestUserFixture,
    makeTestEmail,
} from "./helpers";
import {
    uploadAttachment,
    getAttachmentSignedUrls,
    deleteAttachment,
    sendMessage,
} from "@/apis/messages"; // NOTE: adjust to the real module path for doc-1's functions
import { createTicket } from "@/apis/public";
import { v4 as uuidv4 } from "uuid";

const BUCKET = "message-attachments";

const clientEmail = makeTestEmail();
const clientPassword = "P@ssw0rd1";
let client: TestUserFixture | undefined;

const agentEmail = makeTestEmail();
const agentPassword = "P@ssw0rd2";
let agent: TestUserFixture | undefined;

// A second agent, never assigned to any of the test tickets, used to prove
// "is_agent()" alone isn't enough to authorize deletion.
const otherAgentEmail = makeTestEmail();
const otherAgentPassword = "P@ssw0rd3";
let otherAgent: TestUserFixture | undefined;

const strangerEmail = makeTestEmail();
const strangerPassword = "P@ssw0rd4";
let stranger: TestUserFixture | undefined;

const trackedEmails: string[] = [];
const uploadedPaths: string[] = [];

function track(email: string): void {
    trackedEmails.push(email);
}

async function signIn(email: string, password: string) {
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({ email, password });
}

function makeFile(name: string, mimeType: string, sizeBytes: number): File {
    const bytes = new Uint8Array(sizeBytes).fill(1);
    return new File([bytes], name, { type: mimeType });
}

async function createAssignedTicket(): Promise<string> {
    await signIn(clientEmail, clientPassword);
    const ticket = (await createTicket(client!.userId, "software", "low", "Attachment ticket"))
        .data as { id: string };
    await adminClient.from("tickets").update({ agent_id: agent!.userId }).eq("id", ticket.id);
    return ticket.id;
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
    otherAgent = await createTestUser({ email: otherAgentEmail, password: otherAgentPassword });
    stranger = await createTestUser({ email: strangerEmail, password: strangerPassword });
    await adminClient.from("profiles").update({ role: "agent" }).eq("id", agent!.userId);
    await adminClient.from("profiles").update({ role: "agent" }).eq("id", otherAgent!.userId);
    track(clientEmail);
    track(agentEmail);
    track(otherAgentEmail);
    track(strangerEmail);
});

beforeEach(async () => {
    const { error } = await adminClient
        .from("tickets")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`Failed to reset tickets table: ${error.message}`);
});

afterEach(async () => {
    if (uploadedPaths.length > 0) {
        await adminClient.storage.from(BUCKET).remove(uploadedPaths.splice(0));
    }
});

describe("message-attachments storage", () => {
    describe("uploadAttachment", () => {
        it("lets a ticket participant (client) upload a file", async () => {
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/photo.png`;

            const res = await uploadAttachment(path, makeFile("photo.png", "image/png", 1024));
            expect(res.status).toBe("success");
            uploadedPaths.push(path);
        });

        it("lets the assigned agent upload a file", async () => {
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/agent-upload.pdf`;

            await signIn(agentEmail, agentPassword);
            const res = await uploadAttachment(
                path,
                makeFile("agent-upload.pdf", "application/pdf", 1024)
            );
            expect(res.status).toBe("success");
            uploadedPaths.push(path);
        });

        it("denies upload from a non-participant", async () => {
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/blocked.png`;

            await signIn(strangerEmail, strangerPassword);
            const res = await uploadAttachment(path, makeFile("blocked.png", "image/png", 1024));
            expect(res.status).toBe("fail");
        });

        it("denies upload when the path prefix does not match a ticket the caller belongs to", async () => {
            await signIn(clientEmail, clientPassword);
            const fakeTicketId = uuidv4(); // not a real ticket, or not one the caller owns
            const path = `${fakeTicketId}/sneaky.png`;

            const res = await uploadAttachment(path, makeFile("sneaky.png", "image/png", 1024));
            expect(res.status).toBe("fail");
        });

        it("rejects a file larger than the 5MB bucket limit", async () => {
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/too-big.png`;

            const res = await uploadAttachment(
                path,
                makeFile("too-big.png", "image/png", 6 * 1024 * 1024)
            );
            expect(res.status).toBe("fail");
        });

        it("rejects a disallowed mime type", async () => {
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/script.js`;

            const res = await uploadAttachment(
                path,
                makeFile("script.js", "application/javascript", 128)
            );
            expect(res.status).toBe("fail");
        });
    });

    describe("getAttachmentSignedUrls", () => {
        it("generates a signed URL for a participant", async () => {
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/viewable.png`;
            await uploadAttachment(path, makeFile("viewable.png", "image/png", 1024));
            uploadedPaths.push(path);

            const res = await getAttachmentSignedUrls([path]);
            expect(res.status).toBe("success");
            const urls = res.data as { signedUrl: string }[];
            expect(urls[0].signedUrl).toBeTruthy();
        });

        it("does not let a non-participant sign a URL for someone else's attachment", async () => {
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/private.png`;
            await uploadAttachment(path, makeFile("private.png", "image/png", 1024));
            uploadedPaths.push(path);

            await signIn(strangerEmail, strangerPassword);
            const res = await getAttachmentSignedUrls([path]);
            // Either the call fails outright, or it succeeds with an
            // unusable/errored entry for that path -- it must never hand back
            // a working signed URL to a non-participant.
            if (res.status === "success") {
                const entry = (res.data as { signedUrl?: string; error?: string }[])[0];
                expect(entry.signedUrl).toBeFalsy();
            } else {
                expect(res.status).toBe("fail");
            }
        });
    });

    describe("deleteAttachment", () => {
        it("lets the client delete a file from their own ticket", async () => {
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/client-delete.png`;
            await uploadAttachment(path, makeFile("client-delete.png", "image/png", 1024));

            await deleteAttachment(path);

            const { data } = await adminClient.storage.from(BUCKET).list(ticketId);
            expect(data?.some((f) => f.name === "client-delete.png")).toBe(false);
        });

        it("lets the assigned agent delete a file from their ticket", async () => {
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/agent-delete.png`;
            await uploadAttachment(path, makeFile("agent-delete.png", "image/png", 1024));

            await signIn(agentEmail, agentPassword);
            await deleteAttachment(path);

            const { data } = await adminClient.storage.from(BUCKET).list(ticketId);
            expect(data?.some((f) => f.name === "agent-delete.png")).toBe(false);
        });

        it("does not let a client delete a file from a ticket that isn't theirs", async () => {
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/protected.png`;
            await uploadAttachment(path, makeFile("protected.png", "image/png", 1024));

            await signIn(strangerEmail, strangerPassword);
            await deleteAttachment(path); // deleteAttachment swallows errors internally

            const { data } = await adminClient.storage.from(BUCKET).list(ticketId);
            expect(data?.some((f) => f.name === "protected.png")).toBe(true);
            uploadedPaths.push(path);
        });

        it("does not let an agent who is not assigned to the ticket delete its file", async () => {
            // Regression check for the asymmetric delete policy: is_agent() is
            // true for otherAgent, but agent_id on this ticket is `agent`'s id.
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/agent-only.png`;
            await uploadAttachment(path, makeFile("agent-only.png", "image/png", 1024));

            await signIn(otherAgentEmail, otherAgentPassword);
            await deleteAttachment(path);

            const { data } = await adminClient.storage.from(BUCKET).list(ticketId);
            expect(data?.some((f) => f.name === "agent-only.png")).toBe(true);
            uploadedPaths.push(path);
        });
    });

    describe("upload -> failed message insert -> cleanup workflow", () => {
        it("removes the orphaned file when sendMessage fails after a successful upload", async () => {
            await signIn(clientEmail, clientPassword);
            const ticketId = await createAssignedTicket();
            const path = `${ticketId}/orphan.png`;

            const uploadRes = await uploadAttachment(
                path,
                makeFile("orphan.png", "image/png", 1024)
            );
            expect(uploadRes.status).toBe("success");

            // Simulate the message insert failing by attempting to send as a
            // sender_id the caller isn't allowed to impersonate.
            const sendRes = await sendMessage(ticketId, agent!.userId, undefined, {
                attachment_name: "orphan.png",
                attachment_size: 1024,
                attachment_path: path,
                attachment_mime_type: "image/png",
            });
            expect(sendRes.status).toBe("fail");

            await deleteAttachment(path);

            const { data } = await adminClient.storage.from(BUCKET).list(ticketId);
            expect(data?.some((f) => f.name === "orphan.png")).toBe(false);
        });
    });
});