import { useRef } from "react";

/**
 * Hook which handle file selection from file explorer, conversion it
 * @returns 
 */
export default function useMessageFileUploader() {

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    return {
        fileInputRef,
    };

}