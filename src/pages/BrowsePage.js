import { useNavigate } from "react-router-dom";

/**
 * BrowsePage
 *
 * A grid-based layout that displays multiple "browse" categories or genres,
 * each represented by a card with a background color or image and a label.
 */
export default function BrowsePage() {
  const navigate = useNavigate();

  // Sample categories array (label, optional image, background color, URL)
  const categories = [
    { label: "Music", color: "bg-pink-600", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=711&fit=crop", url: "/genre/all" },
    {
      label: "Podcasts",
      color: "bg-blue-600",
      image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=711&fit=crop",
      url: "/category/podcasts"
    },
    {
      label: "Audiobooks",
      color: "bg-orange-600",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=711&fit=crop",
      url: "/category/audiobooks"
    },
    {
      label: "Live Events",
      color: "bg-purple-600",
      image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=711&fit=crop",
      url: "/category/live-events"
    },
    {
      label: "Made For You",
      color: "bg-green-600",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=711&fit=crop",
      url: "/made-for-you"
    },
    {
      label: "Hip-Hop",
      color: "bg-red-600",
      image: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=711&fit=crop",
      url: "/genre/hip-hop"
    },
    { label: "Pop", color: "bg-yellow-600", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=711&fit=crop", url: "/genre/pop" },
    {
      label: "Country",
      color: "bg-lime-600",
      image: "https://images.unsplash.com/photo-1520262454473-a1a82276a574?w=400&h=711&fit=crop",
      url: "/genre/country"
    },
    { label: "Latin", color: "bg-teal-600", image: "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=400&h=711&fit=crop", url: "/genre/latin" },
    {
      label: "Podcast Charts",
      color: "bg-rose-600",
      image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=711&fit=crop",
      url: "/charts/podcasts"
    },
    {
      label: "New Releases",
      color: "bg-indigo-600",
      image: "https://images.unsplash.com/photo-1619983081563-430f63602796?w=400&h=711&fit=crop",
      url: "/new-releases"
    },
    { label: "Rock", color: "bg-gray-600", image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=711&fit=crop", url: "/genre/rock" },
    {
      label: "Discover",
      color: "bg-red-700",
      image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=711&fit=crop",
      url: "/discover"
    },
    {
      label: "Student",
      color: "bg-green-700",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=711&fit=crop",
      url: "/student"
    },
    {
      label: "Dance/Electronic",
      color: "bg-blue-700",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=711&fit=crop",
      url: "/genre/dance-electronic"
    },
    { label: "R&B", color: "bg-purple-700", image: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400&h=711&fit=crop", url: "/genre/rnb" },
    {
      label: "Blues",
      color: "bg-blue-900",
      image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=711&fit=crop",
      url: "/genre/blues"
    },
    {
      label: "Christian & Gospel",
      color: "bg-pink-700",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=711&fit=crop",
      url: "/genre/christian-gospel"
    },
    {
      label: "Workout",
      color: "bg-yellow-700",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=711&fit=crop",
      url: "/category/workout"
    },
    {
      label: "K-pop",
      color: "bg-fuchsia-700",
      image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=711&fit=crop",
      url: "/genre/kpop"
    },
    { label: "Chill", color: "bg-cyan-700", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=711&fit=crop", url: "/category/chill" },
  ];

  return (
    <div className="min-h-screen bg-black text-white px-6 py-6">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-4">Browse all</h1>
      {/* Grid of categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {categories.map((cat, index) => (
          <div
            key={index}
            onClick={() => navigate(cat.url)}
            className={`relative rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 ${cat.color}`}
            style={{
              aspectRatio: '9 / 16',
              maxWidth: '100%'
            }}
          >
            {/* Optional background image overlay */}
            {cat.image && (
              <img
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            {/* Gradient overlay to make text more readable */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
            {/* Label */}
            <div className="relative z-10 p-4 flex flex-col justify-end h-full">
              <h2 className="font-bold text-white drop-shadow-lg" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
                {cat.label}
              </h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
