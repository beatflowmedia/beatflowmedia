import { FaInstagram, FaTwitter, FaFacebook } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-bf-page text-bf-subtext py-8 px-4 sm:px-6 lg:px-8">
      {/* Top columns + social */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1">
          <div>
            <h4 className="text-bf-text font-semibold mb-2">Company</h4>
            <ul className="space-y-1">
              <li>
                <a href="/about" className="hover:text-bf-text">
                  About
                </a>
              </li>
              <li>
                <a href="/jobs" className="hover:text-bf-text">
                  Jobs
                </a>
              </li>
              <li>
                <a href="/for-the-record" className="hover:text-bf-text">
                  For the Record
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-bf-text font-semibold mb-2">Communities</h4>
            <ul className="space-y-1">
              <li>
                <a href="/for-artists" className="hover:text-bf-text">
                  For Artists
                </a>
              </li>
              <li>
                <a href="/developers" className="hover:text-bf-text">
                  Developers
                </a>
              </li>
              <li>
                <a href="/advertising" className="hover:text-bf-text">
                  Advertising
                </a>
              </li>
              <li>
                <a href="/investors" className="hover:text-bf-text">
                  Investors
                </a>
              </li>
              <li>
                <a href="/vendors" className="hover:text-bf-text">
                  Vendors
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-bf-text font-semibold mb-2">Useful links</h4>
            <ul className="space-y-1">
              <li>
                <a href="/support" className="hover:text-bf-text">
                  Support
                </a>
              </li>
              <li>
                <a href="/browse" className="hover:text-bf-text">
                  Sync Licensing
                </a>
              </li>
              <li>
                <a href="/curator-portal" className="hover:text-bf-text">
                  Curator Portal
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-bf-text font-semibold mb-2">BeatFlow Plans</h4>
            <ul className="space-y-1">
              <li>
                <a href="/individual" className="hover:text-bf-text">
                  Premium Individual
                </a>
              </li>
              <li>
                <a href="/student" className="hover:text-bf-text">
                  Premium Student
                </a>
              </li>
              <li>
                <a href="/duo" className="hover:text-bf-text">
                  Premium Duo
                </a>
              </li>
              <li>
                <a href="/family" className="hover:text-bf-text">
                  Premium Family
                </a>
              </li>
              <li>
                <a href="/audiobooks" className="hover:text-bf-text">
                  Audiobooks Access
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex items-start md:items-center space-x-4">
          <a
            href="https://instagram.com"
            className="text-bf-text hover:text-white"
          >
            <FaInstagram size={20} />
          </a>
          <a
            href="https://twitter.com"
            className="text-bf-text hover:text-white"
          >
            <FaTwitter size={20} />
          </a>
          <a
            href="https://facebook.com"
            className="text-bf-text hover:text-white"
          >
            <FaFacebook size={20} />
          </a>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-bf-page/50 my-6" />

      {/* Bottom legal row */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between text-xs">
        <div className="flex flex-wrap gap-4 mb-4 md:mb-0">
          {[
            { label: "Legal", href: "/legal" },
            { label: "Safety & Privacy Center", href: "/privacy-center" },
            { label: "Privacy Policy", href: "/privacy-policy" },
            { label: "Cookies", href: "/cookies" },
            { label: "About Ads", href: "/about-ads" },
            { label: "Accessibility", href: "/accessibility" },
            { label: "Notice at Collection", href: "/notice-at-collection" },
            { label: "Your Privacy Choices", href: "/privacy-choices" },
          ].map((link) => (
            <a key={link.label} href={link.href} className="hover:text-bf-text">
              {link.label}
            </a>
          ))}
        </div>
        <p>© 2025 BeatFlow Media.</p>
      </div>
    </footer>
  );
}
