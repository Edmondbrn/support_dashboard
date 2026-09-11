

class AppRoutes {


    AUTH_SIGNUP = "/auth/signup";
    AUTH_SIGNIN = "/auth/signin";

    HOME = "/home";

    TICKETS = "/tickets";
    TICKET_CREATE = "/tickets/new";
    MESSAGES_TICKET = "/messages/:ticketId";
    MESSAGES = "/messages";
    ADMIN_TICKETS = "/admin/tickets";
}



export const appRoutes = new AppRoutes();