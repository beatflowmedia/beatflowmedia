import React from 'react';

/**
 * Animated EQ bars indicator for currently playing songs
 * Shows 4 smooth animated bars when isPlaying is true
 */
export default function PlayingIndicator({ isPlaying, size = 'medium' }) {
  if (!isPlaying) return null;

  const sizeStyles = {
    small: 'h-3 gap-[2px]',
    medium: 'h-4 gap-[2px]',
    large: 'h-5 gap-[3px]'
  };

  const barStyles = {
    small: 'w-[2px]',
    medium: 'w-[3px]',
    large: 'w-[4px]'
  };

  return (
    <div className={`flex items-end ${sizeStyles[size]}`}>
      <div className={`${barStyles[size]} bg-green-500 rounded-sm animate-wave`}></div>
      <div className={`${barStyles[size]} bg-green-500 rounded-sm animate-wave`}></div>
      <div className={`${barStyles[size]} bg-green-500 rounded-sm animate-wave`}></div>
      <div className={`${barStyles[size]} bg-green-500 rounded-sm animate-wave`}></div>
    </div>
  );
}
