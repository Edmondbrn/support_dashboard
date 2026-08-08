import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router';

import './App.css'
import SignUp from './pages/signup';


const RootLayout = () => {
  return (
    <div className='bg-white'>
      {/* Menu bar */}
      <nav className='flex gap-3 p-3 bg-white'>
        <Link to="/">Accueil</Link>
      </nav>
      {/* Page body */}
      <main style={{ padding: '20px' }}>
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
        path: "/",
        element:<SignUp/>
      }
    ]
  }
])

function App() {
  return <RouterProvider router={router} />;
}

export default App
