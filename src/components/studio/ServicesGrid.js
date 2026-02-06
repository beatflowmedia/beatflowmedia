import { Link } from 'react-router-dom';
import { FaMusic, FaShoppingCart, FaWrench, FaCheckCircle } from 'react-icons/fa';

export default function ServicesGrid() {
  const services = [
    {
      title: 'Social Audio Kits',
      price: '$250-$600',
      description: 'Custom sonic identity packs for social media',
      turnaround: '5-7 days',
      icon: FaMusic,
      link: '/studio/audio-kits',
      features: ['Custom composition', 'Multiple variations', 'Stems included', 'Full commercial rights']
    },
    {
      title: 'Mood Library',
      price: '$29-$99',
      description: 'Curated, ready-to-license audio collections',
      turnaround: 'Immediate',
      icon: FaShoppingCart,
      link: '/studio/mood-library',
      features: ['Royalty-free', 'Platform-safe', 'Instant download', 'Multiple formats']
    },
    {
      title: 'Invisible Services',
      price: 'Custom Pricing',
      description: 'Behind-the-scenes music production',
      turnaround: 'Project-based',
      icon: FaWrench,
      link: '/studio/invisible-services',
      features: ['Mixing & mastering', 'Production polish', 'Audio restoration', 'Track finishing']
    }
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Professional audio solutions tailored to your creative needs
          </p>
        </div>
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
                <p className="text-gray-400 mb-2 text-lg">{service.description}</p>
                <p className="text-gray-500 text-sm mb-6">{service.turnaround}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-gray-300 text-sm">
                      <FaCheckCircle className="text-[#1DB954] mr-2 mt-1 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={service.link}
                  className="inline-block w-full text-center bg-gray-700 hover:bg-[#1DB954] text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Learn More
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
