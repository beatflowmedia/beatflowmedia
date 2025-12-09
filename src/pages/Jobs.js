import React, { useState } from "react";
import { useJobs } from "../hooks/useJobs";
import Footer from "../components/Footer";
import JobApplicationModal from "../components/JobApplicationModal";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, Timestamp, addDoc } from "firebase/firestore";

const JOBS_PER_PAGE = 5;

const Jobs = () => {
  const { jobs = [], loading } = useJobs();
  const [openId, setOpenId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(JOBS_PER_PAGE);

  // Filter state
  const [filter, setFilter] = useState({
    location: "All",
    department: "All",
    type: "All"
  });

  // Application modal state
  const [applyJob, setApplyJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Dropdown options
  const allLocations = [
    "All",
    ...new Set(jobs.map((j) => j.location).filter(Boolean)),
  ];
  const allDepartments = [
    "All",
    ...new Set(jobs.map((j) => j.department).filter(Boolean)),
  ];
  const allTypes = [
    "All",
    ...new Set(jobs.map((j) => j.employment_type || j.type).filter(Boolean)),
  ];

  // Filtered and paginated jobs
  const filteredJobs = jobs.filter(
    (j) =>
      (filter.location === "All" || j.location === filter.location) &&
      (filter.department === "All" || j.department === filter.department) &&
      (filter.type === "All" || (j.employment_type || j.type) === filter.type),
  );
  const visibleJobs = filteredJobs.slice(0, visibleCount);

  // Modal handlers
  const handleOpenApply = (job) => {
    setApplyJob(job);
    setSubmitted(false);
    setError(null);
    setProgress(0);
  };
  const handleCloseModal = () => {
    setApplyJob(null);
    setSubmitting(false);
    setError(null);
    setSubmitted(false);
    setProgress(0);
  };

  // Real production: Application submission & upload
  const handleSubmitApplication = async (form, resetForm) => {
    setSubmitting(true);
    setError(null);
    setProgress(0);

    try {
      // 1. Upload the resume file to Storage
      const file = form.resume;
      const jobId = applyJob.id || applyJob.title;
      const filePath = `applications/${jobId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Track upload progress
      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            );
            setProgress(percent);
          },
          (err) => {
            setError("File upload failed.");
            setSubmitting(false);
            reject(err);
          },
          async () => {
            // 2. Get the resume download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // 3. Save the application to Firestore
            await addDoc(collection(db, "applications"), {
              jobId,
              jobTitle: applyJob.title,
              name: form.name,
              email: form.email,
              message: form.message,
              resumeURL: downloadURL,
              submittedAt: Timestamp.now()
            });

            setProgress(100);
            setSubmitted(true);
            resetForm();
            setSubmitting(false);
            resolve();
          },
        );
      });
    } catch (e) {
      setError("Submission failed. Try again!");
      setSubmitting(false);
      setProgress(0);
    }
  };

  const toggleJob = (id) => setOpenId(openId === id ? null : id);
  const handleLoadMore = () => setVisibleCount((v) => v + JOBS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8">Join BeatFlow Media</h1>
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <select
            value={filter.location}
            onChange={(e) =>
              setFilter((f) => ({ ...f, location: e.target.value }))
            }
            className="rounded px-3 py-2 bg-gray-800 text-white"
          >
            {allLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <select
            value={filter.department}
            onChange={(e) =>
              setFilter((f) => ({ ...f, department: e.target.value }))
            }
            className="rounded px-3 py-2 bg-gray-800 text-white"
          >
            {allDepartments.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
          <select
            value={filter.type}
            onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
            className="rounded px-3 py-2 bg-gray-800 text-white"
          >
            {allTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div>Loading jobs…</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-gray-400">
            No open positions right now. Check back soon!
          </div>
        ) : (
          <>
            {visibleJobs.map((job) => {
              const id = job.id || job.title;
              const employmentType = job.employment_type
                ? job.employment_type.replace("_", " ")
                : "";
              const infoRow = [
                job.department,
                job.location,
                employmentType || job.type,
              ]
                .filter(Boolean)
                .join(" · ");
              const isOpen = openId === id;
              return (
                <section
                  key={id}
                  className="mb-6 bg-gray-900 p-6 rounded-lg shadow-md"
                  aria-labelledby={`job-${id}`}
                >
                  <button
                    className="w-full text-left focus:outline-none"
                    aria-expanded={isOpen}
                    aria-controls={`panel-${id}`}
                    onClick={() => toggleJob(id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h2
                          id={`job-${id}`}
                          className="text-2xl font-semibold mb-1"
                        >
                          {job.title || "Untitled Position"}
                        </h2>
                        {infoRow && (
                          <div className="mb-1 text-sm text-gray-400">
                            {infoRow}
                          </div>
                        )}
                      </div>
                      <span className="text-green-400 text-2xl ml-2">
                        {isOpen ? "−" : "+"}
                      </span>
                    </div>
                  </button>
                  {isOpen && (
                    <div
                      id={`panel-${id}`}
                      className="mt-4 transition-all animate-fadeIn"
                    >
                      {job.description && (
                        <div className="mb-4 text-base">{job.description}</div>
                      )}
                      {job.responsibilities?.length > 0 && (
                        <>
                          <strong className="block mb-1">
                            Responsibilities:
                          </strong>
                          <ul className="list-disc ml-5 mb-4">
                            {job.responsibilities.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {job.requirements?.length > 0 && (
                        <>
                          <strong className="block mb-1">Requirements:</strong>
                          <ul className="list-disc ml-5 mb-4">
                            {job.requirements.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      <button
                        className="mt-2 px-5 py-2 bg-green-600 rounded text-white font-semibold hover:bg-green-700 focus:outline-none focus:ring"
                        aria-label={`Apply for ${job.title}`}
                        onClick={() => handleOpenApply(job)}
                      >
                        Apply Now
                      </button>
                    </div>
                  )}
                </section>
              );
            })}
            {visibleCount < filteredJobs.length && (
              <div className="flex justify-center">
                <button
                  className="mt-4 px-5 py-2 bg-gray-800 rounded text-white font-medium hover:bg-gray-700 focus:outline-none"
                  onClick={handleLoadMore}
                  aria-label="Load more jobs"
                >
                  Load more jobs
                </button>
              </div>
            )}
            <div className="mt-6 text-sm text-center text-gray-500">
              Showing {Math.min(visibleCount, filteredJobs.length)} of{" "}
              {filteredJobs.length} open positions
            </div>
          </>
        )}
        <JobApplicationModal
          job={applyJob}
          open={!!applyJob}
          onClose={handleCloseModal}
          onSubmit={handleSubmitApplication}
          submitting={submitting}
          submitted={submitted}
          error={error}
          progress={progress}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Jobs;
