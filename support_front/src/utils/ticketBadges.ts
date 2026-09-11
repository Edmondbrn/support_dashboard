import type { TicketCategory, TicketPriority, TicketStatus } from "@/apis/types";

/**
 * Helper function to get priority badge color
 * @param priority 
 * @returns 
 */
export function getPriorityBadgeVariant(priority : TicketPriority) {

    switch (priority) {
        case "medium":
            return "bg-blue-600 text-white"
        case "high":
            return "bg-orange text-white"
        case "low":
        default:
            return "bg-white text-gray-800"
    }
}


/**
 * Helper function to get category badge color
 * @param category 
 * @returns 
 */
export function getCategoryBadgeVariant(category: TicketCategory) {

    switch (category) {
        case "software":
            return "bg-gray-300 text-gray-800"
        case "hardware":
            return "bg-slate-400 text-white"
        case "delivery":
            return "bg-indigo-500 text-white"
        case "payment":
            return "bg-emerald-500 text-white"
        default:
            return "bg-gray-300 text-gray-800"
    }
}

/**
 * Helper function to get status badge color
 * @param status 
 * @returns 
 */
export function getStatusBadgeVariant(status: TicketStatus) {

    switch (status) {
        case "open":
            return "bg-emerald-500 text-white"
        case "in_progress":
            return "bg-yellow-500 text-black"
        case "closed":
        default:
            return "bg-gray-400 text-gray-950"
    }
}