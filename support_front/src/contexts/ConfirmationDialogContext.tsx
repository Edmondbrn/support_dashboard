"use client";

import {
    useCallback,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { ConfirmationDialog } from "../components/shared/confirmationDialog";
import { ConfirmContext, type ConfirmOptions, type ConfirmFn } from "@/contexts/confirm-context";

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const settle = useCallback((value: boolean) => {
        resolver.current?.(value);
        resolver.current = null;
        setState(null);
    }, []);

    const confirm = useCallback<ConfirmFn>(
        (options) =>
            new Promise<boolean>((resolve) => {
                resolver.current = resolve;
                setState(options);
            }),
        [],
    );

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <ConfirmationDialog
                open={state !== null}
                onOpenChange={(open) => {
                    if (!open) settle(false);
                }}
                content={state?.content ?? ""}
                onConfirm={() => settle(true)}
            />
        </ConfirmContext.Provider>
    );
}
