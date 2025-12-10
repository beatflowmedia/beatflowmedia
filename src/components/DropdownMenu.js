// components/DropdownMenu.js
import React, { useEffect, useRef } from "react";

export default function DropdownMenu({
  visible = false,
  onClose = () => {},
  children,
  className = "",
  position = "top-full mt-2 right-0"
}) {
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className={`absolute ${position} bg-gray-800 text-white rounded shadow-md p-2 z-50 w-40 ${className}`}
      style={{
        maxWidth: "calc(100vw - 1rem)", // Prevent overflow on small screens
        right: "0",
        overflowWrap: "break-word",
        wordBreak: "break-word"
      }}
    >
      {children}
    </div>
  );
}
