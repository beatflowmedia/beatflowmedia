import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import StudioNavBar from '../../components/studio/StudioNavBar';
import StudioFooter from '../../components/studio/StudioFooter';
import StudioHero from '../../components/studio/StudioHero';
import ServicesGrid from '../../components/studio/ServicesGrid';
import FeaturedSamples from '../../components/studio/FeaturedSamples';
import {
  FaCoffee,
  FaStore,
  FaDumbbell,
  FaHome,
  FaVideo,
  FaMicrophone,
  FaCheckCircle,
  FaShieldAlt,
  FaBolt,
  FaHeart
} from 'react-icons/fa';

export default function StudioHome() {
  const useCases = [
    {
      title: 'Café & Restaurant',
      description: 'Create the perfect ambiance for your dining space with custom loops that match your brand identity',
      icon: FaCoffee
    },
    {
      title: 'Boutique Retail',
      description: 'Enhance the shopping experience with curated background music that drives customer engagement',
      icon: FaStore
    },
    {
      title: 'Fitness Studios',
      description: 'Energize workouts with high-tempo tracks designed for motivation and movement',
      icon: FaDumbbell
    },
    {
      title: 'Real Estate',
      description: 'Professional sonic branding for property tours, presentations, and marketing materials',
      icon: FaHome
    },
    {
      title: 'Content Creators',
      description: 'Platform-safe music for YouTube, TikTok, and Instagram without copyright strikes',
      icon: FaVideo
    },
    {
      title: 'Podcasts',
      description: 'Custom intro/outro music and background beds that make your show memorable',
      icon: FaMicrophone
    }
  ];

  const benefits = [
    {
      icon: FaCheckCircle,
      title: 'Exclusive Rights',
      description: 'Full ownership of custom audio kits with no recurring fees'
    },
    {
      icon: FaShieldAlt,
      title: 'Platform-Safe',
      description: 'Guaranteed copyright-free for all social media and streaming platforms'
    },
    {
      icon: FaBolt,
      title: 'Fast Turnaround',
      description: 'Most projects delivered within 5-7 days, mood library instantly'
    },
    {
      icon: FaHeart,
      title: 'Human-Curated',
      description: 'Every track professionally crafted by experienced producers, not AI-generated'
    }
  ];

  return (
    <>
      <Helmet>
        <title>BeatFlow Studio - Custom Sonic Branding for Short-Form Content</title>
        <meta name="description" content="Mood-driven, royalty-free audio designed for modern brands and creators. Audio kits, mood libraries, and invisible services for professional content." />
        <meta property="og:title" content="BeatFlow Studio - Custom Sonic Branding" />
        <meta property="og:description" content="Professional audio solutions for TikTok, Instagram Reels, YouTube, and beyond" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content="sonic branding, audio branding, music production, tiktok music, instagram music, youtube music, custom audio, royalty-free music" />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-white">
        <StudioNavBar />

        {/* Hero Section */}
        <StudioHero />

        {/* Services Grid */}
        <ServicesGrid />

        {/* Use Cases Section */}
        <section className="py-20 bg-gray-800 border-y border-gray-700">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Perfect For</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Custom audio solutions for every industry and application
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {useCases.map((useCase, index) => {
                const Icon = useCase.icon;
                return (
                  <div
                    key={index}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-start mb-4">
                      <div className="bg-blue-600 bg-opacity-20 p-3 rounded-lg mr-4">
                        <Icon className="text-blue-400 text-2xl" />
                      </div>
                      <h3 className="text-xl font-bold mt-2">{useCase.title}</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Samples */}
        <FeaturedSamples />

        {/* Why BeatFlow Studio */}
        <section className="py-20 bg-gray-800 border-y border-gray-700">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Why BeatFlow Studio</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Professional audio solutions you can trust
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Icon className="text-white text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                    <p className="text-gray-400 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-[#1DB954] to-[#169c46]">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Elevate Your Brand Sound?
            </h2>
            <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Let's discuss your project and create the perfect sonic identity for your brand
            </p>
            <Link
              to="/studio/consultation"
              className="inline-flex items-center bg-white text-[#1DB954] hover:bg-gray-100 px-10 py-5 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
            >
              Book Your Free Consultation
            </Link>
          </div>
        </section>

        <StudioFooter />
      </div>
    </>
  );
}
