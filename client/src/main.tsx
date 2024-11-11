import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Components
import Home from './components/Home';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';

// Styling
import './index.css';

// Learnt react router system through https://www.youtube.com/watch?v=oTIJunBa6MA&ab_channel=CosdenSolutions
const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <div>404 not found</div>
  },
  {
    path: '/create',
    element: <CreateRoom />
  },
  {
    path: '/join',
    element: <JoinRoom />
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}  />
  </StrictMode>,
)
