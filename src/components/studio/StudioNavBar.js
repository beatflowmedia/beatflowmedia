import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaChevronDown, FaArrowLeft } from 'react-icons/fa';

export default function StudioNavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const closeMenu = () => {
    setIsOpen(false);
    setServicesDropdownOpen(false);
  };

  const services = [
    { name: 'Audio Kits', path: '/studio/audio-kits' },
    { name: 'Mood Library', path: '/studio/mood-library' },
    { name: 'Invisible Services', path: '/studio/invisible-services' },
    { name: 'Consultation', path: '/studio/consultation' }
  ];

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link
            to="/studio"
            className="text-2xl font-bold text-white tracking-tight hover:text-gray-300 transition-colors"
            onClick={closeMenu}
          >
            BeatFlow <span className="text-gray-400 font-light">Studio</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Link back to main site */}
            <a
              href="/"
              className="text-gray-400 hover:text-gray-300 transition-colors flex items-center text-sm"
            >
              <FaArrowLeft className="mr-1.5 text-xs" />
              Stream Music
            </a>

            {/* Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => setServicesDropdownOpen(false)}
            >
              <button
                className="text-gray-300 hover:text-white transition-colors flex items-center font-medium"
              >
                Services
                <FaChevronDown className="ml-1.5 text-xs" />
              </button>

              {servicesDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-50">
                  <div className="py-2">
                    <Link
                      to="/studio/services"
                      className="block px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors font-medium"
                      onClick={closeMenu}
                    >
                      All Services
                    </Link>
                    <div className="border-t border-gray-700 my-2"></div>
                    {services.map((service) => (
                      <Link
                        key={service.path}
                        to={service.path}
                        className="block px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        onClick={closeMenu}
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/studio/samples"
              className="text-gray-300 hover:text-white transition-colors font-medium"
              onClick={closeMenu}
            >
              Samples
            </Link>

            <Link
              to="/studio/about"
              className="text-gray-300 hover:text-white transition-colors font-medium"
              onClick={closeMenu}
            >
              About
            </Link>

            <Link
              to="/studio/consultation"
              className="bg-[#1DB954] hover:bg-[#169c46] text-white px-6 py-2.5 rounded-md transition-colors font-medium"
              onClick={closeMenu}
            >
              Book Consultation
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-gray-300 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-700 mt-2 pt-4">
            <div className="flex flex-col space-y-3">
              {/* Link back to main site */}
              <a
                href="/"
                className="text-gray-400 hover:text-gray-300 transition-colors flex items-center text-sm py-2"
                onClick={closeMenu}
              >
                <FaArrowLeft className="mr-2 text-xs" />
                Stream Music
              </a>

              {/* Services Section */}
              <div>
                <button
                  onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                  className="text-gray-300 hover:text-white transition-colors flex items-center justify-between w-full font-medium py-2"
                >
                  Services
                  <FaChevronDown className={`ml-1.5 text-xs transition-transform ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {servicesDropdownOpen && (
                  <div className="pl-4 mt-2 space-y-2">
                    <Link
                      to="/studio/services"
                      className="block text-gray-400 hover:text-white transition-colors py-1.5"
                      onClick={closeMenu}
                    >
                      All Services
                    </Link>
                    {services.map((service) => (
                      <Link
                        key={service.path}
                        to={service.path}
                        className="block text-gray-400 hover:text-white transition-colors py-1.5"
                        onClick={closeMenu}
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/studio/samples"
                className="text-gray-300 hover:text-white transition-colors font-medium py-2"
                onClick={closeMenu}
              >
                Samples
              </Link>

              <Link
                to="/studio/about"
                className="text-gray-300 hover:text-white transition-colors font-medium py-2"
                onClick={closeMenu}
              >
                About
              </Link>

              <Link
                to="/studio/consultation"
                className="bg-[#1DB954] hover:bg-[#169c46] text-white px-6 py-2.5 rounded-md transition-colors font-medium text-center mt-2"
                onClick={closeMenu}
              >
                Book Consultation
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
