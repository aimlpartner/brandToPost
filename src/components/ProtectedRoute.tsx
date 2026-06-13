import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppSkeleton } from './AppSkeleton';

export function ProtectedRoute() {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isOnboardingPath = location.pathname === '/onboarding';

  if (userProfile && !userProfile.onboarded) {
    if (!isOnboardingPath) {
      return <Navigate to="/onboarding" replace />;
    }
  } else if (userProfile && userProfile.onboarded) {
    if (isOnboardingPath) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
