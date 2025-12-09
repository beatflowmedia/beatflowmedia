import React from 'react';
import { render } from '@testing-library/react';
import NowPlayingBar from './NowPlayingBar';
describe('NowPlayingBar', () => {
  it('renders without crashing', () => {
    render(<NowPlayingBar currentTrack={} onPause={} onNext={} onPrev={} />);
  });
});
