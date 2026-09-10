"use client";

import { X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Btn } from "@/components/shared/button";

interface ConfirmationDialogContentProps {
    content: string;
    onConfirm: () => void;
    onCancel: () => void;
    onClose: () => void;
}

function ConfirmationDialogContent({
    content,
    onConfirm,
    onCancel,
    onClose,
}: ConfirmationDialogContentProps) {
    return (
        <Card className="w-[min(90vw,20rem)] bg-glass text-white">
            <CardHeader className="flex justify-between">
                <span className="text-lg font-semibold">Confirmation</span>
                <button className="cursor-pointer" onClick={onClose}>
                    <X />
                </button>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-5 text-sm text-white">
                {/* content preview */}
                {
                    content && <p className="line-clamp-2 wrap-break-words whitespace-normal text-md">{content}</p>
                }

                <div className="flex flex-col md:flex-row gap-2 md:ml-auto">
                    <Btn version="primary" onClick={onCancel}>
                        Cancel
                    </Btn>
                    <Btn version="secondary" onClick={onConfirm}>
                        Confirm
                    </Btn>
                </div>
            </CardContent>
        </Card>
    );
}

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    content: string;
    onConfirm: () => void;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    content,
    onConfirm,
}: ConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="border-none bg-transparent shadow-none p-0 outline-none">
                <ConfirmationDialogContent
                    content={content}
                    onConfirm={onConfirm}
                    onCancel={onOpenChange.bind(null, false)}
                    onClose={onOpenChange.bind(null, false)}
                />
            </AlertDialogContent>
        </AlertDialog>
    );
}