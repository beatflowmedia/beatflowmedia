import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  FaMusic,
  FaLightbulb,
  FaUsers,
  FaRocket,
  FaClock,
  FaShieldAlt,
  FaCheckCircle
} from 'react-icons/fa';

export default function StudioAbout() {
  const teamMembers = [
    {
      name: 'Alex Rivera',
      role: 'Lead Composer & Producer',
      bio: '15+ years crafting sonic identities for brands across TikTok, Instagram, and YouTube',
      expertise: ['Electronic', 'Pop', 'Ambient']
    },
    {
      name: 'Jordan Chen',
      role: 'Sound Designer',
      bio: 'Specializing in immersive audio experiences and brand sound architecture',
      expertise: ['Sound Design', 'Mixing', 'Audio Branding']
    },
    {
      name: 'Sam Martinez',
      role: 'Music Director',
      bio: 'Curating mood libraries and ensuring every track tells the right story',
      expertise: ['Curation', 'Production', 'Licensing']
    }
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Discovery Call',
      description: 'We start with a free 30-minute consultation to understand your brand, audience, and audio needs',
      icon: FaUsers
    },
    {
      step: '02',
      title: 'Strategic Planning',
      description: 'Our team creates a custom audio strategy aligned with your brand identity and content goals',
      icon: FaLightbulb
    },
    {
      step: '03',
      title: 'Production',
      description: 'Expert composers and producers craft your unique audio, from initial concepts to final polish',
      icon: FaMusic
    },
    {
      step: '04',
      title: 'Delivery',
      description: 'Receive your audio files, stems, and commercial license with ongoing support',
      icon: FaRocket
    }
  ];

  const qualityStandards = [
    {
      icon: FaCheckCircle,
      title: 'Professional Grade',
      description: 'Every track meets broadcast-quality standards with expert mixing and mastering'
    },
    {
      icon: FaClock,
      title: 'Fast Turnaround',
      description: 'Most custom projects delivered within 5-7 days, mood library tracks instantly'
    },
    {
      icon: FaShieldAlt,
      title: 'Platform-Safe',
      description: '100% royalty-free with full commercial licensing - no copyright strikes, ever'
    }
  ];

  return (
    <>
      <Helmet>
        <title>About Us - Custom Sonic Branding Experts | BeatFlow Studio</title>
        <meta name="description" content="BeatFlow Studio creates custom, royalty-free audio for modern brands and creators. Expert sonic branding for social media and beyond." />
        <meta property="og:title" content="About BeatFlow Studio" />
        <meta property="og:description" content="Custom sonic branding for modern brands and creators" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content="about beatflow studio, sonic branding team, audio production experts, music composers" />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMzI3MmEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6TTI0IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek0xMiAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
          <div className="container mx-auto px-6 py-20 md:py-32 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                About BeatFlow Studio
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
                Creating the soundtrack to modern brands
              </p>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-20 bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block bg-blue-600 bg-opacity-20 px-6 py-3 rounded-full mb-8">
                <span className="text-blue-400 font-semibold">OUR MISSION</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                We create custom, royalty-free audio for modern brands and creators
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-6">
                In a world drowning in generic stock music and copyright headaches, we believe your brand deserves better.
                BeatFlow Studio was born from a simple idea: every brand has a unique voice, and that voice deserves a unique sound.
              </p>
              <p className="text-xl text-gray-400 leading-relaxed">
                We're not just making music. We're crafting sonic identities that make your audience stop scrolling and start listening.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story & Approach */}
        <section className="py-20 bg-gray-800 border-y border-gray-700">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Story */}
              <div>
                <h3 className="text-3xl font-bold mb-6 text-[#1DB954]">Our Story</h3>
                <div className="space-y-4 text-gray-400 leading-relaxed">
                  <p>
                    BeatFlow Studio emerged from the intersection of music production and modern content creation.
                    As part of BeatFlow Media Group, we saw content creators and brands struggling with two problems:
                    copyright strikes from using popular music, and the soulless feel of generic stock audio.
                  </p>
                  <p>
                    We assembled a team of professional composers, sound designers, and audio engineers who understand
                    both music production and brand storytelling. Our team has crafted audio for thousands of pieces of
                    content across TikTok, Instagram, YouTube, podcasts, and more.
                  </p>
                  <p>
                    Today, we're pioneering a new approach to sonic branding - one that's accessible, affordable, and
                    designed specifically for the short-form video era.
                  </p>
                </div>
              </div>

              {/* Approach */}
              <div>
                <h3 className="text-3xl font-bold mb-6 text-[#1DB954]">Our Approach</h3>
                <div className="space-y-4 text-gray-400 leading-relaxed">
                  <p>
                    <strong className="text-white">Mood-First Design:</strong> We don't just ask what genre you want.
                    We dig deeper into the feeling you want to evoke, the story you want to tell, and the action you want to inspire.
                  </p>
                  <p>
                    <strong className="text-white">Platform-Native:</strong> Every loop is optimized for the platforms
                    you actually use - 7-15 second perfection for TikTok and Reels, seamless ambient beds for longer content.
                  </p>
                  <p>
                    <strong className="text-white">Human-Crafted:</strong> In an age of AI-generated everything, we believe
                    in the irreplaceable value of human creativity. Every note, every transition, every mix decision is made by experienced professionals.
                  </p>
                  <p>
                    <strong className="text-white">True Ownership:</strong> When you work with us, you own your audio.
                    No subscriptions, no royalties, no surprises. Just clean, simple licensing that lets you focus on creating.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why We're Different */}
        <section className="py-20 bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Why We're Different</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Not your typical stock music library
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <FaMusic className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Custom, Not Templates</h3>
                <p className="text-gray-400 leading-relaxed">
                  We don't sell the same track to 1,000 brands. Your audio kit is uniquely yours, crafted from scratch
                  to match your brand identity.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <FaLightbulb className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Strategy Included</h3>
                <p className="text-gray-400 leading-relaxed">
                  We're not just vendors - we're strategic partners who help you think through how audio enhances your
                  content strategy and brand positioning.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <FaRocket className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Built for Creators</h3>
                <p className="text-gray-400 leading-relaxed">
                  We understand the realities of content creation - tight deadlines, platform requirements,
                  budget constraints. Our services are designed around your actual workflow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-gray-800 border-y border-gray-700">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Meet the Team</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                The composers and sound designers behind your sonic identity
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-[#1DB954] transition-all"
                >
                  <div className="h-64 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center">
                      <FaUsers className="text-gray-600 text-5xl" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                    <p className="text-[#1DB954] font-semibold mb-4">{member.role}</p>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{member.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {member.expertise.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-gray-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Process */}
        <section className="py-20 bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">How We Work</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                A proven process for creating exceptional audio
              </p>
            </div>
            <div className="max-w-4xl mx-auto space-y-8">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-[#1DB954] transition-all"
                  >
                    <div className="bg-gradient-to-br from-[#1DB954] to-[#169c46] w-16 h-16 rounded-lg flex items-center justify-center mr-6 flex-shrink-0">
                      <Icon className="text-white text-2xl" />
                    </div>
                    <div>
                      <div className="text-sm text-[#1DB954] font-bold mb-1">{step.step}</div>
                      <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quality Standards */}
        <section className="py-20 bg-gray-800 border-y border-gray-700">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Quality Standards</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Excellence in every detail
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {qualityStandards.map((standard, index) => {
                const Icon = standard.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Icon className="text-white text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{standard.title}</h3>
                    <p className="text-gray-400 leading-relaxed">
                      {standard.description}
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
              Ready to Start Your Project?
            </h2>
            <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Let's create the perfect sonic identity for your brand
            </p>
            <Link
              to="/studio/consultation"
              className="inline-flex items-center bg-white text-[#1DB954] hover:bg-gray-100 px-10 py-5 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
            >
              Book Your Free Consultation
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
