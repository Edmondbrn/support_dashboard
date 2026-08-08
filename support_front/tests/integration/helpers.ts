import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Default password used for every user created during the integration tests.
 */
export const TEST_PASSWORD = "P@ssw0rd!2026";

function requireEnv(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(
            `Missing env variable "${name}". Add it to the .env file (from .env.example).`
        );
    }
    return value;
}

export const supabaseUrl = requireEnv(
    "VITE_SUPABASE_URL",
    import.meta.env.VITE_SUPABASE_URL
);
export const publishableKey = requireEnv(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
export const secretKey = requireEnv(
    "VITE_SUPABASE_SECRET_KEY",
    import.meta.env.VITE_SUPABASE_SECRET_KEY
);

/**
 * Dedicated client created with the publishable (anon) key.
 * Used to act as a regular authenticated user and verify queries success.
 */
export const anonClient: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl,
    publishableKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * Admin client created with the secret (service role) key.
 * Used to set up the test data and to verify/cleanup the queries results.
 * It bypasses RLS.
 */
export const adminClient: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl,
    secretKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
);

let counter = 0;

function uniqueString(prefix: string): string {
    counter += 1;
    return `${prefix}-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeTestUsername(prefix = "it"): string {
    return uniqueString(prefix).slice(0, 50);
}

export function makeTestEmail(prefix = "it"): string {
    return `${uniqueString(prefix)}@example.com`;
}

export interface TestUserFixture {
    userId: string;
    email: string;
    password: string;
    username: string;
}

/**
 * Admin-side fixture setup: creates a confirmed user in `auth.users`.
 * The `create_profile` trigger runs automatically and fills `public.profiles`.
 */
export async function createTestUser(
    options: { email?: string; username?: string; password?: string } = {}
): Promise<TestUserFixture> {
    const email = options.email ?? makeTestEmail("admin");
    const username = options.username ?? makeTestUsername("admin");
    const password = options.password ?? TEST_PASSWORD;

    const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username }
    });

    if (error) throw new Error(`admin createUser failed: ${error.message}`);
    if (!data.user) throw new Error("admin createUser returned no user");

    return { userId: data.user.id, email, password, username };
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });
    if (error) throw new Error(`admin listUsers failed: ${error.message}`);
    return data.users.find((user) => user.email === email) ?? null;
}

export async function deleteTestUserByEmail(email: string): Promise<void> {
    const user = await findAuthUserByEmail(email);
    if (!user) return;
    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`admin deleteUser failed: ${error.message}`);
}

export type ProfileRole = Database["public"]["Enums"]["roles"];

export interface ProfileRow {
    id: string;
    username: string;
    role: ProfileRole;
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await adminClient
        .from("profiles")
        .select("id, username, role")
        .eq("id", userId)
        .maybeSingle();
    if (error) throw new Error(`profiles select failed: ${error.message}`);
    return data;
}