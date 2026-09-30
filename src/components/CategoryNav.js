// src/components/CategoryNav.js
//
// TWO TIERS, because the catalogue is three products and not one.
//
// This used to be a single row -- Browse All, By Platform, By Mood, By Genre, By Use
// Case -- which put the FACETS above the SEPARATION. A visitor saw one store with
// filters, so Percy's artist albums and 562 production cues and 192 sleep tracks were
// all the same shelf viewed through different lenses. Filtering the queries by pool
// fixed what each page returned and left the navigation saying they were one thing.
//
// The PRD calls the pools sub-brands (S81) with "independent surfaces" (S84), so the
// catalogue is the FIRST choice and the facets live inside whichever one is open:
//
//   Music              commercial-release   Percy's releases, to listen to
//   Production Library production-music     music to license into your own work
//   Focus & Sleep      functional-music     music that does a job -- a different market
//
// Facets are shown only inside the Library. "By Mood" over an album catalogue is a
// question nobody asks, and offering it would re-imply the single undifferentiated
// store this exists to end.
//
// NO HOVER-ONLY MENUS. The old By Platform dropdown opened on group-hover, which does
// not exist on a touchscreen -- on a phone that menu was unreachable. Platform is now
// a normal row of links inside the Library tier.
import { Link, useLocation } from 'react-router-dom';
import { FaTiktok, FaInstagram, FaYoutube, FaHeart, FaMusic, FaBriefcase, FaCompactDisc, FaBrain } from 'react-icons/fa';

const CATALOGUES = [
  {
    id: 'music',
    label: 'Music',
    sub: 'Albums & singles',
    icon: FaCompactDisc,
    path: '/'
  },
  {
    id: 'library',
    label: 'Production Library',
    sub: 'License for your project',
    icon: FaMusic,
    path: '/browse/library'
  },
  {
    id: 'functional',
    label: 'Focus & Sleep',
    sub: 'Music that does a job',
    icon: FaBrain,
    path: '/browse/functional'
  }
];

// Only meaningful inside the Production Library.
const LIBRARY_FACETS = [
  { id: 'usecase', label: 'By Use Case', icon: FaBriefcase, path: '/browse/usecase' },
  { id: 'mood', label: 'By Mood', icon: FaHeart, path: '/browse/mood' },
  { id: 'genre', label: 'By Genre', icon: FaMusic, path: '/browse/genre' },
  { id: 'tiktok', label: 'TikTok', icon: FaTiktok, path: '/browse/tiktok' },
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, path: '/browse/instagram' },
  { id: 'youtube', label: 'YouTube', icon: FaYoutube, path: '/browse/youtube' }
];

const LIBRARY_PATHS = new Set(LIBRARY_FACETS.map((f) => f.path).concat('/browse/library'));

const CategoryNav = () => {
  const location = useLocation();
  const path = location.pathname;

  const inLibrary = LIBRARY_PATHS.has(path);
  const activeCatalogue =
    path === '/' ? 'music' : path === '/browse/functional' ? 'functional' : inLibrary ? 'library' : null;

  return (
    <div className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Tier 1 — which catalogue */}
        <nav className="flex items-stretch overflow-x-auto scrollbar-hide" aria-label="Catalogue">
          {CATALOGUES.map((catalogue) => {
            const Icon = catalogue.icon;
            const active = activeCatalogue === catalogue.id;
            return (
              <Link
                key={catalogue.id}
                to={catalogue.path}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-5 py-3 min-h-[56px] whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-green-500 text-white bg-gray-800/60'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{catalogue.label}</span>
                  <span className="text-xs text-gray-500">{catalogue.sub}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Tier 2 — how to narrow it, only where narrowing means something */}
        {inLibrary && (
          <nav
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-t border-gray-800 px-2"
            aria-label="Narrow the library"
          >
            {LIBRARY_FACETS.map((facet) => {
              const Icon = facet.icon;
              const active = path === facet.path;
              return (
                <Link
                  key={facet.id}
                  to={facet.path}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 min-h-[44px] text-sm whitespace-nowrap rounded-md transition-colors ${
                    active ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {facet.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};

export default CategoryNav;
