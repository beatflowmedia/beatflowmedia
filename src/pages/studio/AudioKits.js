import { Link } from 'react-router-dom';
import ServiceDetailLayout from '../../components/studio/ServiceDetailLayout';
import PricingCard from '../../components/studio/PricingCard';
import {
  FaPlay,
  FaMusic,
  FaCheckCircle,
  FaVideo,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaStore,
  FaClock,
  FaInfinity,
  FaShieldAlt
} from 'react-icons/fa';

export default function AudioKits() {
  const pricingTiers = [
    {
      title: 'Starter',
      price: '$250',
      description: 'Perfect for individual creators',
      features: [
        '3 short loops (7-15 seconds)',
        '1 ambient bed (30 seconds)',
        'Royalty-free commercial license',
        '1 revision round',
        '5-7 day turnaround',
        'MP3 & WAV formats'
      ],
      ctaText: 'Book Consultation'
    },
    {
      title: 'Professional',
      price: '$400',
      description: 'Best value for growing brands',
      features: [
        '5 short loops (7-15 seconds)',
        '1 ambient bed (45 seconds)',
        'Royalty-free commercial license',
        '2 revision rounds',
        '5-7 day turnaround',
        'MP3, WAV & stems included',
        'Priority support'
      ],
      highlighted: true,
      badge: 'MOST POPULAR',
      ctaText: 'Book Consultation'
    },
    {
      title: 'Premium',
      price: '$600',
      description: 'Ultimate package for agencies',
      features: [
        '8 short loops (7-15 seconds)',
        '2 ambient beds (up to 60 seconds)',
        'Royalty-free commercial license',
        'Unlimited revisions',
        '3-5 day turnaround',
        'Full stems & MIDI files',
        'Dedicated producer',
        'Brand consultation call'
      ],
      ctaText: 'Book Consultation'
    }
  ];

  const useCases = [
    {
      title: 'TikTok Creators',
      description: 'Stand out with unique audio that builds your brand identity',
      icon: FaTiktok
    },
    {
      title: 'Instagram Reels',
      description: 'Consistent sonic branding across your content feed',
      icon: FaInstagram
    },
    {
      title: 'YouTube Shorts',
      description: 'Platform-safe music that won\'t trigger copyright claims',
      icon: FaYoutube
    },
    {
      title: 'Local Businesses',
      description: 'Professional audio for social media marketing campaigns',
      icon: FaStore
    }
  ];

  const whatsIncluded = [
    {
      icon: FaMusic,
      title: 'Custom Composition',
      description: 'Every loop is tailored to your brand, mood, and target audience'
    },
    {
      icon: FaClock,
      title: 'Optimized Length',
      description: '7-15 second loops perfect for short-form video platforms'
    },
    {
      icon: FaInfinity,
      title: 'Seamless Loops',
      description: 'Professionally crafted to loop perfectly without awkward transitions'
    },
    {
      icon: FaShieldAlt,
      title: 'Full Rights',
      description: 'Royalty-free commercial license - use anywhere, anytime'
    }
  ];

  const sampleAudioPlaceholders = [
    { id: 1, title: 'Energetic Pop Loop', duration: '0:12', mood: ['Upbeat', 'Modern'] },
    { id: 2, title: 'Chill Ambient Bed', duration: '0:45', mood: ['Relaxed', 'Warm'] },
    { id: 3, title: 'Tech Minimal Loop', duration: '0:10', mood: ['Clean', 'Professional'] },
    { id: 4, title: 'Boutique Vibe', duration: '0:15', mood: ['Sophisticated', 'Trendy'] },
    { id: 5, title: 'Workout Energy', duration: '0:08', mood: ['Powerful', 'Dynamic'] },
    { id: 6, title: 'Café Background', duration: '0:30', mood: ['Mellow', 'Inviting'] }
  ];

  return (
    <ServiceDetailLayout
      title="Social Audio Kits - Custom Sonic Branding"
      metaDescription="Custom sonic identity packs for TikTok, Instagram Reels, and YouTube Shorts. Royalty-free audio designed for your brand with full commercial licensing."
      ogTitle="Social Audio Kits | BeatFlow Studio"
      ogDescription="Custom sonic identity packs for short-form video content"
      keywords="audio kits, sonic branding, tiktok music, instagram reels music, youtube shorts music, custom audio loops, royalty-free music"
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMzI3MmEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6TTI0IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek0xMiAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="container mx-auto px-6 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-blue-600 bg-opacity-20 px-4 py-2 rounded-full mb-6">
              <span className="text-blue-400 font-semibold text-sm">SOCIAL AUDIO KITS</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Custom Sonic Identity Packs for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Short-Form Video</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
              Stand out on social media with unique, platform-safe audio loops crafted specifically for your brand
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/studio/consultation"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Book Consultation
              </Link>
              <a
                href="#samples"
                className="inline-flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg border border-gray-600"
              >
                <FaPlay className="mr-2" />
                Listen to Samples
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What's Included</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to elevate your social media presence
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {whatsIncluded.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Icon className="text-white text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {item.description}
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Pricing</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose the package that fits your needs. All kits include commercial licensing and 5-7 day turnaround.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <PricingCard key={index} {...tier} />
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              Need a custom package? <Link to="/studio/consultation" className="text-blue-400 hover:text-blue-300 underline">Contact us</Link> for enterprise pricing and volume discounts.
            </p>
          </div>
        </div>
      </section>

      {/* Sample Audio Players Section */}
      <section id="samples" className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Sample Audio Kits</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Listen to examples of our custom audio loops and ambient beds
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {sampleAudioPlaceholders.map((sample) => (
              <div
                key={sample.id}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all group cursor-pointer"
              >
                <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all"></div>
                  <div className="relative bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <FaPlay className="text-white text-xl ml-1" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                      {sample.title}
                    </h4>
                    <span className="text-gray-400 text-sm">{sample.duration}</span>
                  </div>
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
          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">
              Audio players will be functional in the next phase. These are sample placeholders.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-800 border-y border-gray-700">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Perfect For</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Audio kits designed for modern content creators and businesses
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all text-center"
                >
                  <div className="bg-blue-600 bg-opacity-20 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-blue-400 text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {useCase.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Simple process from consultation to delivery
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  step: '01',
                  title: 'Book Consultation',
                  description: 'Schedule a free 30-minute call to discuss your brand, target audience, and audio needs'
                },
                {
                  step: '02',
                  title: 'Mood & Style Brief',
                  description: 'Share references, brand guidelines, and desired mood. We\'ll create a custom production plan'
                },
                {
                  step: '03',
                  title: 'Production',
                  description: 'Our team crafts your unique audio loops and ambient beds over 5-7 days'
                },
                {
                  step: '04',
                  title: 'Review & Revise',
                  description: 'Listen to your custom kit and request revisions to perfect the sound'
                },
                {
                  step: '05',
                  title: 'Delivery',
                  description: 'Receive your final audio files, stems, and commercial license documentation'
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-2xl w-16 h-16 rounded-lg flex items-center justify-center mr-6 flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Create Your Sonic Identity?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Book a free consultation to discuss your audio kit needs and get a custom quote
          </p>
          <Link
            to="/studio/consultation"
            className="inline-flex items-center bg-white text-blue-600 hover:bg-gray-100 px-10 py-5 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
          >
            Book Free Consultation
          </Link>
        </div>
      </section>
    </ServiceDetailLayout>
  );
}
