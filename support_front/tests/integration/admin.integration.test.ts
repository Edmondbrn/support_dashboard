import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { supabase } from "@/lib/supabase";
import {
    createTestUser,
    deleteTestUserByEmail,
    adminClient,
    type TestUserFixture,
    makeTestEmail,
    makeTestUsername,
} from "./helpers";
import { findAllTicketsForAdmin, getAgentTicketStats, reassignTicket, searchAgents } from "@/apis/admin";
import type { AdminTicket, AgentOption, AgentStats } from "@/apis/types";

const trackedEmails: string[] = [];

let adminUser: TestUserFixture | undefined = undefined;
let clientUser: TestUserFixture | undefined = undefined;
let otherClientUser: TestUserFixture | undefined = undefined;
let agentA: TestUserFixture | undefined = undefined;
let agentB: TestUserFixture | undefined = undefined;
let idleAgent: TestUserFixture | undefined = undefined;

function track(email: string): void {
    trackedEmails.push(email);
}

async function signInAs(user: TestUserFixture): Promise<void> {
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({ email: user.email, password: user.password });
}

/**
 * Setup helper: inserts a ticket directly (bypasses RLS via the service-role
 * client) so tests don't depend on the createTicket RLS path.
 */
async function insertTicket(options: {
    clientId: string;
    description: string;
    agentId?: string | null;
    status?: "open" | "in_progress" | "closed";
    category?: "software" | "hardware" | "delivery" | "payment";
    priority?: "low" | "medium" | "high";
}): Promise<string> {
    const { data, error } = await adminClient
        .from("tickets")
        .insert({
            client_id: options.clientId,
            description: options.description,
            agent_id: options.agentId ?? null,
            status: options.status ?? "open",
            category: options.category ?? "software",
            priority: options.priority ?? "low",
        })
        .select("id")
        .single();

    if (error) throw new Error(`Failed to insert ticket fixture: ${error.message}`);
    return data.id;
}

afterAll(async () => {
    await supabase.auth.signOut();
    for (const email of trackedEmails) {
        await deleteTestUserByEmail(email);
    }
});

beforeAll(async () => {
    adminUser = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("admin") });
    clientUser = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("client") });
    otherClientUser = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("client") });
    agentA = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("agent") });
    agentB = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("agent") });
    idleAgent = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("agent") });

    await adminClient.from("profiles").update({ role: "admin" }).eq("id", adminUser!.userId);
    await adminClient.from("profiles").update({ role: "agent" }).eq("id", agentA!.userId);
    await adminClient.from("profiles").update({ role: "agent" }).eq("id", agentB!.userId);
    await adminClient.from("profiles").update({ role: "agent" }).eq("id", idleAgent!.userId);

    for (const user of [adminUser, clientUser, otherClientUser, agentA, agentB, idleAgent]) {
        track(user!.email);
    }
});

beforeEach(async () => {
    const { error } = await adminClient
        .from("tickets")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // matches all real rows

    if (error) {
        throw new Error(`Failed to reset tickets table: ${error.message}`);
    }
});

