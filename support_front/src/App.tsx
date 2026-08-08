import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router';

import './App.css'
import SignUp from './pages/signup';


const RootLayout = () => {
  return (
    <div>
      {/* Menu bar */}
      <nav style={{ display: 'flex', gap: '10px', padding: '10px', background: '#eee' }}>
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
