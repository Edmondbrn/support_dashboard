import { getDemoAccounts } from "@/apis/demoAccounts";
import type { DemoAccount } from "@/apis/types";
import { useQuery } from "@tanstack/react-query";


/**
 * Fetch the demo login accounts (client1, agent1, admin) from the
 * `demo_accounts` table so the signin page can offer one-click login
 * without hardcoding credentials.
 */
export function useDemoAccounts() {
    return useQuery({
        queryKey: ["demo-accounts"],
        staleTime: 60 * 60 * 1000, // 1 hour, demo credentials never change
        queryFn: async (): Promise<DemoAccount[]> => {
            const res = await getDemoAccounts();
            if (res.status === "fail") {
                console.error("[ERROR] Cannot fetch demo accounts", res.errorMsg);
                return [];
            }

            return res.data as DemoAccount[];
        },
    });
}
