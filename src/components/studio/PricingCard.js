import { FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function PricingCard({
  title,
  price,
  description,
  features,
  ctaText = 'Get Started',
  ctaLink = '/studio/consultation',
  highlighted = false,
  badge = null
}) {
  return (
    <div
      className={`bg-gray-800 rounded-xl p-8 border transition-all transform hover:scale-105 ${
        highlighted
          ? 'border-blue-500 shadow-2xl shadow-blue-500/20'
          : 'border-gray-700 hover:border-blue-500'
      }`}
    >
      {badge && (
        <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
          {badge}
        </div>
      )}

      <h3 className="text-2xl font-bold mb-2">{title}</h3>

      <div className="mb-4">
        <span className="text-4xl font-bold text-blue-400">{price}</span>
      </div>

      {description && (
        <p className="text-gray-400 mb-6">{description}</p>
      )}

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start text-gray-300">
            <FaCheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        to={ctaLink}
        className={`block text-center px-6 py-3 rounded-lg font-semibold transition-all ${
          highlighted
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
      >
        {ctaText}
      </Link>
    </div>
  );
}
