import React from 'react';
import { render } from '@testing-library/react';
import PlayerProgress from './PlayerProgress';
describe('PlayerProgress', () => {
  it('renders without crashing', () => {
    render(<PlayerProgress progress={} duration={} onSeek={} />);
  });
});