describe("admin api tests", () => {

    describe("findAllTicketsForAdmin", () => {
        it("returns every ticket with creator and agent embedded, newest first", async () => {
            const firstId = await insertTicket({ clientId: clientUser!.userId, description: "First ticket" });
            const secondId = await insertTicket({
                clientId: otherClientUser!.userId,
                description: "Second ticket",
                agentId: agentA!.userId,
            });

            await signInAs(adminUser!);
            const res = await findAllTicketsForAdmin();

            expect(res.status).toBe("success");
            const tickets = res.data as AdminTicket[];
            expect(tickets).toHaveLength(2);

            const byId = new Map(tickets.map((t) => [t.id, t]));
            expect(byId.get(firstId)?.client?.username).toBe(clientUser!.username);
            expect(byId.get(firstId)?.agent).toBeNull();
            expect(byId.get(firstId)?.agent_id).toBeNull();
            expect(byId.get(secondId)?.client?.username).toBe(otherClientUser!.username);
            expect(byId.get(secondId)?.agent?.username).toBe(agentA!.username);
            expect(byId.get(secondId)?.agent?.id).toBe(agentA!.userId);

            // newest first
            expect(new Date(tickets[0].created_at).getTime())
                .toBeGreaterThanOrEqual(new Date(tickets[1].created_at).getTime());
        });

        it("returns an empty array when there are no tickets", async () => {
            await signInAs(adminUser!);
            const res = await findAllTicketsForAdmin();

            expect(res.status).toBe("success");
            expect(res.data).toEqual([]);
        });

        it("does not leak other clients' tickets to a client caller", async () => {
            await insertTicket({ clientId: clientUser!.userId, description: "Mine" });
            // Assigned to someone else, so neither the "client owns the ticket"
            // nor the agent-scoped policy applies to a client caller.
            await insertTicket({
                clientId: otherClientUser!.userId,
                description: "Not mine",
                agentId: agentA!.userId,
            });

            await signInAs(clientUser!);
            const res = await findAllTicketsForAdmin();

            expect(res.status).toBe("success");
            const tickets = res.data as AdminTicket[];
            expect(tickets).toHaveLength(1);
            expect(tickets[0].description).toBe("Mine");
        });

        it("does not leak another client's unassigned ticket to a client caller", async () => {
            await insertTicket({ clientId: clientUser!.userId, description: "Mine unassigned" });
            await insertTicket({ clientId: otherClientUser!.userId, description: "Theirs unassigned" });

            await signInAs(clientUser!);
            const res = await findAllTicketsForAdmin();

            expect(res.status).toBe("success");
            const tickets = res.data as AdminTicket[];
            expect(tickets).toHaveLength(1);
            expect(tickets[0].description).toBe("Mine unassigned");
        });

        it("lets an agent see own assigned plus all unassigned tickets, but not others' assigned", async () => {
            const mineAssigned = await insertTicket({
                clientId: clientUser!.userId,
                description: "Mine assigned",
                agentId: agentA!.userId,
            });
            const unassigned = await insertTicket({
                clientId: otherClientUser!.userId,
                description: "Unassigned",
            });
            await insertTicket({
                clientId: clientUser!.userId,
                description: "Other agent",
                agentId: agentB!.userId,
            });

            await signInAs(agentA!);
            const res = await findAllTicketsForAdmin();

            expect(res.status).toBe("success");
            const ids = (res.data as AdminTicket[]).map((t) => t.id);
            expect(ids).toContain(mineAssigned);
            expect(ids).toContain(unassigned);
            expect(res.data as AdminTicket[]).toHaveLength(2);
        });
    });

    describe("searchAgents", () => {
        it("finds an agent by partial username (case-insensitive)", async () => {
            const token = `searchable-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            await adminClient.from("profiles").update({ username: token }).eq("id", agentA!.userId);

            await signInAs(adminUser!);
            const res = await searchAgents(token.slice(0, 12));

            expect(res.status).toBe("success");
            const agents = res.data as AgentOption[];
            expect(agents.map((a) => a.id)).toContain(agentA!.userId);
            expect(agents.find((a) => a.id === agentA!.userId)?.username).toBe(token);
        });

        it("returns all agents when the query is empty", async () => {
            await signInAs(adminUser!);
            const res = await searchAgents("");

            expect(res.status).toBe("success");
            const ids = (res.data as AgentOption[]).map((a) => a.id);
            expect(ids).toContain(agentA!.userId);
            expect(ids).toContain(agentB!.userId);
            expect(ids).toContain(idleAgent!.userId);
        });

        it("excludes non-agent profiles and returns [] when nothing matches", async () => {
            await signInAs(adminUser!);
            const res = await searchAgents("no-such-agent-zzzz");

            expect(res.status).toBe("success");
            expect(res.data).toEqual([]);
        });

        it("respects the limit parameter", async () => {
            await signInAs(adminUser!);
            const res = await searchAgents("", 1);

            expect(res.status).toBe("success");
            expect((res.data as AgentOption[]).length).toBeLessThanOrEqual(1);
        });

        it("does not expose agents to a client with no assigned agent except admin", async () => {
            await signInAs(clientUser!);
            const res = await searchAgents("");

            expect(res.status).toBe("success");
            (res.data as AgentOption[]).forEach(element => {
                expect(element.role).toBe("admin");
            });;
        });

        it("includes admin profiles so an admin can select themselves", async () => {
            await signInAs(adminUser!);
            const res = await searchAgents(adminUser!.username);

            expect(res.status).toBe("success");
            const agents = res.data as AgentOption[];
            expect(agents.map((a) => a.id)).toContain(adminUser!.userId);
            expect(agents.find((a) => a.id === adminUser!.userId)?.role).toBe("admin");
        });

        it("excludes client profiles", async () => {
            await signInAs(adminUser!);
            const res = await searchAgents(clientUser!.username);

            expect(res.status).toBe("success");
            expect(res.data).toEqual([]);
        });

        it("lets an agent caller search agents (is_agent RLS)", async () => {
            await signInAs(agentA!);
            const res = await searchAgents("");

            expect(res.status).toBe("success");
            const ids = (res.data as AgentOption[]).map((a) => a.id);
            expect(ids).toContain(agentA!.userId);
            expect(ids).toContain(agentB!.userId);
        });
    });

    describe("getAgentTicketStats", () => {
        it("returns per-status counts for the agent's tickets", async () => {
            await insertTicket({ clientId: clientUser!.userId, description: "Open 1", agentId: agentA!.userId });
            await insertTicket({ clientId: clientUser!.userId, description: "Open 2", agentId: agentA!.userId });
            await insertTicket({
                clientId: clientUser!.userId,
                description: "Closed 1",
                agentId: agentA!.userId,
                status: "closed",
            });
            await insertTicket({
                clientId: clientUser!.userId,
                description: "Other agent",
                agentId: agentB!.userId,
                status: "in_progress",
            });

            await signInAs(adminUser!);
            const res = await getAgentTicketStats(agentA!.userId);

            expect(res.status).toBe("success");
            const counts = new Map(
                (res.data as AgentStats[]).map((row) => [row.status, Number(row.count)]),
            );
            expect(counts.get("open")).toBe(2);
            expect(counts.get("closed")).toBe(1);
            expect(counts.has("in_progress")).toBe(false);
        });

        it("returns an empty array for an agent with no tickets", async () => {
            await signInAs(adminUser!);
            const res = await getAgentTicketStats(idleAgent!.userId);

            expect(res.status).toBe("success");
            expect(res.data).toEqual([]);
        });

        it("refuses a non-admin caller with 403", async () => {
            await signInAs(agentA!);
            const res = await getAgentTicketStats(agentA!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });

        it("refuses a client caller with 403", async () => {
            await signInAs(clientUser!);
            const res = await getAgentTicketStats(agentA!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });

        it("returns in_progress counts when present", async () => {
            await insertTicket({
                clientId: clientUser!.userId,
                description: "WIP",
                agentId: agentA!.userId,
                status: "in_progress",
            });

            await signInAs(adminUser!);
            const res = await getAgentTicketStats(agentA!.userId);

            expect(res.status).toBe("success");
            const counts = new Map(
                (res.data as AgentStats[]).map((row) => [row.status, Number(row.count)]),
            );
            expect(counts.get("in_progress")).toBe(1);
        });

        it("returns an empty array for an unknown agent id", async () => {
            await signInAs(adminUser!);
            const res = await getAgentTicketStats("00000000-0000-0000-0000-000000000000");

            expect(res.status).toBe("success");
            expect(res.data).toEqual([]);
        });
    });

    describe("reassignTicket", () => {
        it("lets an admin move a ticket from one agent to another", async () => {
            const ticketId = await insertTicket({
                clientId: clientUser!.userId,
                description: "Move me",
                agentId: agentA!.userId,
            });

            await signInAs(adminUser!);
            const res = await reassignTicket(ticketId, agentB!.userId);

            expect(res.status).toBe("success");

            const { data: dbTicket, error } = await adminClient
                .from("tickets")
                .select("agent_id")
                .eq("id", ticketId)
                .maybeSingle();
            expect(error).toBeNull();
            expect(dbTicket?.agent_id).toBe(agentB!.userId);
        });

        it("lets an admin assign an unassigned ticket", async () => {
            const ticketId = await insertTicket({ clientId: clientUser!.userId, description: "Pick me up" });

            await signInAs(adminUser!);
            const res = await reassignTicket(ticketId, agentA!.userId);

            expect(res.status).toBe("success");

            const { data: dbTicket } = await adminClient
                .from("tickets")
                .select("agent_id")
                .eq("id", ticketId)
                .maybeSingle();
            expect(dbTicket?.agent_id).toBe(agentA!.userId);
        });

        it("refuses a non-admin caller with 403", async () => {
            const ticketId = await insertTicket({
                clientId: clientUser!.userId,
                description: "Nope",
                agentId: agentA!.userId,
            });

            await signInAs(agentA!);
            const res = await reassignTicket(ticketId, agentB!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });

        it("lets an admin assign an unassigned ticket to themselves", async () => {
            const ticketId = await insertTicket({ clientId: clientUser!.userId, description: "Self assign" });

            await signInAs(adminUser!);
            const res = await reassignTicket(ticketId, adminUser!.userId);

            expect(res.status).toBe("success");

            const { data: dbTicket } = await adminClient
                .from("tickets")
                .select("agent_id")
                .eq("id", ticketId)
                .maybeSingle();
            expect(dbTicket?.agent_id).toBe(adminUser!.userId);
        });

        it("lets an admin move a ticket from an agent to themselves", async () => {
            const ticketId = await insertTicket({
                clientId: clientUser!.userId,
                description: "Take over",
                agentId: agentA!.userId,
            });

            await signInAs(adminUser!);
            const res = await reassignTicket(ticketId, adminUser!.userId);

            expect(res.status).toBe("success");

            const { data: dbTicket } = await adminClient
                .from("tickets")
                .select("agent_id")
                .eq("id", ticketId)
                .maybeSingle();
            expect(dbTicket?.agent_id).toBe(adminUser!.userId);
        });

        it("refuses a client caller with 403", async () => {
            const ticketId = await insertTicket({ clientId: clientUser!.userId, description: "Nope" });

            await signInAs(clientUser!);
            const res = await reassignTicket(ticketId, agentA!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });

        it("refuses to reassign a closed ticket with 403", async () => {
            const ticketId = await insertTicket({
                clientId: clientUser!.userId,
                description: "Closed move",
                agentId: agentA!.userId,
                status: "closed",
            });

            await signInAs(adminUser!);
            const res = await reassignTicket(ticketId, agentB!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");

            const { data: dbTicket } = await adminClient
                .from("tickets")
                .select("agent_id")
                .eq("id", ticketId)
                .maybeSingle();
            expect(dbTicket?.agent_id).toBe(agentA!.userId);
        });

        it("refuses a target that is not an agent with 403", async () => {
            const ticketId = await insertTicket({ clientId: clientUser!.userId, description: "Nope" });

            await signInAs(adminUser!);
            const res = await reassignTicket(ticketId, clientUser!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });

        it("fails with not-found for an unknown ticket id", async () => {
            await signInAs(adminUser!);
            const res = await reassignTicket("00000000-0000-0000-0000-000000000000", agentA!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("P0002");
        });

        it("fails for an unknown agent id", async () => {
            const ticketId = await insertTicket({ clientId: clientUser!.userId, description: "Nope" });

            await signInAs(adminUser!);
            const res = await reassignTicket(ticketId, "00000000-0000-0000-0000-000000000000");

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });
    });
});
