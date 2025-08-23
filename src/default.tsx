import { Outlet } from 'react-router-dom';
import BottomNavigator from '@/components/common/BottomNavigator';
import { useLocation } from 'react-router-dom';
import useScrollToTop from './hooks/useScrollToTop';

const Default = () => {
  const { pathname } = useLocation();

  // Check if it's the map page
  const isMapPage = pathname === '/map';

  // Check if it's the login or signup page
  const isAuthPage =
    pathname === '/login' || pathname === '/signup' || pathname === '/complete-profile';

  const isLoginPage = pathname === '/login';

  useScrollToTop();

  return (
    <div
      className={`w-full max-w-[600px] min-h-screen mx-auto flex flex-col relative ${
        isAuthPage ? 'bg-white' : 'bg-background'
      }`}
    >
      <main className={isMapPage || isLoginPage ? '' : 'pt-[40px] pb-[65px]'}>
        <Outlet />
      </main>

      {!isAuthPage && <BottomNavigator />}
    </div>
  );
};

export default Default;
