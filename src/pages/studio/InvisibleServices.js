import { Link } from 'react-router-dom';
import ServiceDetailLayout from '../../components/studio/ServiceDetailLayout';
import {
  FaCheckCircle,
  FaLock,
  FaHandshake,
  FaBolt,
  FaUserSecret,
  FaMagic,
  FaMusic,
  FaVolumeUp,
  FaEdit,
  FaPalette
} from 'react-icons/fa';

export default function InvisibleServices() {
  const services = [
    {
      icon: FaMusic,
      title: 'Track Finishing & Mastering',
      description: 'Professional polish for your nearly-complete productions. We handle the final mix, mastering, and technical refinements to bring your tracks to release-ready quality.',
      priceRange: '$300 - $600'
    },
    {
      icon: FaPalette,
      title: 'Arrangement Support',
      description: 'Structural guidance and arrangement improvements. We help refine song flow, transitions, and overall composition without changing your core creative vision.',
      priceRange: '$400 - $800'
    },
    {
      icon: FaVolumeUp,
      title: 'Intro/Outro Creation',
      description: 'Custom podcast intros, video intros, or song transitions. Professional sonic branding elements that complement your existing content.',
      priceRange: '$250 - $500'
    },
    {
      icon: FaEdit,
      title: 'Mood Reworks',
      description: 'Transform existing tracks into different emotional contexts. Perfect for repurposing content or creating variations for different platforms.',
      priceRange: '$350 - $700'
    },
    {
      icon: FaMagic,
      title: 'Ghost Production',
      description: 'Full production services delivered under your name. Complete confidentiality, exclusive rights, and professional work credited to you.',
      priceRange: '$1,000 - $5,000'
    }
  ];

  const confidentialityPrinciples = [
    {
      icon: FaLock,
      title: 'Complete Confidentiality',
      description: 'All projects are protected by NDA. Your work remains yours, and we never discuss or share project details.'
    },
    {
      icon: FaUserSecret,
      title: 'No Portfolio Usage',
      description: 'We do not add invisible service projects to our public portfolio or credit list without explicit permission.'
    },
    {
      icon: FaHandshake,
      title: 'Exclusive Rights',
      description: 'You own all final deliverables. We transfer all rights and retain no claim to the finished work.'
    },
    {
      icon: FaBolt,
      title: 'Professional Discretion',
      description: 'Our team operates with the highest level of professionalism and discretion in all communications.'
    }
  ];

  const pricingOptions = [
    {
      title: 'Per-Project',
      priceRange: '$300 - $1,000',
      description: 'Single project pricing based on scope and complexity',
      features: [
        'Custom quote based on needs',
        'Clear deliverable timeline',
        'Revision rounds included',
        'Confidentiality agreement',
        'Exclusive rights transfer'
      ]
    },
    {
      title: 'Monthly Retainer',
      priceRange: '$2,000 - $8,000/mo',
      description: 'Ongoing production support for agencies and active creators',
      features: [
        'Dedicated production hours',
        'Priority turnaround',
        'Flexible project types',
        'Regular check-ins',
        'Volume discount pricing',
        'Confidentiality agreement'
      ]
    },
    {
      title: 'Ghost Production',
      priceRange: '$1,000 - $5,000',
      description: 'Full production delivered under your name',
      features: [
        '100% exclusive rights',
        'Complete confidentiality',
        'Professional quality',
        'Your creative direction',
        'No attribution required',
        'Unlimited revisions'
      ]
    }
  ];

  const idealFor = [
    {
      title: 'Artists',
      description: 'Get professional production assistance without compromising your creative vision or brand identity.'
    },
    {
      title: 'Agencies',
      description: 'Scale your music production capacity without hiring full-time staff. Perfect for overflow work or specialized needs.'
    },
    {
      title: 'Content Creators',
      description: 'Professional podcast intros, video outros, and sonic branding without the learning curve of production.'
    },
    {
      title: 'Music Supervisors',
      description: 'Quick turnaround for custom edits, mood variations, and track adaptations for specific scenes or campaigns.'
    }
  ];

  const processSteps = [
    {
      number: '01',
      title: 'Confidential Inquiry',
      description: 'Submit a private consultation request. Share as much or as little as you\'re comfortable with initially.'
    },
    {
      number: '02',
      title: 'NDA & Consultation',
      description: 'We sign an NDA before discussing specifics. Free consultation to understand your needs and provide accurate pricing.'
    },
    {
      number: '03',
      title: 'Proposal & Agreement',
      description: 'Receive a detailed proposal with pricing, timeline, and deliverables. Sign agreement to begin work.'
    },
    {
      number: '04',
      title: 'Production',
      description: 'We work on your project with complete confidentiality. Regular updates and check-ins as needed.'
    },
    {
      number: '05',
      title: 'Delivery & Rights Transfer',
      description: 'Receive final deliverables with full rights transfer. All source files and documentation included.'
    }
  ];

  return (
    <ServiceDetailLayout
      title="Invisible Services - Behind-the-Scenes Production"
      metaDescription="Professional mixing, mastering, ghost production, and track finishing services. Confidential music production for artists, labels, and agencies."
      ogTitle="Invisible Services | BeatFlow Studio"
      ogDescription="Behind-the-scenes music production and finishing services"
      keywords="mixing mastering, ghost production, track finishing, audio restoration, music production services, confidential production"
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-b border-gray-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMzI3MmEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6TTI0IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek0xMiAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="container mx-auto px-6 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-gray-700 bg-opacity-50 px-4 py-2 rounded-full mb-6 border border-gray-600">
              <span className="text-gray-300 font-semibold text-sm">INVISIBLE SERVICES</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Behind-the-Scenes <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">Music Production</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
              Professional production services for artists, agencies, and creators who need expert assistance without the public attribution. Complete confidentiality guaranteed.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/studio/consultation"
                className="inline-flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg border border-gray-600"
              >
                <FaLock className="mr-2" />
                Inquire About Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Confidentiality Principles */}
      <section className="py-20 bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Confidentiality Commitment</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Your work, your credit, your reputation. We operate with complete discretion.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {confidentialityPrinciples.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-gray-700">
                    <Icon className="text-gray-300 text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{principle.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {principle.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Offered */}
      <section className="py-20 bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Services Offered</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professional production assistance tailored to your specific needs
            </p>
          </div>
          <div className="max-w-5xl mx-auto space-y-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start gap-6">
                    <div className="bg-gray-800 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-700">
                      <Icon className="text-gray-400 text-2xl" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-bold">{service.title}</h3>
                        <span className="text-gray-400 font-semibold text-sm bg-gray-800 px-3 py-1 rounded-full">
                          {service.priceRange}
                        </span>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Options */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Pricing Structure</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Flexible pricing options based on your project needs and timeline
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingOptions.map((option, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-gray-600 transition-all"
              >
                <h3 className="text-2xl font-bold mb-2">{option.title}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-400">{option.priceRange}</span>
                </div>
                <p className="text-gray-400 mb-6">{option.description}</p>
                <ul className="space-y-3 mb-8">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-gray-300 text-sm">
                      <FaCheckCircle className="text-gray-500 mr-3 mt-1 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/studio/consultation"
                  className="block text-center px-6 py-3 rounded-lg font-semibold transition-all bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Request Quote
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm max-w-2xl mx-auto">
              All pricing is inquiry-based and customized to your specific needs. Contact us for a confidential consultation and accurate quote.
            </p>
          </div>
        </div>
      </section>

      {/* Ideal For Section */}
      <section className="py-20 bg-gray-800 border-y border-gray-700">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Ideal For</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professional production assistance for various creative professionals
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {idealFor.map((item, index) => (
              <div
                key={index}
                className="bg-gray-900 rounded-lg p-6 border border-gray-700"
              >
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Confidential consultation to delivery process
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {processSteps.map((item, index) => (
                <div key={index} className="flex items-start bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-gray-300 font-bold text-2xl w-16 h-16 rounded-lg flex items-center justify-center mr-6 flex-shrink-0 border border-gray-700">
                    {item.number}
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

      {/* FAQ Section */}
      <section className="py-20 bg-gray-800 border-t border-gray-700">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Common Questions</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Answers to frequently asked questions about our invisible services
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                question: 'What does "invisible services" mean?',
                answer: 'Invisible services are professional production work delivered under your name with complete confidentiality. We provide the technical expertise while you maintain full creative credit and ownership.'
              },
              {
                question: 'Will you sign an NDA?',
                answer: 'Yes, absolutely. We sign a comprehensive NDA before discussing any project specifics. Confidentiality is our top priority.'
              },
              {
                question: 'Do you keep any rights to the work?',
                answer: 'No. You receive 100% exclusive rights to all deliverables. We transfer complete ownership and retain no claim to the finished work.'
              },
              {
                question: 'Can I see examples of previous work?',
                answer: 'Due to the confidential nature of invisible services, we cannot share specific project examples. We can provide general samples of our production quality during consultation.'
              },
              {
                question: 'What turnaround times can I expect?',
                answer: 'Turnaround varies by project scope. Most projects are completed within 1-3 weeks. Rush services are available for urgent needs at an additional fee.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-3">{faq.question}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Discuss Your Project?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Submit a confidential inquiry to discuss your production needs. All consultations are private and protected by NDA.
          </p>
          <Link
            to="/studio/consultation"
            className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-10 py-5 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-2xl border border-gray-600"
          >
            <FaLock className="mr-2" />
            Submit Confidential Inquiry
          </Link>
        </div>
      </section>
    </ServiceDetailLayout>
  );
}
