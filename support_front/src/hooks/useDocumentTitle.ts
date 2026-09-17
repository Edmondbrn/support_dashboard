import { useEffect } from "react";

const APP_NAME = "Support Desk";

/**
 * Syncs the browser tab title with the current page.
 * Resulting format: "<Page> · Support Desk".
 * `useEffect` is appropriate here: it syncs with an external
 * dependency (the document) outside of React's render tree.
 */
export function useDocumentTitle(page: string) {
    useEffect(() => {
        document.title = `${page} · ${APP_NAME}`;
    }, [page]);
}
