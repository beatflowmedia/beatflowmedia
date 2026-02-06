import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import SampleCard from '../../components/studio/SampleCard';
import UseCaseFilter from '../../components/studio/UseCaseFilter';
import MoodFilter from '../../components/studio/MoodFilter';
import MusicPlayer from '../../components/MusicPlayer';
import { usePlayerActions } from '../../hooks/usePlayerActions';

// Mock sample data
const MOCK_SAMPLES = [
  {
    id: 'sample-1',
    title: 'Morning Brew',
    artist: 'BeatFlow Studio',
    duration: 12,
    moods: ['bright', 'energetic'],
    useCases: ['cafe', 'boutique'],
    price: 29,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-1-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-2',
    title: 'Urban Energy',
    artist: 'BeatFlow Studio',
    duration: 15,
    moods: ['energetic', 'bold'],
    useCases: ['fitness', 'content-creator'],
    price: 39,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-2-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-3',
    title: 'Coastal Calm',
    artist: 'BeatFlow Studio',
    duration: 10,
    moods: ['calm', 'warm'],
    useCases: ['real-estate', 'cafe'],
    price: 29,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-3-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-4',
    title: 'Digital Dreams',
    artist: 'BeatFlow Studio',
    duration: 13,
    moods: ['modern', 'energetic'],
    useCases: ['content-creator', 'boutique'],
    price: 49,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-4-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-5',
    title: 'Boutique Vibes',
    artist: 'BeatFlow Studio',
    duration: 11,
    moods: ['warm', 'modern'],
    useCases: ['boutique', 'cafe'],
    price: 35,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-5-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-6',
    title: 'Power Hour',
    artist: 'BeatFlow Studio',
    duration: 14,
    moods: ['energetic', 'bold'],
    useCases: ['fitness'],
    price: 45,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-6-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-7',
    title: 'Elegant Spaces',
    artist: 'BeatFlow Studio',
    duration: 9,
    moods: ['calm', 'modern'],
    useCases: ['real-estate', 'boutique'],
    price: 55,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-7-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-8',
    title: 'Content Flow',
    artist: 'BeatFlow Studio',
    duration: 12,
    moods: ['bright', 'modern'],
    useCases: ['content-creator'],
    price: 39,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-8-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-9',
    title: 'Sunrise Latte',
    artist: 'BeatFlow Studio',
    duration: 10,
    moods: ['bright', 'warm'],
    useCases: ['cafe'],
    price: 29,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-9-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-10',
    title: 'Bold Moves',
    artist: 'BeatFlow Studio',
    duration: 15,
    moods: ['bold', 'energetic'],
    useCases: ['fitness', 'content-creator'],
    price: 45,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-10-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-11',
    title: 'Minimalist Modern',
    artist: 'BeatFlow Studio',
    duration: 11,
    moods: ['modern', 'calm'],
    useCases: ['boutique', 'real-estate'],
    price: 65,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-11-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-12',
    title: 'Creative Spark',
    artist: 'BeatFlow Studio',
    duration: 13,
    moods: ['bright', 'bold'],
    useCases: ['content-creator', 'boutique'],
    price: 49,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-12-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-13',
    title: 'Zen Garden',
    artist: 'BeatFlow Studio',
    duration: 8,
    moods: ['calm', 'warm'],
    useCases: ['cafe', 'real-estate'],
    price: 29,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-13-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-14',
    title: 'Cardio Crush',
    artist: 'BeatFlow Studio',
    duration: 15,
    moods: ['energetic', 'bold'],
    useCases: ['fitness'],
    price: 45,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-14-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-15',
    title: 'Luxury Living',
    artist: 'BeatFlow Studio',
    duration: 12,
    moods: ['modern', 'calm'],
    useCases: ['real-estate'],
    price: 75,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-15-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-16',
    title: 'Indie Vibes',
    artist: 'BeatFlow Studio',
    duration: 14,
    moods: ['warm', 'bright'],
    useCases: ['cafe', 'boutique'],
    price: 35,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-16-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-17',
    title: 'Social Media Beat',
    artist: 'BeatFlow Studio',
    duration: 7,
    moods: ['energetic', 'modern'],
    useCases: ['content-creator'],
    price: 29,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-17-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-18',
    title: 'Strength Training',
    artist: 'BeatFlow Studio',
    duration: 15,
    moods: ['bold', 'energetic'],
    useCases: ['fitness'],
    price: 45,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-18-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-19',
    title: 'Sunday Slow',
    artist: 'BeatFlow Studio',
    duration: 10,
    moods: ['calm', 'warm'],
    useCases: ['cafe', 'boutique'],
    price: 29,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-19-preview.mp3',
    isSample: true
  },
  {
    id: 'sample-20',
    title: 'Future Forward',
    artist: 'BeatFlow Studio',
    duration: 13,
    moods: ['modern', 'bold'],
    useCases: ['content-creator', 'boutique'],
    price: 99,
    coverUrl: '/images/Logo.png',
    previewUrl: '/audio/sample-20-preview.mp3',
    isSample: true
  }
];

