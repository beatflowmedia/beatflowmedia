// src/components/Modal.js
import { useEffect } from 'react';

/**
 * @param {object}   props
 * @param {Function} [props.onConfirm]    Supply this to make the modal a CHOICE rather
 *                                        than an acknowledgement: a second button
 *                                        appears and `onClose` becomes the decline.
 *                                        Without it the modal keeps its single OK
 *                                        button, so every existing caller is unchanged.
 * @param {string}   [props.confirmLabel]
 * @param {string}   [props.cancelLabel]
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onConfirm = null,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel'
}) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeStyles = {
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    success: 'bg-green-500',
    info: 'bg-blue-500'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${typeStyles[type] || typeStyles.info} px-6 py-4`}>
          <h2 id="modal-title" className="text-xl font-bold text-white">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer.
            min-h-[44px] on every button: px-6 py-2 renders about 36px, below the 44px
            touch target a fingertip needs. gap-3 keeps two adjacent buttons from
            misfiring into each other. */}
        <div className="px-6 py-4 bg-gray-800 flex justify-end gap-3">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2 min-h-[44px] bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 min-h-[44px] bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 min-h-[44px] bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
