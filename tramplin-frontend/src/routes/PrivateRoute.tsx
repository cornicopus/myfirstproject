import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
  requiredRole?: 'seeker' | 'employer' | 'curator';
}

export const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};