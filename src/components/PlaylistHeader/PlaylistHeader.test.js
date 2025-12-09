import React from 'react';
import { render } from '@testing-library/react';
import PlaylistHeader from './PlaylistHeader';
describe('PlaylistHeader', () => {
  it('renders without crashing', () => {
    render(<PlaylistHeader playlist={} onEdit={} />);
  });
});
