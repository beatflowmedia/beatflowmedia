// src/pages/ForTheRecord.js
// News hub powered by the blog system - "For the Record" news and insights
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Footer from "../components/Footer";
import marketingService from "../services/marketingService";
import GoogleAdSense from '../components/GoogleAdSense';

export default function ForTheRecord() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [featuredPost, setFeaturedPost] = useState(null);

  const categories = [
    "All",
    "Technology",
    "Artists",
    "Culture",
    "Podcasts",
    "Playlists",
    "Company News",
    "Insights"
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    // Filter posts by category
    if (selectedCategory === "All") {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.category === selectedCategory));
    }
  }, [selectedCategory, posts]);

  const loadPosts = async () => {
    try {
      setLoading(true);

      // Fetch published blog posts from Firestore
      const publishedPosts = await marketingService.getBlogPosts({
        status: 'published',
        limit: 20
      });

      if (publishedPosts.length > 0) {
        // Set the most recent/viewed post as featured
        const featured = publishedPosts.reduce((prev, current) =>
          (prev.views || 0) > (current.views || 0) ? prev : current
        );
        setFeaturedPost(featured);

        // Set remaining posts
        setPosts(publishedPosts.filter(p => p.id !== featured.id));
        setFilteredPosts(publishedPosts.filter(p => p.id !== featured.id));
      } else {
        // Fallback to mock data if no posts in database
        const mockPosts = getMockPosts();
        setFeaturedPost(mockPosts[0]);
        setPosts(mockPosts.slice(1));
        setFilteredPosts(mockPosts.slice(1));
      }
    } catch (error) {
      console.error('Error loading blog posts:', error);
      // Fallback to mock data on error
      const mockPosts = getMockPosts();
      setFeaturedPost(mockPosts[0]);
      setPosts(mockPosts.slice(1));
      setFilteredPosts(mockPosts.slice(1));
    } finally {
      setLoading(false);
    }
  };

  const getMockPosts = () => [
    {
      id: 'wrapped-2024',
      title: 'BeatFlow Media Wrapped 2024: The Biggest Year Yet',
      slug: 'wrapped-2024',
      category: 'Company News',
      excerpt: 'Explore the top artists, songs, and podcasts that defined 2024 on BeatFlow Media.',
      image: null,
      views: 5000
    },
    {
      id: 'ai-playlists',
      title: 'Introducing AI-Powered Personalized Playlists',
      slug: 'ai-powered-playlists',
      category: 'Technology',
      excerpt: 'Our new recommendation engine learns from your listening habits to create the perfect soundtrack.'
    },
    {
      id: 'artists-2025',
      title: 'Supporting Independent Artists in 2025',
      slug: 'supporting-artists-2025',
      category: 'Artists',
      excerpt: 'How BeatFlow Media is helping emerging artists reach new audiences and grow their careers.'
    },
    {
      id: 'lossless-audio',
      title: 'Enhanced Audio Quality with Lossless Streaming',
      slug: 'lossless-streaming',
      category: 'Technology',
      excerpt: 'Experience your favorite music in studio-quality sound.'
    },
    {
      id: 'global-expansion',
      title: 'BeatFlow Media Expands to 20 New Markets',
      slug: 'global-expansion-2025',
      category: 'Company News',
      excerpt: 'Bringing music to millions more listeners worldwide.'
    },
    {
      id: 'lofi-rise',
      title: 'The Rise of Lo-Fi Hip Hop: A Global Phenomenon',
      slug: 'lofi-hiphop-phenomenon',
      category: 'Culture',
      excerpt: 'How a niche genre became the soundtrack for productivity.'
    },
    {
      id: 'top-podcasts',
      title: 'Top Podcasts of 2024: Year in Review',
      slug: 'top-podcasts-2024',
      category: 'Podcasts',
      excerpt: 'The shows that captivated listeners around the world.'
    },
    {
      id: 'curator-stories',
      title: 'Curated Collections: Behind the Scenes',
      slug: 'curator-behind-scenes',
      category: 'Playlists',
      excerpt: 'Meet the curators who craft your favorite playlists.'
    },
    {
      id: 'streaming-industry',
      title: 'How Music Streaming Changed the Industry',
      slug: 'streaming-industry-transformation',
      category: 'Insights',
      excerpt: 'A decade of transformation in the music business.'
    }
  ];

  return (
    <>
      <GoogleAdSense />
      <Helmet>
        <title>For the Record - BeatFlow Media News & Insights</title>
        <meta name="description" content="News, stories, and insights from BeatFlow Media. Stay updated on artist success stories, platform updates, industry insights, and more." />
        <meta property="og:title" content="For the Record - BeatFlow Media" />
        <meta property="og:description" content="News, stories, and insights from BeatFlow Media" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <main className="flex-1 pt-16 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <h1 className="text-5xl font-bold mb-4">For the Record</h1>
            <p className="text-xl text-gray-400 mb-12">
              News, stories, and insights from BeatFlow Media
            </p>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="loading-skeleton w-16 h-16 rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Loading latest stories...</p>
              </div>
            )}

            {/* Featured Story */}
            {!loading && featuredPost && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <Link
                  to={`/blog/${featuredPost.slug || featuredPost.id}`}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors"
                >
                  <div className="h-64 bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                    {featuredPost.image ? (
                      <img
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-6xl">📰</span>
                    )}
                  </div>
                  <div className="p-6">
                    <span className="text-sm text-gray-400">FEATURED</span>
                    <h2 className="text-2xl font-bold mt-2 mb-3">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-400 mb-4">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-green-500 hover:underline font-semibold">
                        Read More →
                      </span>
                      {featuredPost.readTime && (
                        <span className="text-sm text-gray-500">{featuredPost.readTime}</span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Sidebar Stories */}
                <div className="space-y-4">
                  {posts.slice(0, 2).map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug || post.id}`}
                      className="bg-gray-800 rounded-lg p-6 block hover:bg-gray-750 transition-colors"
                    >
                      <span className="text-sm text-gray-400">{post.category || 'NEWS'}</span>
                      <h3 className="text-xl font-bold mt-2 mb-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-green-500 hover:underline text-sm font-semibold">
                          Learn More →
                        </span>
                        {post.readTime && (
                          <span className="text-xs text-gray-500">{post.readTime}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Filter */}
            {!loading && (
              <div className="border-t border-gray-800 pt-8 mb-8">
                <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        selectedCategory === category
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Stories Grid */}
            {!loading && filteredPosts.length > 0 && (
              <>
                <h2 className="text-3xl font-bold mb-6">Latest Stories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {filteredPosts.slice(2).map((story) => (
                    <Link
                      key={story.id}
                      to={`/blog/${story.slug || story.id}`}
                      className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
                    >
                      <span className="text-sm text-gray-400">{story.category || 'UNCATEGORIZED'}</span>
                      <h3 className="text-lg font-bold mt-2 mb-2">{story.title}</h3>
                      <p className="text-gray-400 text-sm mb-3">{story.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-green-500 hover:underline text-sm font-semibold">
                          Read More →
                        </span>
                        {story.views > 0 && (
                          <span className="text-xs text-gray-500">{story.views} views</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {!loading && filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  No stories found in this category. Check back soon!
                </p>
              </div>
            )}

            {/* View All Blog Link */}
            {!loading && (
              <div className="text-center py-8">
                <Link
                  to="/blog"
                  className="inline-block bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
                >
                  View All Blog Posts
                </Link>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
