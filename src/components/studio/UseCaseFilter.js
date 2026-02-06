import { FaChevronDown } from 'react-icons/fa';
import PropTypes from 'prop-types';

const USE_CASES = [
  { value: 'all', label: 'All Use Cases' },
  { value: 'cafe', label: 'Café' },
  { value: 'boutique', label: 'Boutique' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'content-creator', label: 'Content Creator' }
];

export default function UseCaseFilter({ selectedUseCase, onChange }) {
  return (
    <div className="relative">
      <label htmlFor="usecase-filter" className="block text-sm text-gray-400 mb-2">
        Filter by Use Case
      </label>
      <div className="relative">
        <select
          id="usecase-filter"
          value={selectedUseCase}
          onChange={(e) => onChange(e.target.value)}
          className="w-full md:w-64 bg-gray-800 text-white border border-gray-700 rounded-md px-4 py-2.5 pr-10 appearance-none cursor-pointer hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          {USE_CASES.map((useCase) => (
            <option key={useCase.value} value={useCase.value}>
              {useCase.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
          <FaChevronDown size={14} />
        </div>
      </div>
    </div>
  );
}

UseCaseFilter.propTypes = {
  selectedUseCase: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};
