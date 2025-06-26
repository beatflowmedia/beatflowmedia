import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPencilAlt, FaEllipsisH } from 'react-icons/fa';
import ContextMenu from './ContextMenu'; // adjust the import based on your file structure

export default function EditPlaylistModal({ isOpen, playlist, onSave, onClose }) {
  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(playlist?.cover || null);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [photoMenuPos, setPhotoMenuPos] = useState({ x: 0, y: 0 });
  const fileInputRef = React.useRef();

  // build photo context menu options
  const photoMenuOptions = [
    { label: 'Change photo', onClick: () => fileInputRef.current.click() },
    { label: 'Remove photo', onClick: () => { setCoverFile(null); setCoverPreview(null); setPhotoMenuVisible(false); } }
  ];
  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreview(url);
    }
  }, [coverFile]);
   
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, description, coverFile });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Edit Details</h2>
        <div className="flex space-x-4">
          <div className="relative w-32 h-32 bg-gray-700 rounded flex items-center justify-center">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover rounded" />
            ) : (
              <div className="text-gray-400"><FaPencilAlt size={32} /></div>
            )}
            <button
              type="button"
              className="absolute top-1 right-1 text-gray-200 hover:text-white"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPhotoMenuPos({ x: rect.right, y: rect.bottom });
                setPhotoMenuVisible(true);
              }}
            ><FaEllipsisH /></button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={e => setCoverFile(e.target.files[0])}
            />
          </div>
          <form onSubmit={handleSubmit} className="flex-1 space-y-4">
           <div>
             <label className="block text-sm mb-1">Title</label>
             <input
               className="w-full p-2 bg-gray-700 rounded"
               value={name}
               onChange={(e) => setName(e.target.value)}
             />
           </div>
           <div>
             <label className="block text-sm mb-1">Description</label>
             <textarea
               className="w-full p-2 bg-gray-700 rounded"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
             />
           </div>
           <div className="flex justify-end space-x-2">
             <button
               type="button"
               className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
               onClick={onClose}
             >Cancel</button>
             <button
               type="submit"
               className="px-4 py-2 bg-green-500 rounded hover:bg-green-600"
             >Save</button>
           </div>
          </form>
        </div>
        <ContextMenu
          visible={photoMenuVisible}
          x={photoMenuPos.x}
          y={photoMenuPos.y}
          items={photoMenuOptions}
          onClose={() => setPhotoMenuVisible(false)}
        />
        <p className="text-xs text-gray-400 mt-4 leading-tight">
          By proceeding, you agree to give Spotify access to the image you choose to upload. Please make sure you have the right to upload the image.
        </p>
      </div>
    </div>
  );
}

EditPlaylistModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  playlist: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
