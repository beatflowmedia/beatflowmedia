import React from "react";
import { useDropzone } from "react-dropzone";

/**
 * A drop target that is also a proper button.
 *
 * WHY THIS IS SHARED
 * ------------------
 * There were already five drag-and-drop implementations in this codebase -- four
 * hand-rolled from dataTransfer events, one on react-dropzone. Rule-of-three was
 * passed some time ago, so this is the shared one rather than a sixth. The four
 * hand-rolled ones (ContentUpload, JobApplicationModal, AppealTakedown, and the drag
 * handling in SidebarListItem) are extraction candidates, deliberately NOT touched
 * here: they work, and rewriting working upload paths to prove a point is how you
 * break uploads.
 *
 * WHY NOT HAND-ROLLED AGAIN
 * -------------------------
 * react-dropzone is already a dependency and already handles the parts that get
 * skipped when this is written by hand: keyboard activation, focus management, the
 * hidden input wiring, and drag counting (a naive onDragLeave fires when the pointer
 * crosses a CHILD element, so hand-rolled zones flicker).
 *
 * MOBILE
 * ------
 * Drag-and-drop does not exist on a touchscreen. There is no drag, so a drop zone
 * alone is an affordance a phone user cannot reach -- the hover-only trap in another
 * costume. This is therefore a TAP TARGET first and a drop zone second: the whole
 * area activates the file picker, it is at least 44px tall by a wide margin, and the
 * wording leads with "choose" rather than "drag".
 */
export default function FileDropzone({
  label,
  hint,
  accept,
  file,
  onFile,
  maxBytes,
  error
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: 1,
    multiple: false,
    maxSize: maxBytes,
    onDrop: (accepted) => {
      if (accepted && accepted[0]) onFile(accepted[0]);
    }
  });

  const describedBy = `${label.replace(/\W+/g, "-").toLowerCase()}-hint`;

  return (
    <div>
      <span className="block text-sm font-semibold mb-2">{label}</span>

      <div
        {...getRootProps()}
        className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors min-h-[120px] flex flex-col items-center justify-center ${
          isDragActive
            ? "border-green-500 bg-green-900/20"
            : error
            ? "border-red-600 bg-red-900/10"
            : "border-gray-600 bg-gray-800 hover:border-gray-500"
        }`}
        aria-describedby={describedBy}
      >
        <input {...getInputProps()} />

        {file ? (
          <>
            <p className="text-white font-medium break-all">{file.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              {(file.size / (1024 * 1024)).toFixed(1)} MB — tap to replace
            </p>
          </>
        ) : (
          <>
            <p className="text-white font-medium">
              {isDragActive ? "Drop it here" : "Choose a file"}
            </p>
            <p className="text-sm text-gray-400 mt-1">or drag it in</p>
          </>
        )}
      </div>

      {hint && (
        <p id={describedBy} className="text-sm text-gray-500 mt-2">
          {hint}
        </p>
      )}

      {file && (
        <button
          type="button"
          onClick={() => onFile(null)}
          className="mt-2 min-h-[44px] px-4 text-sm text-gray-400 hover:text-white"
        >
          Remove
        </button>
      )}
    </div>
  );
}
