import { findCategories } from "@/apis/public";
import type { Category } from "@/apis/types";
import { useQuery } from "@tanstack/react-query";

export const CATEGORIES_QUERY_KEY = ["categories"];

// Categories are near-static (admin managed), so keep the cache fresh for a long time.
const CATEGORIES_STALE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch the ticket categories and cache them for a long time.
 * Handles the ApiCallResponse mapping and error surfacing for react-query.
 */
export default function useCategories() {
    const query = useQuery({
        queryKey: CATEGORIES_QUERY_KEY,
        staleTime: CATEGORIES_STALE_MS,
        queryFn: async (): Promise<Category[]> => {
            const res = await findCategories();
            if (res.status === "fail") {
                throw new Error(res.errorMsg);
            }
            return res.data as Category[];
        },
    });

    return {
        categories: query.data ?? [],
        isLoadingCategories: query.isPending,
        isErrorCategories: query.isError,
        errorCategories: query.error,
    };
}