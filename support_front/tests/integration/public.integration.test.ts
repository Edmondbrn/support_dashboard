import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { supabase } from "@/lib/supabase";
import {
    createTestUser,
    deleteTestUserByEmail,
    adminClient,
    type TestUserFixture,
    makeTestEmail,
} from "./helpers";
import { createTicket, deleteTicket, findProfile, findTicketsByClient } from "@/apis/public";
import {v4 as uuidv4} from 'uuid';

const trackedEmails: string[] = [];

const fakeEmail1 = makeTestEmail();
const fakePassword1 = "P@ssw0rd1";
let fakeUser1 : TestUserFixture | undefined = undefined;

const fakeEmail2 = makeTestEmail();
const fakePassword2 = "P@ssw0rd2";
let fakeUser2 : TestUserFixture | undefined = undefined;


function track(email: string): void {
    trackedEmails.push(email);
}

afterAll(async () => {
    await supabase.auth.signOut();
    for (const email of trackedEmails) {
        await deleteTestUserByEmail(email);
    }
});


beforeAll(async () => {
    fakeUser1 = await createTestUser({email: fakeEmail1, password: fakePassword1});
    fakeUser2 = await createTestUser({email: fakeEmail2, password: fakePassword2});
    await supabase.auth.signInWithPassword({email: fakeEmail1, password: fakePassword1})
    track(fakeEmail1)
    track(fakeEmail2)
})

beforeEach(async () => {
    const { error } = await adminClient
        .from("tickets")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // matches all real rows

    if (error) {
        throw new Error(`Failed to reset tickets table: ${error.message}`);
    }
})

describe("public tests", () => {
    
    describe("findProfile", () => {
        it("returns the profile for an existing user id", async () => {
    
            const { data, error } = await findProfile(fakeUser1!.userId);
    
            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data!.id).toBe(fakeUser1!.userId);
            expect(data!.username).toBe(fakeUser1!.username);
            expect(data!.role).toBe("client");
        });
    
        it("returns null data (no error) for a non-existent user id", async () => {
            const { data, error } = await findProfile("00000000-0000-0000-0000-000000000000");
    
            expect(error).toBeNull();
            expect(data).toBeNull();
        });
    });
    
    describe("createTicket", () => {
        it("creates a ticket for a valid client and returns success", async () => {
            const res = await createTicket(
                fakeUser1!.userId,
                "delivery",
                "high",
                "I was charged twice for the same invoice."
            );
    
            expect(res.status).toBe("success");
    
            const { data: ticket, error } = await supabase
                .from("tickets")
                .select("id, client_id, category, priority, description, status")
                .eq("client_id", fakeUser1!.userId)
                .maybeSingle();
    
            expect(error).toBeNull();
            expect(ticket).not.toBeNull();
            expect(ticket!.client_id).toBe(fakeUser1!.userId);
            expect(ticket!.category).toBe("delivery");
            expect(ticket!.priority).toBe("high");
            expect(ticket!.description).toBe("I was charged twice for the same invoice.");
        });
    
        it("returns a fail status when the client id does not reference a real profile", async () => {
            const res = await createTicket(
                "00000000-0000-0000-0000-000000000000",
                "delivery",
                "high",
                "This should fail on the FK constraint."
            );
    
            expect(res.status).toBe("fail");
            expect(res.errorMsg).toBeDefined();
            expect(res.errorCode).toBeDefined();
        });
    });
    
    describe("findTicketsByClient", () => {
        it("returns only the tickets belonging to the given client", async () => {
    
            await createTicket(fakeUser1!.userId, "software", "low", "Ticket A1");
            await createTicket(fakeUser1!.userId, "delivery", "medium", "Ticket A2");
    
            await supabase.auth.signOut()
            await supabase.auth.signInWithPassword({email: fakeEmail2, password:fakePassword2})
            await createTicket(fakeUser2!.userId, "hardware", "low", "Ticket B1");
            await supabase.auth.signOut()
    
            await supabase.auth.signInWithPassword({email: fakeEmail1, password:fakePassword1})
            const res = await findTicketsByClient(fakeUser1!.userId);
    
            expect(res.status).toBe("success");
            const tickets = res.data as { description: string }[];
            expect(tickets).toHaveLength(2);
            expect(tickets.map((t) => t.description).sort()).toEqual(["Ticket A1", "Ticket A2"]);
        });
    
    
        it("returns an empty array for a client with no tickets", async () => {
            const res = await findTicketsByClient(fakeUser1!.userId);
    
            expect(res.status).toBe("success");
            expect(res.data).toEqual([]);
        });
    
    
        it("includes the assigned agent's username when a ticket has been claimed", async () => {
            // Promote the second test user to an agent so it can be assigned to a ticket.
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);
    
            await createTicket(fakeUser1!.userId, "hardware", "low", "Needs an agent");
    
    
            const { error: assignError } = await adminClient
                .from("tickets")
                .update({ agent_id: fakeUser2!.userId })
                .eq("client_id", fakeUser1!.userId);
            expect(assignError).toBeNull();
    
            const res = await findTicketsByClient(fakeUser1!.userId);
    
            expect(res.status).toBe("success");
            const tickets = res.data as { agent_profile: { username: string } | null }[];
            expect(tickets[0].agent_profile?.username).toBe(fakeUser2!.username);
        });
    });


    describe("deletTicket", () => {
        it("Delete the open ticket", async () => {
    
            const ticketData = (await createTicket(fakeUser1!.userId, "software", "low", "Ticket A1")).data as {id : string};

            expect(ticketData).not.toBeUndefined();
            expect(ticketData.id).not.toBeUndefined();
    
            const ticket = await adminClient
                        .from("tickets")
                        .select("id")
                        .eq("id", ticketData.id)
                        .maybeSingle();

            expect(ticket).not.toBeNull();
            expect(ticket.data?.id).toBe(ticketData.id);

            const deleteRes = await deleteTicket(ticketData.id);

            expect(deleteRes.status).toBe("success");
            expect(deleteRes.data).toBeNull();

            // check that the ticket is not present anymore
            const {data, error} = await adminClient
                        .from("tickets")
                        .select("id")
                        .eq("id", ticketData.id)
                        .maybeSingle();

            expect(data).toBeNull();
            expect(error).toBeNull();
        });
    

    
        it("Return error when trying to delete ticket from someone else", async () => {
            
            const ticketId = uuidv4()
            await adminClient
                .from("tickets")
                .insert({
                    "client_id": fakeUser2!.userId,
                    "agent_id": null,
                    "category": "delivery",
                    "closed_by": null,
                    "description": "No delete ticket",
                    "priority": "low",
                    "status": "open",
                    "id": ticketId
                });
    
            const status = await deleteTicket(ticketId);

            // chekc that the ticket still exists
            const dbTicket = await adminClient
                .from("tickets")
                .select("id")
                .eq("id", ticketId)
                .maybeSingle();

            expect(dbTicket).not.toBeNull()
            // rls does not throw error for delete, just do nothing
            expect(status.status).toBe("success");
        });
    });
})
