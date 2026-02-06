import PropTypes from 'prop-types';

const MOODS = [
  { value: 'all', label: 'All Moods' },
  { value: 'bright', label: 'Bright' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'warm', label: 'Warm' },
  { value: 'modern', label: 'Modern' },
  { value: 'calm', label: 'Calm' },
  { value: 'bold', label: 'Bold' }
];

export default function MoodFilter({ selectedMood, onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">
        Filter by Mood
      </label>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => onChange(mood.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedMood === mood.value
                ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}
          >
            {mood.label}
          </button>
        ))}
      </div>
    </div>
  );
}

MoodFilter.propTypes = {
  selectedMood: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};
