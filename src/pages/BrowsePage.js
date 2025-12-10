import React from "react";

/**
 * BrowsePage
 *
 * A grid-based layout that displays multiple "browse" categories or genres,
 * each represented by a card with a background color or image and a label.
 */
export default function BrowsePage() {
  // Sample categories array (label, optional image, background color, etc.)
  const categories = [
    { label: "Music", color: "bg-pink-600", image: "/images/browse/music.jpg" },
    {
      label: "Podcasts",
      color: "bg-blue-600",
      image: "/images/browse/podcasts.jpg"
    },
    {
      label: "Audiobooks",
      color: "bg-orange-600",
      image: "/images/browse/audiobooks.jpg"
    },
    {
      label: "Live Events",
      color: "bg-purple-600",
      image: "/images/browse/liveevents.jpg"
    },
    {
      label: "Made For You",
      color: "bg-green-600",
      image: "/images/browse/madeforyou.jpg"
    },
    {
      label: "Hip-Hop",
      color: "bg-red-600",
      image: "/images/browse/hiphop.jpg"
    },
    { label: "Pop", color: "bg-yellow-600", image: "/images/browse/pop.jpg" },
    {
      label: "Country",
      color: "bg-lime-600",
      image: "/images/browse/country.jpg"
    },
    { label: "Latin", color: "bg-teal-600", image: "/images/browse/latin.jpg" },
    {
      label: "Podcast Charts",
      color: "bg-rose-600",
      image: "/images/browse/podcastcharts.jpg"
    },
    {
      label: "New Releases",
      color: "bg-indigo-600",
      image: "/images/browse/newreleases.jpg"
    },
    { label: "Rock", color: "bg-gray-600", image: "/images/browse/rock.jpg" },
    {
      label: "Discover",
      color: "bg-red-700",
      image: "/images/browse/discover.jpg"
    },
    {
      label: "Student",
      color: "bg-green-700",
      image: "/images/browse/student.jpg"
    },
    {
      label: "Dance/Electronic",
      color: "bg-blue-700",
      image: "/images/browse/dance.jpg"
    },
    { label: "R&B", color: "bg-purple-700", image: "/images/browse/rnb.jpg" },
    {
      label: "Christian & Gospel",
      color: "bg-pink-700",
      image: "/images/browse/christiangospel.jpg"
    },
    {
      label: "Workout",
      color: "bg-yellow-700",
      image: "/images/browse/workout.jpg"
    },
    {
      label: "K-pop",
      color: "bg-fuchsia-700",
      image: "/images/browse/kpop.jpg"
    },
    { label: "Chill", color: "bg-cyan-700", image: "/images/browse/chill.jpg" },
    // ... add more categories as needed
  ];

  return (
    <div className="min-h-screen bg-black text-white px-6 py-6">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-4">Browse all</h1>
      {/* Grid of categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {categories.map((cat, index) => (
          <div
            key={index}
            className={`relative rounded-md overflow-hidden cursor-pointer ${cat.color}`}
            style={{ minHeight: "150px" }}
          >
            {/* Optional background image overlay */}
            {cat.image && (
              <img
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
            )}
            {/* Dark overlay to make text more readable (optional) */}
            <div className="absolute inset-0 bg-black bg-opacity-30" />
            {/* Label */}
            <div className="relative z-10 p-4 flex flex-col justify-end h-full">
              <h2 className="text-lg font-semibold">{cat.label}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
