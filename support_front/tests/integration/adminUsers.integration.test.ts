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
import { deleteUserAccount, findAllUsersForAdmin, updateUserRole } from "@/apis/admin";
import type { AdminUser } from "@/apis/types";

const trackedEmails: string[] = [];

let adminUser: TestUserFixture | undefined = undefined;
let secondAdmin: TestUserFixture | undefined = undefined;
let agentUser: TestUserFixture | undefined = undefined;
let clientUser: TestUserFixture | undefined = undefined;

function track(email: string): void {
    trackedEmails.push(email);
}

async function signInAs(user: TestUserFixture): Promise<void> {
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({ email: user.email, password: user.password });
}

afterAll(async () => {
    await supabase.auth.signOut();
    for (const email of trackedEmails) {
        await deleteTestUserByEmail(email);
    }
});

beforeAll(async () => {
    adminUser = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("admin") });
    secondAdmin = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("admin") });
    agentUser = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("agent") });
    clientUser = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("client") });

    await adminClient.from("profiles").update({ role: "admin" }).eq("id", adminUser!.userId);
    await adminClient.from("profiles").update({ role: "admin" }).eq("id", secondAdmin!.userId);
    await adminClient.from("profiles").update({ role: "agent" }).eq("id", agentUser!.userId);

    for (const user of [adminUser, secondAdmin, agentUser, clientUser]) {
        track(user!.email);
    }
});

beforeEach(async () => {
    // restore roles possibly changed by a previous test (delete tests use fresh users)
    await adminClient.from("profiles").update({ role: "admin" }).eq("id", adminUser!.userId);
    await adminClient.from("profiles").update({ role: "admin" }).eq("id", secondAdmin!.userId);
    await adminClient.from("profiles").update({ role: "agent" }).eq("id", agentUser!.userId);
    await adminClient.from("profiles").update({ role: "client" }).eq("id", clientUser!.userId);
});

describe("admin users api tests", () => {

    describe("findAllUsersForAdmin", () => {
        it("returns every user with role, creation date and last sign-in", async () => {
            await signInAs(adminUser!);
            const res = await findAllUsersForAdmin();

            expect(res.status).toBe("success");
            const users = res.data as AdminUser[];
            const byId = new Map(users.map((u) => [u.id, u]));

            for (const fixture of [adminUser!, secondAdmin!, agentUser!, clientUser!]) {
                const row = byId.get(fixture.userId);
                expect(row).toBeDefined();
                expect(row!.username).toBe(fixture.username);
                expect(row!.created_at).toBeDefined();
                expect("last_sign_in_at" in row!).toBe(true);
            }
            expect(byId.get(adminUser!.userId)?.role).toBe("admin");
            expect(byId.get(agentUser!.userId)?.role).toBe("agent");
            expect(byId.get(clientUser!.userId)?.role).toBe("client");
        });

        it("exposes last_sign_in_at once the user signed in", async () => {
            await signInAs(clientUser!);

            await signInAs(adminUser!);
            const res = await findAllUsersForAdmin();

            expect(res.status).toBe("success");
            const row = (res.data as AdminUser[]).find((u) => u.id === clientUser!.userId);
            expect(row?.last_sign_in_at).not.toBeNull();
        });

        it("refuses a non-admin caller with 403", async () => {
            await signInAs(agentUser!);
            const agentRes = await findAllUsersForAdmin();
            expect(agentRes.status).toBe("fail");
            expect(agentRes.errorCode).toBe("42501");

            await signInAs(clientUser!);
            const clientRes = await findAllUsersForAdmin();
            expect(clientRes.status).toBe("fail");
            expect(clientRes.errorCode).toBe("42501");
        });
    });

    describe("updateUserRole", () => {
        it("lets an admin promote a client to agent", async () => {
            await signInAs(adminUser!);
            const res = await updateUserRole(clientUser!.userId, "agent");

            expect(res.status).toBe("success");

            const { data: profile } = await adminClient
                .from("profiles")
                .select("role")
                .eq("id", clientUser!.userId)
                .maybeSingle();
            expect(profile?.role).toBe("agent");
        });

        it("lets an admin demote another admin when several remain", async () => {
            await signInAs(adminUser!);
            const res = await updateUserRole(secondAdmin!.userId, "agent");

            expect(res.status).toBe("success");

            const { data: profile } = await adminClient
                .from("profiles")
                .select("role")
                .eq("id", secondAdmin!.userId)
                .maybeSingle();
            expect(profile?.role).toBe("agent");
        });

        it("is a no-op success when the role is unchanged", async () => {
            await signInAs(adminUser!);
            const res = await updateUserRole(clientUser!.userId, "client");

            expect(res.status).toBe("success");
        });

        it("refuses an admin changing their own role with 403", async () => {
            await signInAs(adminUser!);
            const res = await updateUserRole(adminUser!.userId, "agent");

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });

        it("refuses a non-admin caller with 403", async () => {
            await signInAs(agentUser!);
            const res = await updateUserRole(clientUser!.userId, "agent");

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });

        it("fails with not-found for an unknown user id", async () => {
            await signInAs(adminUser!);
            const res = await updateUserRole("00000000-0000-0000-0000-000000000000", "agent");

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("P0002");
        });
    });

    describe("deleteUserAccount", () => {
        it("lets an admin delete a client account with its tickets", async () => {
            const victim = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("victim") });
            track(victim.email);

            await signInAs(victim);
            const { createTicket } = await import("@/apis/public");
            const ticket = (await createTicket(victim.userId, "software", "low", "Gone with me")).data as { id: string };

            await signInAs(adminUser!);
            const res = await deleteUserAccount(victim.userId);

            expect(res.status).toBe("success");

            const { data: profile } = await adminClient
                .from("profiles")
                .select("id")
                .eq("id", victim.userId)
                .maybeSingle();
            expect(profile).toBeNull();

            const { data: ticketRow } = await adminClient
                .from("tickets")
                .select("id")
                .eq("id", ticket.id)
                .maybeSingle();
            expect(ticketRow).toBeNull();
        });

        it("lets an admin delete another admin when several remain", async () => {
            const extra = await createTestUser({ email: makeTestEmail(), username: makeTestUsername("admin") });
            track(extra.email);
            await adminClient.from("profiles").update({ role: "admin" }).eq("id", extra.userId);

            await signInAs(adminUser!);
            const res = await deleteUserAccount(extra.userId);

            expect(res.status).toBe("success");

            const { data: profile } = await adminClient
                .from("profiles")
                .select("id")
                .eq("id", extra.userId)
                .maybeSingle();
            expect(profile).toBeNull();
        });

        it("refuses an admin deleting their own account with 403", async () => {
            await signInAs(adminUser!);
            const res = await deleteUserAccount(adminUser!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });

        it("refuses a non-admin caller with 403", async () => {
            await signInAs(agentUser!);
            const res = await deleteUserAccount(clientUser!.userId);

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("42501");
        });

        it("fails with not-found for an unknown user id", async () => {
            await signInAs(adminUser!);
            const res = await deleteUserAccount("00000000-0000-0000-0000-000000000000");

            expect(res.status).toBe("fail");
            expect(res.errorCode).toBe("P0002");
        });
    });
});
