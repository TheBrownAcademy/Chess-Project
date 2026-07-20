import HomePage from '../pages/HomePage';
import PuzzlePage from '../pages/PuzzlePage';
import ProfilePage from '../pages/ProfilePage';
import PricingPage from '../pages/PricingPage';
import CheckoutPage from '../pages/CheckoutPage';
import SuccessfulPage from '../pages/SuccessfulPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
}

// Routes that run inside the MainLayout (Navbar + Sidebar + Footer)
export const mainRoutes: RouteConfig[] = [
  { path: '/', element: <HomePage /> },
  { path: '/puzzles', element: <PuzzlePage /> },
  { path: '/profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
  { path: '/pricing', element: <PricingPage /> },
];

// Routes that run inside the MinimalLayout (Navbar only, no Sidebar/Footer)
export const minimalRoutes: RouteConfig[] = [
  { path: '/payment', element: <CheckoutPage /> },
  { path: '/successful', element: <SuccessfulPage /> },
];
