import { createTicket } from "@/apis/public";
import type { TicketCategory, TicketPriority } from "@/apis/types";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appRoutes } from "@/config";
import { showErrorToast, showSuccessToast } from "@/utils/showToast";
import { useState } from "react";
import { useNavigate } from "react-router";

export interface CreateTicketForm {
    description: string,
    priority: TicketPriority,
    category: TicketCategory,
    categoryLabel: string,
}

const DEFAULT_FORM: CreateTicketForm = {
    description: "",
    priority: "low",
    category: "software",
    categoryLabel: ""
};

export default function useCreateTicket() {

    const { user } = useAuth();
    const [form, setForm] = useState<CreateTicketForm>(DEFAULT_FORM);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    /**
     * Check if all the required fields are filled
     * @returns 
     */
    const isFormReady = () => {
        return form.description.trim() !== "";
    }

    const mutation = useMutation({
        mutationFn: () => createTicket(
            user!.id,
            form.category,
            form.priority,
            form.description,
        ),
        onSuccess: (res) => {
            if (res.status === "fail") {
                showErrorToast(`Error, cannot create the ticket because: ${res.errorMsg}`);
                return;
            }
            // invalidate cache query ticket to be able to reftech them after a creation
            queryClient.invalidateQueries({queryKey: [{"client": user?.id, "action": "find-tickets"}]})
            showSuccessToast("Ticket created successfully");
            navigate(appRoutes.TICKETS);
        },
        onError: (error) => {
            showErrorToast(`Error, cannot create the ticket because: ${error.message}`);
        },
    });

    /**
     * Validate the form and send the ticket creation request
     * @returns 
     */
    function submitCreateTicket() {
        if (!user) {
            showErrorToast("You must be connected to create a ticket");
            return;
        }

        if (!isFormReady()) {
            showErrorToast("Missing field: description or category");
            return;
        }

        mutation.mutate();
    }


    return {
        form,
        setForm,
        isFormReady,
        submitCreateTicket,
        isLoading: mutation.isPending,
        navigate,
    };
}