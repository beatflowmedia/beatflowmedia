import { FiMenu } from "react-icons/fi";

export default function NavBar({
  onHomeClick,
  onSearchChange,
  onExplorePremium,
  onDownloadClick,
  onWhatsNewClick,
  isBellActive,
  onMenuClick
}) {
  return (
    <div className="flex items-center justify-between bg-gray-900 p-3 md:p-4">
      {/* Mobile menu button visible only on mobile */}
      {onMenuClick && (
        <button
          className="text-white focus:outline-none mr-2 md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <FiMenu size={24} />
        </button>
      )}
      <button onClick={onHomeClick} className="text-white font-bold text-lg">
        BeatFlow
      </button>
      {/* ... rest unchanged ... */}
    </div>
  );
}
