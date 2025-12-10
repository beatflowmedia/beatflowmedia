import React from 'react';
import NowPlayingBar from './NowPlayingBar';
export default {
  title: 'Molecules/NowPlayingBar',
  component: NowPlayingBar
};
export const Default = () => <NowPlayingBar currentTrack={} onPause={} onNext={} onPrev={} />;
