import React, { useState, useRef, useEffect } from "react";

const initialState = { name: "", email: "", message: "", resume: null };

const JobApplicationModal = ({
  job,
  open,
  onClose,
  onSubmit,
  submitting,
  submitted,
  error,
  progress = 0
}) => {
  const [form, setForm] = useState(initialState);
  const fileRef = useRef(null);

  // Reset form on close or new job
  useEffect(() => {
    if (!open) {
      setForm(initialState);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [open, job]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form, () => {
      setForm(initialState);
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-lg shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >✕</button>
        <h2 className="text-2xl font-bold mb-4">Apply for: {job?.title}</h2>
        {submitted ? (
          <div className="text-green-400 text-lg">
            Thank you! Your application was submitted.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="job-name" className="block mb-1">Full Name</label>
              <input
                id="job-name"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 text-white"
                placeholder="Your name"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="job-email" className="block mb-1">Email</label>
              <input
                id="job-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 text-white"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="job-message" className="block mb-1">Message / Cover Letter</label>
              <textarea
                id="job-message"
                name="message"
                rows={5}
                required
                value={form.message}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 text-white"
                placeholder="Tell us why you're a fit..."
              />
            </div>
            <div>
              <label htmlFor="job-resume" className="block mb-1">Resume (PDF or DOC)</label>
              <input
                id="job-resume"
                type="file"
                name="resume"
                accept=".pdf,.doc,.docx"
                required
                onChange={handleChange}
                className="w-full"
                ref={fileRef}
              />
            </div>
            {error && (
              <div className="text-red-400">{error}</div>
            )}
            {submitting && progress > 0 && progress < 100 && (
              <div className="w-full bg-gray-700 rounded h-2 my-2">
                <div
                  className="bg-green-500 h-2 rounded transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-bold"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default JobApplicationModal;
