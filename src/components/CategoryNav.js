// src/components/CategoryNav.js
// Category navigation for music licensing marketplace
import { Link, useLocation } from 'react-router-dom';
import { FaTiktok, FaInstagram, FaYoutube, FaHeart, FaMusic, FaBriefcase } from 'react-icons/fa';

const CategoryNav = () => {
  const location = useLocation();

  const categories = [
    {
      id: 'all',
      label: 'Browse All',
      icon: FaMusic,
      path: '/'
    },
    {
      id: 'platform',
      label: 'By Platform',
      icon: null,
      subCategories: [
        { id: 'tiktok', label: 'TikTok', icon: FaTiktok, path: '/browse/tiktok' },
        { id: 'instagram', label: 'Instagram', icon: FaInstagram, path: '/browse/instagram' },
        { id: 'youtube', label: 'YouTube', icon: FaYoutube, path: '/browse/youtube' }
      ]
    },
    {
      id: 'mood',
      label: 'By Mood',
      icon: FaHeart,
      path: '/browse/mood'
    },
    {
      id: 'genre',
      label: 'By Genre',
      icon: FaMusic,
      path: '/browse/genre'
    },
    {
      id: 'usecase',
      label: 'By Use Case',
      icon: FaBriefcase,
      path: '/browse/usecase'
    }
  ];

  return (
    <div className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            if (category.subCategories) {
              return (
                <div key={category.id} className="relative group">
                  <button
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    {category.label}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  <div className="absolute left-0 mt-0 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {category.subCategories.map((sub) => {
                      const Icon = sub.icon;
                      return (
                        <Link
                          key={sub.id}
                          to={sub.path}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          {Icon && <Icon className="w-4 h-4" />}
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const Icon = category.icon;
            const isActive = location.pathname === category.path ||
                           (category.id === 'all' && location.pathname === '/');

            return (
              <Link
                key={category.id}
                to={category.path}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[#1DB954] border-b-2 border-[#1DB954]'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {category.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default CategoryNav;
