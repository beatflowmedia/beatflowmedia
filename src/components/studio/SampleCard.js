import { useState } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import PropTypes from 'prop-types';

export default function SampleCard({ sample, isPlaying, onPlay, onLicense }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:transform hover:scale-[1.02] group">
      {/* Cover Image with Play Button Overlay */}
      <div className="relative aspect-square overflow-hidden bg-gray-900">
        <img
          src={imageError ? '/images/Logo.png' : sample.coverUrl}
          alt={sample.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={handleImageError}
        />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
          <button
            onClick={() => onPlay(sample)}
            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label={isPlaying ? 'Pause' : 'Play preview'}
          >
            {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} className="ml-1" />}
          </button>
        </div>

        {/* Duration Badge */}
        <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {sample.duration}s
        </div>

        {/* Playing Indicator */}
        {isPlaying && (
          <div className="absolute top-3 left-3 flex items-center gap-1">
            <div className="w-1 h-3 bg-green-500 animate-pulse rounded"></div>
            <div className="w-1 h-4 bg-green-500 animate-pulse rounded animation-delay-100"></div>
            <div className="w-1 h-3 bg-green-500 animate-pulse rounded animation-delay-200"></div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title and Artist */}
        <h3 className="text-white font-semibold text-base mb-1 line-clamp-1">
          {sample.title}
        </h3>
        <p className="text-gray-400 text-sm mb-3">
          {sample.artist}
        </p>

        {/* Mood Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {sample.moods.slice(0, 3).map((mood) => (
            <span
              key={mood}
              className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full capitalize"
            >
              {mood}
            </span>
          ))}
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between">
          <div className="text-white font-bold text-lg">
            ${sample.price}
          </div>
          <button
            onClick={() => onLicense(sample)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-all transform hover:scale-105"
          >
            License
          </button>
        </div>

        {/* Use Cases */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-gray-500 text-xs mb-1">Perfect for:</p>
          <p className="text-gray-400 text-xs capitalize">
            {sample.useCases.join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
}

SampleCard.propTypes = {
  sample: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    artist: PropTypes.string.isRequired,
    duration: PropTypes.number.isRequired,
    moods: PropTypes.arrayOf(PropTypes.string).isRequired,
    useCases: PropTypes.arrayOf(PropTypes.string).isRequired,
    price: PropTypes.number.isRequired,
    coverUrl: PropTypes.string.isRequired,
    previewUrl: PropTypes.string.isRequired,
    isSample: PropTypes.bool
  }).isRequired,
  isPlaying: PropTypes.bool.isRequired,
  onPlay: PropTypes.func.isRequired,
  onLicense: PropTypes.func.isRequired
};
