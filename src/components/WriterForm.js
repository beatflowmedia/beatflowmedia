// src/components/WriterForm.js
// Form component for adding co-writers with revenue splits
import { useState } from "react";

export default function WriterForm({ onAdd, onCancel, existingWriters = [] }) {
  const [writerName, setWriterName] = useState("");
  const [writerUserId, setWriterUserId] = useState("");
  const [splitPercent, setSplitPercent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const split = parseFloat(splitPercent) / 100;

    if (!writerName || !writerUserId || !splitPercent) {
      alert("Please fill in all fields");
      return;
    }

    if (split <= 0 || split > 1) {
      alert("Split must be between 1% and 100%");
      return;
    }

    // Calculate remaining available split
    const totalExisting = existingWriters.reduce((sum, w) => sum + w.split, 0);
    if (totalExisting + split > 1.0) {
      alert(`Only ${((1.0 - totalExisting) * 100).toFixed(1)}% remaining to allocate`);
      return;
    }

    onAdd({
      userId: writerUserId.trim(),
      name: writerName.trim(),
      split: split
    });

    // Reset form
    setWriterName("");
    setWriterUserId("");
    setSplitPercent("");
  };

  const totalExisting = existingWriters.reduce((sum, w) => sum + w.split, 0);
  const remaining = ((1.0 - totalExisting) * 100).toFixed(1);

  return (
    <div className="bg-gray-700 p-4 rounded-lg mt-4">
      <h3 className="text-lg font-bold mb-3">Add Co-Writer</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block mb-1 text-sm">Writer Name:</label>
          <input
            type="text"
            value={writerName}
            onChange={(e) => setWriterName(e.target.value)}
            className="w-full p-2 rounded text-black"
            placeholder="e.g., John Doe"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">Writer User ID (Firebase UID):</label>
          <input
            type="text"
            value={writerUserId}
            onChange={(e) => setWriterUserId(e.target.value)}
            className="w-full p-2 rounded text-black"
            placeholder="e.g., abc123xyz456"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            The Firebase User ID of the co-writer's account
          </p>
        </div>
        <div>
          <label className="block mb-1 text-sm">
            Revenue Split % (Remaining: {remaining}%)
          </label>
          <input
            type="number"
            value={splitPercent}
            onChange={(e) => setSplitPercent(e.target.value)}
            className="w-full p-2 rounded text-black"
            placeholder="e.g., 50"
            min="1"
            max={remaining}
            step="0.1"
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Add Writer
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
