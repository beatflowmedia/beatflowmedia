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
import { FaHeart, FaMusic, FaBriefcase, FaCompactDisc, FaBrain } from 'react-icons/fa';

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

// THE SECOND TIER IS GONE. "By Use Case", "By Mood" and "By Genre" lived here.
//
// None of them filtered anything. Measured across the 742 library tracks:
//
//     genre 0    mood 0    useCase 0    styleTags 0    duration 742
//
// and none of the three entries carried a `match` predicate, so all three rendered
// the same 742 tracks as /browse/library under a different heading. Four tabs, one
// answer -- the platform tabs again, one tier up.
//
// It also BROKE THE LAYOUT. The shell reserves a fixed height for one nav row; a
// second tier ran to 171px over a main area starting at 112, so it covered the top of
// the filter sidebar. The "Filters" heading sat underneath it.
//
// Narrowing belongs in BrowseFilters, which already derives its facets from the data
// and offers one only when there is more than one value to choose between. It shows
// Duration today because that is the only field with data, and a Genre or Mood section
// will appear there by itself the day those are tagged -- no nav edit, no second list.

const CategoryNav = () => {
  const location = useLocation();
  const path = location.pathname;

  const activeCatalogue =
    path === '/' ? 'music' : path === '/browse/functional' ? 'functional' : path === '/browse/library' ? 'library' : null;

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

      </div>
    </div>
  );
};

export default CategoryNav;
