import { createContext } from "react";

export interface ConfirmOptions {
    title?: string;
    content: string;
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);
