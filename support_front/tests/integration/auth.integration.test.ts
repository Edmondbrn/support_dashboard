import { afterAll, describe, expect, it } from "vitest";
import { type User } from "@supabase/supabase-js";

import { signin, signout, signUp } from "@/apis/auth";
import { supabase } from "@/lib/supabase";
import {
    anonClient,
    createTestUser,
    deleteTestUserByEmail,
    findAuthUserByEmail,
    getProfile,
    makeTestEmail,
    makeTestUsername,
    TEST_PASSWORD
} from "./helpers";


const trackedEmails: string[] = [];

function track(email: string): void {
    trackedEmails.push(email);
}

afterAll(async () => {
    for (const email of trackedEmails) {
        await deleteTestUserByEmail(email);
    }
});

describe("signUp", () => {
    it("returns success and creates the matching profile in the profiles table", async () => {
        const email = makeTestEmail("signup");
        const username = makeTestUsername("signup");
        track(email);

        const res = await signUp(email, TEST_PASSWORD, username);

        expect(res.status).toBe("success");

        const authUser = await findAuthUserByEmail(email);
        expect(authUser).not.toBeNull();

        const profile = await getProfile(authUser!.id);
        expect(profile).not.toBeNull();
        expect(profile!.id).toBe(authUser!.id);
        expect(profile!.username).toBe(username);
        expect(profile!.role).toBe("client");
    });

    it("returns a fail status with an already registered email", async () => {
        const fixture = await createTestUser();
        track(fixture.email);

        const res = await signUp(fixture.email, TEST_PASSWORD, makeTestUsername("dup"));

        expect(res.status).toBe("fail");
        expect(res.errorMsg).toBeDefined();
        expect(res.errorCode).toBe("user_already_exists");
    });
});

describe("signin", () => {
    it("returns the user on valid credentials", async () => {
        const fixture = await createTestUser();
        track(fixture.email);

        const res = await signin(fixture.email, fixture.password);

        expect(res.status).toBe("success");
        expect((res.data as User | undefined)?.email).toBe(fixture.email);
        expect((res.data as User | undefined)?.id).toBe(fixture.userId);
    });

    it("returns a fail with a wrong password", async () => {
        const fixture = await createTestUser();
        track(fixture.email);

        const res = await signin(fixture.email, "WrongPassword!2026");

        expect(res.status).toBe("fail");
    });
});

describe("signout", () => {
    it("clears the active session", async () => {
        const fixture = await createTestUser();
        track(fixture.email);

        const signinRes = await signin(fixture.email, fixture.password);
        expect(signinRes.status).toBe("success");

        const signoutRes = await signout();
        expect(signoutRes.status).toBe("success");

        const { data } = await supabase.auth.getSession();
        expect(data.session).toBeNull();
    });
});

describe("anon client profile read", () => {
    it("lets an authenticated user read its own profile through the publishable key", async () => {
        const fixture = await createTestUser();
        track(fixture.email);

        const { data: sessionData, error: signinError } =
            await anonClient.auth.signInWithPassword({
                email: fixture.email,
                password: fixture.password
            });
        expect(signinError).toBeNull();
        expect(sessionData.session).not.toBeNull();

        const { data: profile, error } = await anonClient
            .from("profiles")
            .select("id, username, role")
            .eq("id", fixture.userId)
            .maybeSingle();

        expect(error).toBeNull();
        expect(profile).not.toBeNull();
        expect(profile!.username).toBe(fixture.username);
    });
});