export default function StudioSamples() {
  const [selectedUseCase, setSelectedUseCase] = useState('all');
  const [selectedMood, setSelectedMood] = useState('all');
  const [playingSampleId, setPlayingSampleId] = useState(null);

  const { playSong, currentSong, isPlaying } = usePlayerActions();

  // Filter samples based on selected filters
  const filteredSamples = useMemo(() => {
    return MOCK_SAMPLES.filter(sample => {
      const matchesUseCase = selectedUseCase === 'all' || sample.useCases.includes(selectedUseCase);
      const matchesMood = selectedMood === 'all' || sample.moods.includes(selectedMood);
      return matchesUseCase && matchesMood;
    });
  }, [selectedUseCase, selectedMood]);

  const handlePlaySample = (sample) => {
    if (currentSong?.id === sample.id) {
      // Toggle play/pause for current sample
      const audio = document.querySelector('audio');
      if (audio) {
        if (isPlaying) {
          audio.pause();
        } else {
          audio.play();
        }
      }
    } else {
      // Play new sample
      playSong(sample);
      setPlayingSampleId(sample.id);
    }
  };

  const handleLicense = (sample) => {
    // Navigate to license/contact page or open modal
    alert(`Licensing "${sample.title}" - This will integrate with your purchase flow`);
  };

  const handleGetFullVersion = () => {
    if (currentSong) {
      handleLicense(currentSong);
    }
  };

  return (
    <>
      <Helmet>
        <title>Audio Samples - Listen to Our Work | BeatFlow Studio</title>
        <meta name="description" content="Browse brand-ready audio samples from our mood library and custom projects. Filter by mood, use case, and style. Preview before you license." />
        <meta property="og:title" content="Audio Samples | BeatFlow Studio" />
        <meta property="og:description" content="Listen to curated audio samples for cafes, boutiques, fitness studios, and more" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content="audio samples, music samples, background music samples, cafe music samples, boutique music, fitness music, sample library" />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <main className="container mx-auto px-6 py-12 flex-grow">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Audio Samples</h1>
            <p className="text-gray-300 text-lg max-w-3xl">
              Explore our curated library of brand-ready audio. Each sample comes with a 15-second preview.
              License the full track to unlock unlimited commercial use.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <UseCaseFilter
                selectedUseCase={selectedUseCase}
                onChange={setSelectedUseCase}
              />
            </div>
            <MoodFilter
              selectedMood={selectedMood}
              onChange={setSelectedMood}
            />
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm">
              Showing {filteredSamples.length} of {MOCK_SAMPLES.length} samples
            </p>
          </div>

          {/* Sample Grid */}
          {filteredSamples.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-32">
              {filteredSamples.map((sample) => (
                <SampleCard
                  key={sample.id}
                  sample={sample}
                  isPlaying={currentSong?.id === sample.id && isPlaying}
                  onPlay={handlePlaySample}
                  onLicense={handleLicense}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-4">No samples match your filters</p>
              <button
                onClick={() => {
                  setSelectedUseCase('all');
                  setSelectedMood('all');
                }}
                className="text-blue-500 hover:text-blue-400 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </main>

        {/* Music Player - Fixed at bottom */}
        {currentSong && (
          <div className="fixed bottom-0 left-0 right-0 h-24 z-50">
            <MusicPlayer
              previewMode={true}
              maxDuration={15}
              onGetFullVersion={handleGetFullVersion}
            />
          </div>
        )}
      </div>
    </>
  );
}
