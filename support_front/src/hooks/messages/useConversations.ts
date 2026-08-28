import { findUserConversations } from "@/apis/messages";
import type { UserConversation } from "@/apis/types";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query"


export const conversationKey = (userId : string) => ["conversation-user", userId]


export function useConversations() {

    const { user, profile } = useAuth();

    const conversationQuery = useQuery({
        queryKey: conversationKey(user?.id ?? "anon"),
        queryFn: async (): Promise<UserConversation[]> => {
            const res = await findUserConversations();
            if (res.status !== "success") {
                throw new Error(res.errorMsg ?? "Failed to load conversation");
            }
            return res.data as UserConversation[];
        },
        staleTime: 1000 * 60 * 10, // 10 minutes, updated by realtime
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false, 
    })

    return {
        currentUserId: user?.id,
        currentUsername: profile?.username,
        conversationQuery
    }

}