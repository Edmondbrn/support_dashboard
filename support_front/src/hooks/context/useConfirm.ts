import { ConfirmContext, type ConfirmFn } from "@/contexts/confirm-context";
import { useContext } from "react";

export function useConfirm(): ConfirmFn {
    const confirm = useContext(ConfirmContext);
    if (!confirm) {
        throw new Error("useConfirm must be used within a <ConfirmProvider>");
    }
    return confirm;
}
