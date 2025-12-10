import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import PlaylistItem from './PlaylistItem';

interface SidebarProps {
  isMobileMenuOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen }) => {
  const playlists = useSelector((state: RootState) => state.playlists);

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out flex flex-col z-50 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 md:flex`}
    >
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <h1 className="text-lg font-semibold">My Playlist App</h1>
      </div>
      <div className="mt-5 flex-1 overflow-y-auto">
        {playlists.map((pl) => (
          <PlaylistItem key={pl.id} playlist={pl} />
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;