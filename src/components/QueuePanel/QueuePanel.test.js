import React from 'react';
import { render } from '@testing-library/react';
import QueuePanel from './QueuePanel';
describe('QueuePanel', () => {
  it('renders without crashing', () => {
    render(<QueuePanel queue={} onRemove={} onReorder={} />);
  });
});
