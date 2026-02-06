import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import StudioNavBar from '../../components/studio/StudioNavBar';
import StudioFooter from '../../components/studio/StudioFooter';
import { FaMusic, FaShoppingCart, FaWrench, FaCheckCircle, FaTimes } from 'react-icons/fa';

export default function StudioServices() {
  const services = [
    {
      title: 'Social Audio Kits',
      price: '$250-$600',
      description: 'Custom sonic identity packs designed for TikTok, Instagram Reels, YouTube Shorts, and more',
      icon: FaMusic,
      link: '/studio/audio-kits',
      ctaText: 'Learn More'
    },
    {
      title: 'Mood Library',
      price: '$29-$99',
      description: 'Curated, ready-to-license audio collections organized by mood and style',
      icon: FaShoppingCart,
      link: '/studio/mood-library',
      ctaText: 'Browse Library'
    },
    {
      title: 'Invisible Services',
      price: 'Custom Pricing',
      description: 'Behind-the-scenes production work including mixing, mastering, and audio restoration',
      icon: FaWrench,
      link: '/studio/invisible-services',
      ctaText: 'Inquire'
    }
  ];

  const comparisonFeatures = [
    { name: 'Custom Composition', audioKits: true, moodLibrary: false, invisible: false },
    { name: 'Instant Download', audioKits: false, moodLibrary: true, invisible: false },
    { name: 'Commercial License', audioKits: true, moodLibrary: true, invisible: true },
    { name: 'Stems Included', audioKits: true, moodLibrary: false, invisible: true },
    { name: 'Revisions', audioKits: 'Up to Unlimited', moodLibrary: false, invisible: 'Varies' },
    { name: 'Turnaround Time', audioKits: '5-7 days', moodLibrary: 'Immediate', invisible: 'Project-based' },
    { name: 'Best For', audioKits: 'Brand Identity', moodLibrary: 'Quick Content', invisible: 'Production Work' }
  ];

  const faqs = [
    {
      question: 'Which service is right for me?',
      answer: 'Audio Kits are perfect if you want custom music tailored to your brand. Mood Library works great for quick content needs with ready-to-use tracks. Invisible Services are ideal for polishing existing tracks or production work.'
    },
    {
      question: 'Can I use the music on all platforms?',
      answer: 'Yes! All our music comes with commercial licensing that allows use on TikTok, Instagram, YouTube, Facebook, podcasts, and more. You\'ll never face copyright strikes.'
    },
    {
      question: 'What file formats do you provide?',
      answer: 'All services include MP3 and WAV formats. Audio Kits also include stems (individual instrument tracks), and premium packages include MIDI files for maximum flexibility.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Audio Kits include revision rounds to ensure satisfaction before final delivery. Mood Library tracks are non-refundable after download. Invisible Services terms vary by project scope.'
    },
    {
      question: 'How do I get started?',
      answer: 'Book a free consultation call where we\'ll discuss your needs, budget, and timeline. We\'ll recommend the best service and create a custom plan for your project.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Our Services - Custom Audio Solutions | BeatFlow Studio</title>
        <meta name="description" content="Choose from Audio Kits, Mood Library, or Invisible Services. Professional sonic branding and music production for modern brands and creators." />
        <meta property="og:title" content="Our Services | BeatFlow Studio" />
        <meta property="og:description" content="Custom audio solutions for brands and creators - Audio Kits, Mood Library, and Invisible Services" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content="audio services, music production, sonic branding, audio kits, mood library, mixing mastering" />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-white">
        <StudioNavBar />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMzI3MmEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6TTI0IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek0xMiAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
          <div className="container mx-auto px-6 py-20 md:py-32 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Our Services
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
                Choose the perfect solution for your brand
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-[#1DB954] transition-all transform hover:scale-105 hover:shadow-2xl group"
                  >
                    <div className="bg-gradient-to-br from-[#1DB954] to-[#169c46] w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="text-white text-2xl" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-[#1DB954] transition-colors">
                      {service.title}
                    </h3>
                    <div className="text-3xl font-bold text-[#1DB954] mb-4">
                      {service.price}
                    </div>
                    <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                      {service.description}
                    </p>
                    <Link
                      to={service.link}
                      className="inline-block w-full text-center bg-gray-700 hover:bg-[#1DB954] text-white py-3 rounded-lg font-semibold transition-all"
                    >
                      {service.ctaText}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-gray-800 border-y border-gray-700">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Compare Services</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                See what's included in each service to find the best fit
              </p>
            </div>
            <div className="max-w-5xl mx-auto overflow-x-auto">
              <table className="w-full border-collapse bg-gray-900 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="text-left p-4 font-bold text-gray-300 border-b border-gray-700">Feature</th>
                    <th className="text-center p-4 font-bold text-gray-300 border-b border-gray-700">Audio Kits</th>
                    <th className="text-center p-4 font-bold text-gray-300 border-b border-gray-700">Mood Library</th>
                    <th className="text-center p-4 font-bold text-gray-300 border-b border-gray-700">Invisible Services</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="p-4 text-gray-300 font-medium">{feature.name}</td>
                      <td className="p-4 text-center">
                        {typeof feature.audioKits === 'boolean' ? (
                          feature.audioKits ? (
                            <FaCheckCircle className="text-green-500 inline-block text-xl" />
                          ) : (
                            <FaTimes className="text-gray-600 inline-block text-xl" />
                          )
                        ) : (
                          <span className="text-gray-300">{feature.audioKits}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof feature.moodLibrary === 'boolean' ? (
                          feature.moodLibrary ? (
                            <FaCheckCircle className="text-green-500 inline-block text-xl" />
                          ) : (
                            <FaTimes className="text-gray-600 inline-block text-xl" />
                          )
                        ) : (
                          <span className="text-gray-300">{feature.moodLibrary}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof feature.invisible === 'boolean' ? (
                          feature.invisible ? (
                            <FaCheckCircle className="text-green-500 inline-block text-xl" />
                          ) : (
                            <FaTimes className="text-gray-600 inline-block text-xl" />
                          )
                        ) : (
                          <span className="text-gray-300">{feature.invisible}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Common questions about our services
              </p>
            </div>
            <div className="max-w-4xl mx-auto space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <h3 className="text-xl font-bold mb-3 text-[#1DB954]">{faq.question}</h3>
                  <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-[#1DB954] to-[#169c46]">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Not Sure Which Service?
            </h2>
            <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Book a free consultation call and we'll help you choose the perfect solution for your needs
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
