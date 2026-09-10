import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { supabase } from "@/lib/supabase";
import {
    createTestUser,
    deleteTestUserByEmail,
    adminClient,
    type TestUserFixture,
    makeTestEmail,
} from "./helpers";
import { claimTicket, closeTicket, createTicket, deleteTicket, findAssignedTicketsByAgent, findProfile, findTicketById, findTicketsByClient, findUnassignedTicket, inProgressTicket } from "@/apis/public";
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


    describe("findAssignedTicketsByAgent", () => {
        it("returns only the tickets assigned to the given agent", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            const assignedId = (await createTicket(fakeUser1!.userId, "software", "low", "Assigned to agent")).data as { id: string };
            await adminClient.from("tickets").update({ agent_id: fakeUser2!.userId }).eq("id", assignedId.id);

            await createTicket(fakeUser1!.userId, "delivery", "high", "Still unassigned");

            const res = await findAssignedTicketsByAgent(fakeUser2!.userId);

            expect(res.status).toBe("success");
            const tickets = res.data as { id: string; description: string }[];
            expect(tickets).toHaveLength(1);
            expect(tickets[0].id).toBe(assignedId.id);
            expect(tickets[0].description).toBe("Assigned to agent");
        });

        it("returns an empty array for an agent with no assigned tickets", async () => {
            const res = await findAssignedTicketsByAgent(fakeUser2!.userId);

            expect(res.status).toBe("success");
            expect(res.data).toEqual([]);
        });

        it("includes the assigned agent's username", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            const assignedId = (await createTicket(fakeUser1!.userId, "hardware", "medium", "With agent username")).data as { id: string };
            await adminClient.from("tickets").update({ agent_id: fakeUser2!.userId }).eq("id", assignedId.id);

            const res = await findAssignedTicketsByAgent(fakeUser2!.userId);

            expect(res.status).toBe("success");
            const tickets = res.data as { agent_profile: { username: string } | null }[];
            expect(tickets[0].agent_profile?.username).toBe(fakeUser2!.username);
        });
    });

    describe("claimTicket", () => {
        it("lets an agent claim an unassigned ticket", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            const ticket = (await createTicket(fakeUser1!.userId, "software", "high", "To be claimed")).data as { id: string };

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail2, password: fakePassword2 });

            const res = await claimTicket(ticket.id, fakeUser2!.userId);

            expect(res.status).toBe("success");

            const { data: dbTicket, error } = await adminClient
                .from("tickets")
                .select("agent_id")
                .eq("id", ticket.id)
                .maybeSingle();

            expect(error).toBeNull();
            expect(dbTicket?.agent_id).toBe(fakeUser2!.userId);
        });

        it("refuses to claim a ticket that has already been claimed", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "high", "Already claimed")).data as { id: string };
            await adminClient.from("tickets").update({ agent_id: fakeUser2!.userId }).eq("id", ticket.id);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail2, password: fakePassword2 });

            const res = await claimTicket(ticket.id, fakeUser2!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorMsg).toBeDefined();
            expect(res.errorCode).toBe("42501") // 403 forbidden
        });

        it("refuses to let a non-agent claim a ticket", async () => {
            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "low", "Client cannot claim")).data as { id: string };

            const res = await claimTicket(ticket.id, fakeUser1!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorMsg).toBeDefined();
            expect(res.errorCode).toBe("42501") // 403 forbidden
        });
    });

    describe("findTicketById", () => {
        it("returns the ticket for the owning client", async () => {
            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "low", "Find me")).data as { id: string };

            const res = await findTicketById(ticket.id);

            expect(res.status).toBe("success");
            const row = res.data as { id: string; description: string; status: string };
            expect(row.id).toBe(ticket.id);
            expect(row.description).toBe("Find me");
        });

        it("returns the close_agent username once the ticket is closed", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "low", "Closed lookup")).data as { id: string };
            await adminClient.from("tickets").update({ agent_id: fakeUser2!.userId }).eq("id", ticket.id);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail2, password: fakePassword2 });
            const closeRes = await closeTicket(ticket.id);
            expect(closeRes.status).toBe("success");

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const res = await findTicketById(ticket.id);

            expect(res.status).toBe("success");
            const row = res.data as { id: string; close_agent: { username: string } | null };
            expect(row.id).toBe(ticket.id);
            expect(row.close_agent?.username).toBe(fakeUser2!.username);
        });

        it("does not leak an assigned ticket owned by someone else", async () => {
            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail2, password: fakePassword2 });
            const foreign = (await createTicket(fakeUser2!.userId, "hardware", "low", "Not mine")).data as { id: string };
            // Assign it so the broad "unassigned tickets are visible" policy no longer applies.
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);
            await adminClient.from("tickets").update({ agent_id: fakeUser2!.userId }).eq("id", foreign.id);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const res = await findTicketById(foreign.id);

            expect(res.status).toBe("success");
            expect(res.data).toBeNull();
        });

        it("returns null data for a non-existent ticket id", async () => {
            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const res = await findTicketById("00000000-0000-0000-0000-000000000000");

            expect(res.status).toBe("success");
            expect(res.data).toBeNull();
        });
    });

    describe("closeTicket", () => {
        it("lets the assigned agent close the ticket", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "high", "To be closed")).data as { id: string };
            await adminClient.from("tickets").update({ agent_id: fakeUser2!.userId }).eq("id", ticket.id);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail2, password: fakePassword2 });
            const res = await closeTicket(ticket.id);

            expect(res.status).toBe("success");

            const { data: dbTicket, error } = await adminClient
                .from("tickets")
                .select("status, closed_by")
                .eq("id", ticket.id)
                .maybeSingle();
            expect(error).toBeNull();
            expect(dbTicket?.status).toBe("closed");
            expect(dbTicket?.closed_by).toBe(fakeUser2!.userId);
        });

        it("refuses to let the client close the ticket", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "low", "Client cannot close")).data as { id: string };

            const res = await closeTicket(ticket.id);

            expect(res.status).toBe("fail");
            expect(res.errorMsg).toBeDefined();
            expect(res.errorCode).toBe("42501"); // 403 forbidden
        });

        it("refuses to let an agent who is not assigned close the ticket", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "low", "Other agent")).data as { id: string };

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail2, password: fakePassword2 });
            const res = await closeTicket(ticket.id);

            expect(res.status).toBe("fail");
            expect(res.errorMsg).toBeDefined();
            expect(res.errorCode).toBe("42501"); // 403 forbidden
        });

        it("fails for an unknown ticket id (never assigned, so forbidden)", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail2, password: fakePassword2 });
            const res = await closeTicket("00000000-0000-0000-0000-000000000000");

            // close_ticket checks assignment before existence, so a non-admin
            // gets 42501 rather than P0002 for an unknown id.
            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });
    });

    describe("inProgressTicket", () => {
        it("lets the assigned agent move the ticket to in_progress", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "low", "To progress")).data as { id: string };
            await adminClient.from("tickets").update({ agent_id: fakeUser2!.userId }).eq("id", ticket.id);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail2, password: fakePassword2 });
            const res = await inProgressTicket(ticket.id);

            expect(res.status).toBe("success");

            const { data: dbTicket, error } = await adminClient
                .from("tickets")
                .select("status, closed_by")
                .eq("id", ticket.id)
                .maybeSingle();
            expect(error).toBeNull();
            expect(dbTicket?.status).toBe("in_progress");
            expect(dbTicket?.closed_by).toBeNull();
        });

        it("lets the assigned agent reopen a closed ticket (clears closed_by)", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "low", "Reopen")).data as { id: string };
            await adminClient.from("tickets").update({ agent_id: fakeUser2!.userId }).eq("id", ticket.id);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail2, password: fakePassword2 });
            await closeTicket(ticket.id);
            const res = await inProgressTicket(ticket.id);

            expect(res.status).toBe("success");

            const { data: dbTicket } = await adminClient
                .from("tickets")
                .select("status, closed_by")
                .eq("id", ticket.id)
                .maybeSingle();
            expect(dbTicket?.status).toBe("in_progress");
            expect(dbTicket?.closed_by).toBeNull();
        });

        it("refuses to let the client move the ticket to in_progress", async () => {
            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "low", "Client progress")).data as { id: string };

            const res = await inProgressTicket(ticket.id);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501"); // 403 forbidden
        });

        it("refuses to let an agent who is not assigned move the ticket", async () => {
            await adminClient.from("profiles").update({ role: "agent" }).eq("id", fakeUser2!.userId);

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "low", "Unassigned progress")).data as { id: string };

            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail2, password: fakePassword2 });
            const res = await inProgressTicket(ticket.id);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501"); // 403 forbidden
        });
    });

    describe("findUnassignedTicket", () => {
        it("returns only the tickets without an assigned agent", async () => {
            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const unassignedId = (await createTicket(fakeUser1!.userId, "delivery", "low", "Unassigned ticket")).data as { id: string };

            await createTicket(fakeUser1!.userId, "software", "medium", "Another unassigned");

            const assignedId = (await createTicket(fakeUser1!.userId, "payment", "high", "Assigned one")).data as { id: string };
            await adminClient.from("tickets").update({ agent_id: fakeUser2!.userId }).eq("id", assignedId.id);

            const res = await findUnassignedTicket();

            expect(res.status).toBe("success");
            const tickets = res.data as { id: string }[];
            expect(tickets).toHaveLength(2);
            expect(tickets.some((t) => t.id === unassignedId.id)).toBe(true);
            expect(tickets.some((t) => t.id === assignedId.id)).toBe(false);
        });

        it("returns an empty array when every ticket is assigned", async () => {
            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });
            const ticket = (await createTicket(fakeUser1!.userId, "software", "low", "Assigned")).data as { id: string };
            await adminClient.from("tickets").update({ agent_id: fakeUser2!.userId }).eq("id", ticket.id);

            const res = await findUnassignedTicket();

            expect(res.status).toBe("success");
            expect(res.data).toEqual([]);
        });
    });

    describe("deletTicket", () => {
        it("Delete the open ticket", async () => {
            await supabase.auth.signOut();
            await supabase.auth.signInWithPassword({ email: fakeEmail1, password: fakePassword1 });

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


        it("Cannot delete the ticket which is not open", async () => {
    
            const ticketId = uuidv4()
            await adminClient
                .from("tickets")
                .insert({
                    "client_id": fakeUser1!.userId,
                    "agent_id": null,
                    "category": "delivery",
                    "closed_by": null,
                    "description": "No delete ticket",
                    "priority": "low",
                    "status": "in_progress",
                    "id": ticketId
                });

            const deleteRes = await deleteTicket(ticketId);

            expect(deleteRes.status).toBe("success");
            expect(deleteRes.data).toBeNull();

            // check that the ticket is still present
            const {data, error} = await adminClient
                        .from("tickets")
                        .select("id")
                        .eq("id", ticketId)
                        .maybeSingle();

            expect(data).not.toBeNull();
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
