// src/hooks/useModal.js
// Hook to access modal functions throughout the application
import { useContext } from 'react';
import { ModalContext } from '../context/ModalContext';

/**
 * Hook to access centralized modal functions
 * @returns {object} - { showAlert, showConfirm, showPrompt }
 *
 * @example
 * const { showAlert, showConfirm, showPrompt } = useModal();
 *
 * // Alert
 * await showAlert('Success', 'Your changes have been saved!', 'success');
 *
 * // Confirm
 * const confirmed = await showConfirm('Delete Item', 'Are you sure you want to delete this?', 'warning');
 * if (confirmed) {
 *   // User clicked Confirm
 * }
 *
 * // Prompt
 * const result = await showPrompt('Enter Name', 'Please enter your name:', 'John Doe');
 * if (result !== null) {
 *   // User entered: result
 * }
 */
export function useModal() {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return context;
}
