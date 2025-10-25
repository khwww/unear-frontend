import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Default from '../default';
import OnboardingPage from '@/pages/OnboardingPage';
import InitialPage from '@/pages/InitialPage';

import MainPage from '@/pages/MainPage';
import MembershipPage from '@/pages/MembershipPage';
import MembershipDetailPage from '@/pages/MembershipDetailPage';
import MapPage from '@/pages/MapPage';
// 스토리 페이지들은 제거됨
import JuniorPage from '@/pages/JuniorPage';
import MyPage from '@/pages/MyPage';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';

import CompleteProfilePage from '@/pages/CompleteProfilePage';
// 소셜로그인 관련 import들은 제거됨

import StatisticsDetailPage from '@/pages/StatisticsDetailPage';
import UsageHistoryPage from '@/pages/UsageHistoryPage';
import BookmarkPage from '@/pages/BookmarkPage';
import CouponPage from '@/pages/CouponPage';

import { AuthProvider } from '@/providers/AuthProvider';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ErrorBoundary from '@/components/error/ErrorBoundary';

import NotFoundPage from '@/pages/NotFoundPage';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/initial" replace /> },
  { path: '/initial', element: <InitialPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  {
    element: <Default />,
    children: [
      // 보호된 라우트들 (로그인 필요)
      {
        path: '/main',
        element: (
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/membership',
        element: (
          <ProtectedRoute>
            <MembershipPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/membership/detail/:franchiseId',
        element: (
          <ProtectedRoute>
            <MembershipDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/map',
        element: (
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        ),
      },
      // 스토리 관련 라우트들은 제거됨
      {
        path: '/junior',
        element: (
          <ProtectedRoute>
            <JuniorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my',
        element: (
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my/statistics',
        element: (
          <ProtectedRoute>
            <StatisticsDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my/usage-history',
        element: (
          <ProtectedRoute>
            <UsageHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my/bookmarks',
        element: (
          <ProtectedRoute>
            <BookmarkPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my/coupons',
        element: (
          <ProtectedRoute>
            <CouponPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my/change-password',
        element: (
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/complete-profile',
        element: (
          <ProtectedRoute>
            <CompleteProfilePage />
          </ProtectedRoute>
        ),
      },

      // 공개 라우트들 (로그인 불필요)
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignUpPage /> },

      { path: '/complete-profile', element: <CompleteProfilePage /> },

      // 소셜로그인 관련 라우트들은 제거됨
    ],
  },
  {
    // 2. NotFoundPage를 위한 라우트를 Default 레이아웃 밖으로 빼냅니다.
    // 이렇게 하면 Default 레이아웃과 그 안의 BottomNavigator가 적용되지 않습니다.
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default function Router() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  );
}
