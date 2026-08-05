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

  const isOnboardingPath = location.pathname.startsWith('/onboarding');
  const isDashboardPath = location.pathname.startsWith('/dashboard');
  const isIndividualPath = location.pathname.startsWith('/individual');

  const localOnboarded = localStorage.getItem(`onboardingCompleted_${user.uid}`) === 'true';
  const isUserOnboarded = userProfile?.onboarded || localOnboarded;

  const localAccountType = localStorage.getItem(`accountType_${user.uid}`);
  const isIndividual = userProfile?.accountType === 'individual' || userProfile?.purpose === 'individual' || localAccountType === 'individual';
  const targetDashboard = isIndividual ? '/individual' : '/dashboard';

  if (userProfile && !isUserOnboarded) {
    if (!isOnboardingPath) {
      return <Navigate to="/onboarding" replace />;
    }
  } else if (userProfile && isUserOnboarded) {
    if (isOnboardingPath) {
      return <Navigate to={targetDashboard} replace />;
    }
    if (isIndividual && isDashboardPath) {
      return <Navigate to="/individual" replace />;
    }
    if (!isIndividual && isIndividualPath) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
