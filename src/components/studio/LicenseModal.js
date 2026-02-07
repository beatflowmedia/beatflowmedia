import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaCheckCircle, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

export default function LicenseModal({ sample, isOpen, onClose }) {
  const [selectedLicense, setSelectedLicense] = useState('commercial');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!isOpen || !sample) return null;

  const licenseOptions = [
    {
      id: 'personal',
      name: 'Personal License',
      price: sample.price,
      priceId: 'price_1SxvXcAEum2hO0KZo2hWFSE8',
      description: 'For personal projects, social media, non-commercial use',
      features: [
        'Use in personal videos and content',
        'Social media posts (unlimited)',
        'Non-monetized YouTube videos',
        'Full track + stems included'
      ]
    },
    {
      id: 'commercial',
      name: 'Commercial License',
      price: sample.price * 2,
      priceId: 'price_1SxwDdAEum2hO0KZCcZFzD6p',
      description: 'For business, advertising, monetized content',
      features: [
        'Everything in Personal License',
        'Monetized content and ads',
        'Client projects and commercial work',
        'Business and brand use',
        'Unlimited distribution rights'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise License',
      price: 'Custom',
      priceId: null,
      description: 'For agencies, broadcasters, large-scale campaigns',
      features: [
        'Everything in Commercial License',
        'Broadcast rights (TV, radio)',
        'Film and cinema distribution',
        'White-label rights',
        'Priority support and customization'
      ]
    }
  ];

  const handlePurchase = async () => {
    if (selectedLicense === 'enterprise') {
      // Redirect to consultation form for custom pricing
      window.location.href = '/studio/consultation';
      return;
    }

    // Get the selected license option
    const selectedLicenseOption = licenseOptions.find(opt => opt.id === selectedLicense);

    if (!selectedLicenseOption?.priceId) {
      alert('This license type is not yet available for purchase. Please contact us for pricing.');
      return;
    }

    setLoading(true);

    try {
      // Create Stripe Checkout session
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: selectedLicenseOption.priceId,
          userId: user?.uid || null,
          userEmail: user?.email || null,
          sampleId: sample.id,
          sampleTitle: sample.title,
          licenseType: selectedLicense,
          metadata: {
            sampleId: sample.id,
            sampleTitle: sample.title,
            licenseType: selectedLicense,
            artist: sample.artist
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;

    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error starting checkout. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">License "{sample.title}"</h2>
            <p className="text-gray-400 text-sm">Choose the license that fits your needs</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Sample Info */}
        <div className="p-6 border-b border-gray-700 bg-gray-850">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0">
              <img
                src={sample.coverUrl}
                alt={sample.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{sample.title}</h3>
              <p className="text-gray-400 text-sm">{sample.artist}</p>
              <div className="flex gap-2 mt-2">
                {sample.moods.slice(0, 3).map((mood) => (
                  <span
                    key={mood}
                    className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full capitalize"
                  >
                    {mood}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* License Options */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {licenseOptions.map((license) => (
              <div
                key={license.id}
                onClick={() => setSelectedLicense(license.id)}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedLicense === license.id
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {license.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-white mb-1">{license.name}</h3>
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {typeof license.price === 'number' ? `$${license.price}` : license.price}
                  </div>
                  <p className="text-gray-400 text-xs">{license.description}</p>
                </div>

                <ul className="space-y-2">
                  {license.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <FaCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={14} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {selectedLicense === license.id && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <FaCheckCircle className="text-white" size={14} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex justify-between items-center">
          <div className="text-gray-400 text-sm">
            <p>Secure payment powered by Stripe</p>
            <p className="text-xs mt-1">Instant delivery via email after purchase</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg border border-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaShoppingCart />
              {loading ? 'Processing...' : selectedLicense === 'enterprise' ? 'Contact Us' : 'Purchase License'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

LicenseModal.propTypes = {
  sample: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    artist: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    coverUrl: PropTypes.string.isRequired,
    moods: PropTypes.arrayOf(PropTypes.string).isRequired
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
