import { useState } from 'react';
import { Link } from 'react-router-dom';
import ServiceDetailLayout from '../../components/studio/ServiceDetailLayout';
import PricingCard from '../../components/studio/PricingCard';
import {
  FaPlay,
  FaShoppingCart,
  FaCheckCircle,
  FaTiktok,
  FaInstagram,
  FaYoutube,
  FaShieldAlt,
  FaBolt,
  FaInfinity,
  FaCoffee,
  FaStore,
  FaDumbbell
} from 'react-icons/fa';

export default function MoodLibrary() {
  const [selectedMood, setSelectedMood] = useState('All');
  const [selectedUseCase, setSelectedUseCase] = useState('All');

  const moods = ['All', 'Bright', 'Energetic', 'Warm', 'Modern', 'Calm', 'Sophisticated', 'Minimal', 'Upbeat'];
  const useCases = ['All', 'Café', 'Boutique', 'Fitness', 'Office', 'Retail', 'Restaurant'];

  const pricingTiers = [
    {
      title: 'Basic',
      price: '$29',
      description: 'Single track license',
      features: [
        '1 track download',
        'Royalty-free license',
        'Commercial use included',
        'Platform-safe guarantee',
        'Instant download',
        'MP3 & WAV formats'
      ],
      ctaText: 'Browse Tracks',
      ctaLink: '#samples'
    },
    {
      title: 'Standard',
      price: '$49',
      description: 'Small collection license',
      features: [
        'Up to 5 tracks',
        'Royalty-free license',
        'Commercial use included',
        'Platform-safe guarantee',
        'Instant download',
        'MP3 & WAV formats',
        'Priority support'
      ],
      highlighted: true,
      badge: 'BEST VALUE',
      ctaText: 'Browse Tracks',
      ctaLink: '#samples'
    },
    {
      title: 'Pro',
      price: '$99',
      description: 'Unlimited library access',
      features: [
        'Unlimited downloads',
        'Royalty-free license',
        'Commercial use included',
        'Platform-safe guarantee',
        'Instant download',
        'MP3, WAV & stems',
        'Priority support',
        'Early access to new releases'
      ],
      ctaText: 'Get Started',
      ctaLink: '/studio/consultation'
    }
  ];

  const mockSamples = [
    { id: 1, title: 'Sunrise Café', mood: ['Bright', 'Warm'], useCase: 'Café', duration: '2:45', price: '$29', image: '/sample-1.jpg' },
    { id: 2, title: 'Modern Boutique', mood: ['Modern', 'Sophisticated'], useCase: 'Boutique', duration: '3:12', price: '$29', image: '/sample-2.jpg' },
    { id: 3, title: 'Focus Flow', mood: ['Minimal', 'Calm'], useCase: 'Office', duration: '2:58', price: '$29', image: '/sample-3.jpg' },
    { id: 4, title: 'Evening Lounge', mood: ['Sophisticated', 'Warm'], useCase: 'Restaurant', duration: '3:30', price: '$39', image: '/sample-4.jpg' },
    { id: 5, title: 'Workout Energy', mood: ['Energetic', 'Upbeat'], useCase: 'Fitness', duration: '2:22', price: '$29', image: '/sample-5.jpg' },
    { id: 6, title: 'Tech Innovation', mood: ['Modern', 'Minimal'], useCase: 'Office', duration: '2:50', price: '$29', image: '/sample-6.jpg' },
    { id: 7, title: 'Urban Retail', mood: ['Upbeat', 'Energetic'], useCase: 'Retail', duration: '2:38', price: '$29', image: '/sample-7.jpg' },
    { id: 8, title: 'Cozy Corner', mood: ['Warm', 'Calm'], useCase: 'Café', duration: '3:05', price: '$29', image: '/sample-8.jpg' },
    { id: 9, title: 'Zen Wellness', mood: ['Calm', 'Minimal'], useCase: 'Fitness', duration: '3:40', price: '$39', image: '/sample-9.jpg' },
    { id: 10, title: 'Vintage Vibes', mood: ['Warm', 'Sophisticated'], useCase: 'Boutique', duration: '2:55', price: '$29', image: '/sample-10.jpg' },
    { id: 11, title: 'Brunch Beat', mood: ['Bright', 'Upbeat'], useCase: 'Restaurant', duration: '2:42', price: '$29', image: '/sample-11.jpg' },
    { id: 12, title: 'Creative Studio', mood: ['Modern', 'Energetic'], useCase: 'Office', duration: '3:18', price: '$29', image: '/sample-12.jpg' }
  ];

  const filteredSamples = mockSamples.filter(sample => {
    const moodMatch = selectedMood === 'All' || sample.mood.includes(selectedMood);
    const useCaseMatch = selectedUseCase === 'All' || sample.useCase === selectedUseCase;
    return moodMatch && useCaseMatch;
  });

  const platformBadges = [
    { icon: FaTiktok, name: 'TikTok Safe', color: '#000000' },
    { icon: FaInstagram, name: 'Instagram Safe', color: '#E4405F' },
    { icon: FaYoutube, name: 'YouTube Safe', color: '#FF0000' }
  ];

  const features = [
    {
      icon: FaShieldAlt,
      title: 'Platform-Safe',
      description: 'Every track is cleared for use on TikTok, Instagram, YouTube, and all major platforms'
    },
    {
      icon: FaBolt,
      title: 'Instant Access',
      description: 'Download immediately after purchase. No waiting, no approval process'
    },
    {
      icon: FaInfinity,
      title: 'Non-Exclusive',
      description: 'Commercial royalty-free license with unlimited usage rights'
    },
    {
      icon: FaCheckCircle,
      title: 'Human-Crafted',
      description: 'Professionally produced by experienced musicians, not AI-generated'
    }
  ];

  return (
    <ServiceDetailLayout
      title="Mood Library - Ready-to-License Audio"
      metaDescription="Browse curated audio collections organized by mood and use case. Instant download, royalty-free, platform-safe music for cafes, boutiques, fitness studios, and more."
      ogTitle="Mood Library | BeatFlow Studio"
      ogDescription="Ready-to-license audio collections for every mood and use case"
      keywords="mood library, background music, cafe music, retail music, fitness music, boutique music, ambient music, royalty-free library"
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMzI3MmEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6TTI0IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek0xMiAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="container mx-auto px-6 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-purple-600 bg-opacity-20 px-4 py-2 rounded-full mb-6">
              <span className="text-purple-400 font-semibold text-sm">MOOD LIBRARY</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Curated Audio Collections <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Ready to License</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
              Browse our library of professionally crafted tracks organized by mood and use case. Instant download, platform-safe, non-exclusive licensing.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="#samples"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <FaShoppingCart className="mr-2" />
                Browse Library
              </a>
              <Link
                to="/studio/consultation"
                className="inline-flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg border border-gray-600"
              >
                Custom Audio Kit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Safety Badges */}
      <section className="py-12 bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="text-gray-400 font-semibold text-sm uppercase tracking-wide">
              Platform Cleared:
            </div>
            {platformBadges.map((platform, index) => {
              const Icon = platform.icon;
              return (
                <div key={index} className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
                  <Icon className="text-xl" style={{ color: platform.color }} />
                  <span className="text-sm font-medium text-gray-300">{platform.name}</span>
                  <FaCheckCircle className="text-green-500 text-sm" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose Our Library</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professional audio tracks you can trust
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Icon className="text-white text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-800 border-y border-gray-700">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Licensing Options</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose the plan that fits your needs. All licenses include commercial use and platform safety.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <PricingCard key={index} {...tier} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse Section */}
      <section id="samples" className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Browse Library</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Filter by mood and use case to find the perfect track for your project
            </p>
          </div>

          {/* Filters */}
          <div className="max-w-6xl mx-auto mb-12">
            {/* Mood Filter */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Filter by Mood</h3>
              <div className="flex flex-wrap gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedMood === mood
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Use Case Filter */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Filter by Use Case</h3>
              <div className="flex flex-wrap gap-3">
                {useCases.map((useCase) => (
                  <button
                    key={useCase}
                    onClick={() => setSelectedUseCase(useCase)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedUseCase === useCase
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {useCase}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sample Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {filteredSamples.map((sample) => (
              <div
                key={sample.id}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all group"
              >
                {/* Audio Player Placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all"></div>
                  <div className="relative bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg cursor-pointer">
                    <FaPlay className="text-white text-xl ml-1" />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                      {sample.title}
                    </h4>
                    <span className="text-gray-400 text-sm">{sample.duration}</span>
                  </div>

                  {/* Mood Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sample.mood.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Use Case */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-gray-500">Use Case:</span>
                    <span className="text-xs bg-purple-600 bg-opacity-20 text-purple-400 px-3 py-1 rounded-full">
                      {sample.useCase}
                    </span>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <div className="text-2xl font-bold text-blue-400">{sample.price}</div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2">
                      <FaShoppingCart />
                      License
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Results Count */}
          <div className="text-center mt-12">
            <p className="text-gray-400">
              Showing {filteredSamples.length} of {mockSamples.length} tracks
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Audio players and licensing functionality will be added in the next phase
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-800 border-t border-gray-700">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Perfect For Every Space</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Our library is organized by use case to help you find the right vibe
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: FaCoffee,
                title: 'Cafés & Restaurants',
                description: 'Create the perfect ambiance for your dining space',
                count: '28 tracks'
              },
              {
                icon: FaStore,
                title: 'Boutique Retail',
                description: 'Enhance the shopping experience with curated music',
                count: '32 tracks'
              },
              {
                icon: FaDumbbell,
                title: 'Fitness Studios',
                description: 'Energize workouts with motivating soundtracks',
                count: '24 tracks'
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="bg-blue-600 bg-opacity-20 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="text-blue-400 text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-sm text-blue-400 font-semibold">{item.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Need Something Custom?
          </h2>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
            Our library doesn't fit your needs? Commission a custom audio kit tailored specifically to your brand.
          </p>
          <Link
            to="/studio/audio-kits"
            className="inline-flex items-center bg-white text-purple-600 hover:bg-gray-100 px-10 py-5 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
          >
            Explore Custom Audio Kits
          </Link>
        </div>
      </section>
    </ServiceDetailLayout>
  );
}
