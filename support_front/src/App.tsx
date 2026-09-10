import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';

import './App.css'
import SignUp from './pages/auth/signup';
import Signin from './pages/auth/signin';
import Home from './pages/home/home';
import Tickets from './pages/tickets/tickets';
import CreateTicket from './pages/tickets/createTicket';
import Messages from './pages/messages/Messages';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NavBar from './components/shared/navBar';
import { useAuth } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthContext';
import { appRoutes } from './config';
import { TooltipProvider } from "@/components/ui/tooltip"
import { RealtimeProvider } from './contexts/RealTimeContext';
import MessageList from './pages/messages/MessageList';
import { ConfirmProvider } from './contexts/ConfirmationDialogContext';


const RootLayout = () => {
  const { user } = useAuth();
  return (
    // Mandatory at Router level
    <RealtimeProvider>
      <div className='min-h-screen text-white'>
        {user && <NavBar />}
        {/* Page body */}
        <main className='bg-navy-gradient'>
            <Outlet />
        </main>
      </div>
    </RealtimeProvider>

  );
}


const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: appRoutes.AUTH_SIGNUP,
        element:<SignUp/>
      },
      {
        path: appRoutes.AUTH_SIGNIN,
        element:<Signin/>
      },
      {
        path: appRoutes.HOME,
        element: (
          <ProtectedRoute>
            <Home/>
          </ProtectedRoute>
        )
      },
      {
        path: appRoutes.TICKETS,
        element: (
          <ProtectedRoute>
            <Tickets/>
          </ProtectedRoute>
        )
      },
      {
        path: appRoutes.TICKET_CREATE,
        element: (
          <ProtectedRoute>
            <CreateTicket/>
          </ProtectedRoute>
        )
      },
      {
        path: appRoutes.MESSAGES_TICKET,
        element: (
          <ProtectedRoute>
            <Messages/>
          </ProtectedRoute>
        )
      },
      {
        path: appRoutes.MESSAGES,
        element: (
          <ProtectedRoute>
            <MessageList/>
          </ProtectedRoute>
        )
      },
    ]
  }
])

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
        </ConfirmProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App
