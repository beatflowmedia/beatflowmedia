import { Link } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';

export default function FeaturedSamples() {
  const samplePreviews = [
    {
      id: 1,
      title: 'Ambient Café Vibes',
      mood: ['Relaxed', 'Warm'],
      duration: '2:45',
      gradient: 'from-amber-600 to-orange-700'
    },
    {
      id: 2,
      title: 'Upbeat Retail Energy',
      mood: ['Energetic', 'Modern'],
      duration: '3:12',
      gradient: 'from-pink-600 to-rose-700'
    },
    {
      id: 3,
      title: 'Focus Flow State',
      mood: ['Minimal', 'Clean'],
      duration: '4:20',
      gradient: 'from-blue-600 to-indigo-700'
    },
    {
      id: 4,
      title: 'Evening Lounge',
      mood: ['Smooth', 'Sophisticated'],
      duration: '3:38',
      gradient: 'from-purple-600 to-violet-700'
    },
    {
      id: 5,
      title: 'Workout Energy',
      mood: ['Powerful', 'Dynamic'],
      duration: '2:55',
      gradient: 'from-red-600 to-orange-700'
    },
    {
      id: 6,
      title: 'Tech Innovation',
      mood: ['Future', 'Corporate'],
      duration: '3:25',
      gradient: 'from-cyan-600 to-blue-700'
    }
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Samples</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Preview our professionally crafted audio tracks. Full player functionality coming soon.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {samplePreviews.map((sample) => (
            <div
              key={sample.id}
              className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-[#1DB954] transition-all group cursor-pointer"
            >
              <div className={`relative h-48 bg-gradient-to-br ${sample.gradient} flex items-center justify-center`}>
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all"></div>
                <div className="relative bg-[#1DB954] hover:bg-[#1aa34a] w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <FaPlay className="text-white text-xl ml-1" />
                </div>
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 px-3 py-1 rounded-full text-xs font-semibold">
                  {sample.duration}
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-lg mb-2 group-hover:text-[#1DB954] transition-colors">
                  {sample.title}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sample.mood.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            to="/studio/samples"
            className="inline-flex items-center bg-[#1DB954] hover:bg-[#1aa34a] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            View All Samples
          </Link>
        </div>
      </div>
    </section>
  );
}
