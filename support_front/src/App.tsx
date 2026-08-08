import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router';

import './App.css'
import SignUp from './pages/signup';


const RootLayout = () => {
  return (
    <div className='bg-navy-gradient h-full'>
      {/* Menu bar */}
      <nav className='flex gap-3 text-white'>
        <Link to="/">Accueil</Link>
      </nav>
      {/* Page body */}
      <main className='min-h-screen'>
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
        path: "/signup",
        element:<SignUp/>
      }
    ]
  }
])

function App() {
  return <RouterProvider router={router} />;
}

export default App
