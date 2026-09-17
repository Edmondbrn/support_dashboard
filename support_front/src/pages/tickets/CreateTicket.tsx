import { Btn } from "@/components/shared/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import useCreateTicket from "@/hooks/tickets/useCreateTicket";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { CircleQuestionMarkIcon, SearchAlertIcon, ShieldXIcon, TicketPlus } from "lucide-react";

const PRIORITIES = [
    { value: "low", label: "Low", icon: CircleQuestionMarkIcon },
    { value: "medium", label: "Medium", icon: SearchAlertIcon },
    { value: "high", label: "High", icon: ShieldXIcon },
] as const;

const CATEGORIES = [
    { value: "software", label: "Software" },
    { value: "hardware", label: "Hardware" },
    { value: "delivery", label: "Delivery" },
    { value: "payment", label: "Payment" },
]
/**
 * Form to create a new ticket.
 */
export default function CreateTicket() {
    useDocumentTitle("New ticket");

    const {
        form,
        setForm,
        isFormReady,
        submitCreateTicket,
        isLoading,
    } = useCreateTicket();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-10">
            <Card className="w-3/4 md:w-1/2 bg-glass text-white">
                <CardHeader>
                    <div className="flex items-center justify-center gap-2">
                        <TicketPlus className="size-6 text-orange-300" />
                        <CardTitle className="text-xl font-semibold">Create a ticket</CardTitle>
                    </div>
                </CardHeader>

                <CardContent>
                    <FieldGroup>

                        <Field>
                            <FieldLabel htmlFor="ticket-description">Description</FieldLabel>
                            <Textarea
                                id="ticket-description"
                                className="border-white/30"
                                placeholder="Enter a short description of your problem"
                                minLength={1}
                                maxLength={255}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                            <FieldDescription className="text-slate-200 text-sm">
                                Describe your problem in a few words ({form.description.length}/255)
                            </FieldDescription>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="ticket-priority">Priority</FieldLabel>
                            <Select value={form.priority} onValueChange={(value) => { if (value) { setForm({ ...form, priority: value }); } }}>
                                <SelectTrigger id="ticket-priority" className="w-full border-white/30 cursor-pointer">
                                    <SelectValue placeholder="Select a priority level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITIES.map((priority) => (
                                        <SelectItem key={priority.value} value={priority.value}>
                                            <priority.icon />
                                            {priority.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="ticket-category">Category</FieldLabel>
                            <Select value={form.category} onValueChange={(value) => { if (value) { setForm({ ...form, category: value })} }}>
                                <SelectTrigger id="ticket-category" className="w-full border-white/30 cursor-pointer">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field>
                            <Btn
                                version="secondary"
                                onClick={() => submitCreateTicket()}
                                isLoading={isLoading}
                                disabled={!isFormReady()}
                            >
                                Create ticket
                            </Btn>
                        </Field>
                    </FieldGroup>
                </CardContent>
            </Card>
        </div>
    );
}