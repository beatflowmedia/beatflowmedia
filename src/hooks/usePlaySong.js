/**
 * DRY hook for playing songs with toggle support
 * Handles play/pause toggle for currently playing song
 */
import { useCallback } from 'react';
import { usePlayer } from '../context/PlayerContext';

export function usePlaySong() {
  const { state, dispatch, actions } = usePlayer();

  /**
   * Play a song or toggle play/pause if it's the current song
   * @param {Object} song - The song to play
   */
  const playSong = useCallback((song) => {
    const isCurrentSong = state.queue[state.currentIndex]?.id === song.id;

    if (isCurrentSong) {
      // Toggle play/pause for current song
      dispatch({ type: actions.TOGGLE_PLAY });
    } else {
      // Play new song
      dispatch({ type: actions.PLAY_SONG, payload: song });
    }
  }, [state.queue, state.currentIndex, dispatch, actions]);

  /**
   * Check if a song is currently playing
   * @param {Object} song - The song to check
   * @returns {boolean} - True if song is currently playing
   */
  const isSongPlaying = useCallback((song) => {
    const isCurrentSong = state.queue[state.currentIndex]?.id === song.id;
    return isCurrentSong && state.isPlaying;
  }, [state.queue, state.currentIndex, state.isPlaying]);

  /**
   * Check if a song is the current song (playing or paused)
   * @param {Object} song - The song to check
   * @returns {boolean} - True if song is current
   */
  const isCurrentSong = useCallback((song) => {
    return state.queue[state.currentIndex]?.id === song.id;
  }, [state.queue, state.currentIndex]);

  return {
    playSong,
    isSongPlaying,
    isCurrentSong,
    isPlaying: state.isPlaying
  };
}
