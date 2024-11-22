// React
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider} from 'react-router-dom';

// Components
import Home from './components/Home';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import Room from './components/Room';

// Styling
import './index.css';
import Login from './components/Login';

// Learnt react router system through https://www.youtube.com/watch?v=oTIJunBa6MA&ab_channel=CosdenSolutions
const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
    errorElement: <div>404 not found</div>
  },
  {
    path: "/home",
    element: <Home />
  },
  {
    path: '/create',
    element: <CreateRoom />
  },
  {
    path: '/join',
    element: <JoinRoom />
  },
  {
    path: "/room/:roomCode",
    element: <Room />
  }
]);

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router}  />
)
