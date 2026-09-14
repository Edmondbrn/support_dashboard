import { findUserConversations } from "@/apis/messages";
import type { UserConversation } from "@/apis/types";
import { useAuth } from "@/hooks/context/useAuth";
import { useInfiniteQuery } from "@tanstack/react-query";

export const conversationKey = (userId: string) => ["conversation-user", userId];

const PAGE_SIZE = 10;
export const MAX_LOADED_CONVERSATIONS = 50;


type ConversationCursor = {
  lastLoadedTicketId: string;
  lastMessageAt: string;
} | null;


export function useConversations() {
  const { user, profile } = useAuth();

  const conversationQuery = useInfiniteQuery({
    queryKey: conversationKey(user?.id ?? "anon"),
    queryFn: async ({ pageParam }: { pageParam: ConversationCursor }): Promise<UserConversation[]> => {
      const res = await findUserConversations(
        pageParam?.lastLoadedTicketId,
        pageParam?.lastMessageAt,
      );
      if (res.status !== "success") {
        throw new Error(res.errorMsg ?? "Failed to load conversation");
      }
      return res.data as UserConversation[];
    },
    initialPageParam: null as ConversationCursor,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flat().length;
      if (lastPage.length < PAGE_SIZE || loaded >= MAX_LOADED_CONVERSATIONS) {
        return undefined; // no more rows, or hit the max cap
      }
      const last = lastPage[lastPage.length - 1];
      return {
        lastLoadedTicketId: last.id,
        lastMessageAt: last.last_message_at ?? last.created_at, // match RPC COALESCE
      };
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  return {
    currentUserId: user?.id,
    currentUsername: profile?.username,
    conversations: conversationQuery.data?.pages.flat() ?? [],
    conversationQuery,
  };
}