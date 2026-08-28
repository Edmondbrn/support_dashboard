

class AppRoutes {


    AUTH_SIGNUP = "/auth/signup";
    AUTH_SIGNIN = "/auth/signin";

    HOME = "/home";

    TICKETS = "/tickets";
    TICKET_CREATE = "/tickets/new";
    MESSAGES_TICKET = "/messages/:ticketId";
    MESSAGES = "/messages";
}



export const appRoutes = new AppRoutes();