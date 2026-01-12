// components/NewPlaylistModal.js
import { useState } from "react";
import { FaImage } from "react-icons/fa";
import { useModal } from "../hooks/useModal";

// Mood options for algorithmic playlist recommendations (2026 Hybrid Strategy)
const MOOD_OPTIONS = [
  { value: 'energetic', label: 'Energetic', emoji: '⚡' },
  { value: 'chill', label: 'Chill', emoji: '😌' },
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'focus', label: 'Focus', emoji: '🎯' },
  { value: 'workout', label: 'Workout', emoji: '💪' },
  { value: 'party', label: 'Party', emoji: '🎉' },
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'melancholic', label: 'Melancholic', emoji: '🌧️' },
  { value: 'uplifting', label: 'Uplifting', emoji: '🌟' }
];

const NewPlaylistModal = ({ onCreate, onCancel }) => {
  const { showAlert } = useModal();
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPrivate, setIsPrivate] = useState(true); // Default to private
  const [selectedMoods, setSelectedMoods] = useState([]); // Mood tags for algorithmic recommendations

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        await showAlert('Invalid File Type', 'Please select an image file', 'warning');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        await showAlert('File Too Large', 'Image size must be less than 5MB', 'warning');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleMood = (moodValue) => {
    setSelectedMoods(prev =>
      prev.includes(moodValue)
        ? prev.filter(m => m !== moodValue)
        : [...prev, moodValue]
    );
  };

  const handleCreate = () => {
    onCreate(name, image, isPrivate, selectedMoods);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96 max-w-full max-h-[90vh] overflow-y-auto my-8">
        <h2 className="text-white text-xl font-bold mb-4">New Playlist</h2>

        <input
          className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
          placeholder="Enter playlist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Image Upload Section */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">
            Playlist Cover (Optional)
          </label>

          <div className="flex items-center space-x-4">
            {/* Image Preview */}
            <div className="w-24 h-24 bg-gray-800 rounded flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaImage className="text-gray-600 text-3xl" />
              )}
            </div>

            {/* Upload Button */}
            <label className="cursor-pointer px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm">
              Choose Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {image && (
            <button
              onClick={() => {
                setImage(null);
                setImagePreview(null);
              }}
              className="text-red-400 hover:text-red-300 text-sm mt-2"
            >
              Remove Image
            </button>
          )}
        </div>

        {/* Privacy Toggle */}
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${isPrivate ? 'bg-gray-600' : 'bg-green-500'}`}>
                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-0' : 'translate-x-5'}`} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">
                {isPrivate ? 'Private' : 'Public'}
              </span>
              <span className="text-gray-400 text-xs">
                {isPrivate ? 'Only you can see this playlist' : 'All users can see this playlist'}
              </span>
            </div>
          </label>
        </div>

        {/* Mood Tags */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">
            Mood Tags (Optional) - Helps with discovery
          </label>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map(mood => (
              <button
                key={mood.value}
                type="button"
                onClick={() => toggleMood(mood.value)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedMoods.includes(mood.value)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <span className="mr-1">{mood.emoji}</span>
                {mood.label}
              </button>
            ))}
          </div>
          {selectedMoods.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {selectedMoods.length} mood{selectedMoods.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded bg-green-500 hover:bg-green-400 text-white"
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPlaylistModal;
