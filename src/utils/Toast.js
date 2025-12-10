// Toast.js
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Initialize Toast Notifications with bottom-center positioning
export const initToast = () => {
  toast.configure({
    position: "bottom-center",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    theme: "dark"
  });
};

// Show Success Toast
export const showSuccessToast = (message) => {
  toast.success(message);
};

// Show Error Toast
export const showErrorToast = (message) => {
  toast.error(message);
};
