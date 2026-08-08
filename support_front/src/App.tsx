import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router';

import './App.css'
import SignUp from './pages/auth/signup';
import Signin from './pages/auth/signin';
import Home from './pages/home/home';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { appRoutes } from './config';


const RootLayout = () => {
  return (
    <div className='min-h-screen'>
      {/* Menu bar */}
      <nav className='flex gap-3 text-white'>
        <Link to="/">Accueil</Link>
      </nav>
      {/* Page body */}
      <main className='bg-navy-gradient'>
        <Outlet />
      </main>
    </div>
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
      }
    ]
  }
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App
