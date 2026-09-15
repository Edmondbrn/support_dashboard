import { RealtimeContext, type RealtimeContextValue } from "@/contexts/realtime-context";
import { useContext } from "react";

export function useRealtime(): RealtimeContextValue {
    const ctx = useContext(RealtimeContext);
    if (!ctx) throw new Error("useRealtime must be used within a <RealtimeProvider>");
    return ctx;
}
