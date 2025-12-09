import React from 'react';
import { render } from '@testing-library/react';
import TrackRow from './TrackRow';
describe('TrackRow', () => {
  it('renders without crashing', () => {
    render(<TrackRow track={} onPlay={} onAddToPlaylist={} />);
  });
});
