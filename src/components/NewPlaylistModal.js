// components/NewPlaylistModal.js
import { useState } from "react";
import { FaImage } from "react-icons/fa";
import { useModal } from "../hooks/useModal";

const NewPlaylistModal = ({ onCreate, onCancel }) => {
  const { showAlert } = useModal();
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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

  const handleCreate = () => {
    onCreate(name, image);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96">
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
