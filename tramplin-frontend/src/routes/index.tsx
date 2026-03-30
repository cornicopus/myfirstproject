import { createBrowserRouter } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import HomePage from '../pages/HomePage/HomePage';
import LoginPage from '../pages/LoginPage/LoginPage';
import RegisterPage from '../pages/RegisterPage/RegisterPage';
import SeekerDashboard from '../pages/SeekerDashboard/SeekerDashboard';
import EmployerDashboard from '../pages/EmployerDashboard/EmployerDashboard';
import CuratorDashboard from '../pages/CuratorDashboard/CuratorDashboard';
import OpportunityPage from '../pages/OpportunityPage/OpportunityPage';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { Box } from '@mui/material';

// Layout компонент с Header и Footer
const Layout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'opportunity/:id',
        element: <OpportunityPage />,
      },
      {
        path: 'dashboard/seeker',
        element: (
          <ProtectedRoute role="seeker">
            <SeekerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/employer',
        element: (
          <ProtectedRoute role="employer">
            <EmployerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/curator',
        element: (
          <ProtectedRoute role="curator">
            <CuratorDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);