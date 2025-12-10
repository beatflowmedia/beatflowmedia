import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home UI/UX', () => {
  test('renders sidebar with playlists and artists', () => {
    render(<Home />);
    expect(screen.getByText(/Playlists/i)).toBeInTheDocument();
    expect(screen.getByText(/Artists/i)).toBeInTheDocument();
  });

  test('renders search bar', () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/What do you want to play/i)).toBeInTheDocument();
  });

  test('renders main content tabs', () => {
    render(<Home />);
    expect(screen.getByText(/FOR YOU/i)).toBeInTheDocument();
    expect(screen.getByText(/TRENDING/i)).toBeInTheDocument();
    expect(screen.getByText(/NEW RELEASES/i)).toBeInTheDocument();
    expect(screen.getByText(/RECOMMENDED/i)).toBeInTheDocument();
  });

  test('renders playback controls', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });
});
