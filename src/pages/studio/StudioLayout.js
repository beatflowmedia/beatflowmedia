import { Outlet } from 'react-router-dom';
import StudioNavBar from '../../components/studio/StudioNavBar';
import StudioFooter from '../../components/studio/StudioFooter';

export default function StudioLayout() {
  return (
    <div className="min-h-screen bg-gray-900">
      <StudioNavBar />
      <Outlet />
      <StudioFooter />
    </div>
  );
}
