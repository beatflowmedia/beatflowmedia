import { useState, useRef, useEffect } from "react";
import { extractResumeText, calculateMatchScore, getMatchLevel, extractContactInfo } from "../utils/resumeParser";
import { useModal } from "../hooks/useModal";

const MINIMUM_MATCH_THRESHOLD = 25; // Reject resumes below this score

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
  const { showAlert } = useModal();
  const [form, setForm] = useState(initialState);
  const [isDragging, setIsDragging] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef(null);

  // Reset form on close or new job
  useEffect(() => {
    if (!open) {
      setForm(initialState);
      setMatchScore(null);
      setAnalyzing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [open, job]);

  const analyzeResume = async (file) => {
    if (!file || !job) return;

    setAnalyzing(true);
    setMatchScore(null);

    try {
      const text = await extractResumeText(file);
      const score = calculateMatchScore(text, job);
      setMatchScore(score);

      // Auto-populate form if score is good enough (50%+)
      if (score >= 50) {
        const contactInfo = extractContactInfo(text);

        setForm((prev) => ({
          ...prev,
          name: contactInfo.name || prev.name,
          email: contactInfo.email || prev.email
        }));
      }
    } catch (error) {
      console.error('Resume analysis failed:', error);
      setMatchScore(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const newValue = files ? files[0] : value;
    setForm((prev) => ({
      ...prev,
      [name]: newValue
    }));

    // Analyze resume when file is selected
    if (files && files[0]) {
      analyzeResume(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      // Check file type
      const validTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (validTypes.includes(fileExtension)) {
        setForm((prev) => ({ ...prev, resume: file }));
        // Update the file input to reflect the dropped file
        if (fileRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileRef.current.files = dataTransfer.files;
        }
        // Analyze the dropped resume
        analyzeResume(file);
      } else {
        await showAlert('Invalid File Type', 'Please upload a PDF or DOC file', 'warning');
      }
    }
  };

  const handleFileInputClick = () => {
    fileRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate match score threshold
    if (matchScore !== null && matchScore < MINIMUM_MATCH_THRESHOLD) {
      await showAlert(
        'Requirements Not Met',
        `Your resume does not meet the minimum requirements for this position (${matchScore}% match). Please ensure your qualifications align with the job description.`,
        'warning'
      );
      return;
    }

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
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-4">Apply for: {job?.title}</h2>
        {submitted ? (
          <div className="text-green-400 text-lg">
            Thank you! Your application was submitted.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="job-name" className="block mb-1">
                Full Name
              </label>
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
              <label htmlFor="job-email" className="block mb-1">
                Email
              </label>
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
              <label htmlFor="job-message" className="block mb-1">
                Message / Cover Letter
              </label>
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
              <label htmlFor="job-resume" className="block mb-1">
                Resume (PDF or DOC)
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileInputClick}
                className={`
                  w-full p-8 rounded-lg border-2 border-dashed cursor-pointer
                  transition-colors duration-200
                  ${isDragging
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <svg
                    className="w-12 h-12 mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  {form.resume ? (
                    <div>
                      <p className="text-green-400 font-medium mb-1">{form.resume.name}</p>
                      {analyzing ? (
                        <p className="text-sm text-blue-400">Analyzing resume...</p>
                      ) : matchScore !== null ? (
                        <>
                          <p className={`text-sm font-medium ${getMatchLevel(matchScore).color}`}>
                            Match: {matchScore}% - {getMatchLevel(matchScore).level}
                          </p>
                          {matchScore < MINIMUM_MATCH_THRESHOLD && (
                            <p className="text-sm text-red-400 mt-1">
                              ⚠ Does not meet minimum requirements
                            </p>
                          )}
                        </>
                      ) : null}
                      <p className="text-sm text-gray-400 mt-1">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-medium mb-1">
                        Drop your resume here or click to browse
                      </p>
                      <p className="text-sm text-gray-400">PDF, DOC, or DOCX</p>
                    </div>
                  )}
                </div>
                <input
                  id="job-resume"
                  type="file"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  required
                  onChange={handleChange}
                  className="hidden"
                  ref={fileRef}
                />
              </div>
            </div>
            {error && <div className="text-red-400">{error}</div>}
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
