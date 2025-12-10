import React from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiTrendingUp, FiAward } from "react-icons/fi";

export default function NewsInspiration() {
  const articles = [
    {
      category: "Industry News",
      date: "December 8, 2024",
      title: "BeatFlow Surpasses 500M Active Users Globally",
      excerpt: "Our growing listener base means more opportunities for advertisers to reach engaged audiences across every demographic.",
      image: "/images/news-1.jpg"
    },
    {
      category: "Success Story",
      date: "December 5, 2024",
      title: "How Nike Increased Brand Recall by 92% with BeatFlow Audio Ads",
      excerpt: "Learn how Nike leveraged podcast sponsorships and targeted audio ads to reach fitness enthusiasts during their workout sessions.",
      image: "/images/news-2.jpg"
    },
    {
      category: "Best Practices",
      date: "December 1, 2024",
      title: "The Power of Context: Timing Your Ads for Maximum Impact",
      excerpt: "New research shows ads served during morning commutes see 40% higher engagement. Here's how to optimize your dayparting strategy.",
      image: "/images/news-3.jpg"
    },
    {
      category: "Product Update",
      date: "November 28, 2024",
      title: "Introducing Advanced Audience Targeting 2.0",
      excerpt: "Target listeners by musical mood, activity context, and real-time listening behavior with our new AI-powered targeting tools.",
      image: "/images/news-4.jpg"
    },
    {
      category: "Success Story",
      date: "November 25, 2024",
      title: "Local Coffee Chain Drives 250% Foot Traffic with Geo-Targeted Ads",
      excerpt: "Discover how a regional coffee brand used location-based targeting to drive morning customers to nearby locations.",
      image: "/images/news-5.jpg"
    },
    {
      category: "Insights",
      date: "November 20, 2024",
      title: "Gen Z & Audio Advertising: What Brands Need to Know",
      excerpt: "78% of Gen Z listeners discover new brands through BeatFlow. Here's how to craft messages that resonate with this demographic.",
      image: "/images/news-6.jpg"
    }
  ];

  const inspiration = [
    {
      icon: <FiAward className="text-5xl text-bf-green mb-4" />,
      title: "Award-Winning Campaigns",
      description: "Explore creative work from brands that won BeatFlow's Annual Advertising Excellence Awards.",
      link: "#"
    },
    {
      icon: <FiTrendingUp className="text-5xl text-bf-green mb-4" />,
      title: "Trend Reports",
      description: "Stay ahead with our quarterly reports on audio advertising trends and consumer behavior insights.",
      link: "#"
    },
    {
      icon: <FiCalendar className="text-5xl text-bf-green mb-4" />,
      title: "Upcoming Events",
      description: "Join webinars, workshops, and conferences featuring industry leaders and BeatFlow experts.",
      link: "#"
    }
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/advertising" className="text-bf-green hover:underline mb-4 inline-block">
            ê Back to Advertising
          </Link>
          <h1 className="text-5xl font-bold mb-4">News & Inspiration</h1>
          <p className="text-gray-400 text-lg">
            Stay informed with the latest advertising insights, success stories, and platform updates.
          </p>
        </div>
      </header>

      {/* Featured Article */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800 rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            <div className="bg-gray-700 h-80 lg:h-auto flex items-center justify-center">
              <div className="text-6xl text-gray-600">Featured</div>
            </div>
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <span className="bg-bf-green text-black px-3 py-1 rounded-full text-sm font-semibold inline-block w-fit mb-3">
                Featured Story
              </span>
              <h2 className="text-3xl font-bold mb-4">
                The Future of Audio Advertising: 2025 Predictions
              </h2>
              <p className="text-gray-400 mb-6">
                Industry experts share their predictions for audio advertising trends in 2025, from AI-driven personalization to immersive audio experiences.
              </p>
              <div className="flex items-center text-gray-500 text-sm mb-6">
                <FiCalendar className="mr-2" />
                <span>December 10, 2024</span>
              </div>
              <button className="bg-bf-green text-black px-6 py-3 rounded-full font-semibold w-fit hover:bg-green-400 transition">
                Read Full Article
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, idx) => (
              <div key={idx} className="bg-gray-900 rounded-lg overflow-hidden hover:transform hover:scale-105 transition">
                <div className="bg-gray-700 h-48 flex items-center justify-center">
                  <div className="text-4xl text-gray-600">Image</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-bf-green text-sm font-semibold">{article.category}</span>
                    <span className="text-gray-500 text-xs">{article.date}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{article.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{article.excerpt}</p>
                  <a href="#" className="text-bf-green hover:underline text-sm font-semibold">
                    Read more í
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspiration Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Find Your Inspiration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {inspiration.map((item, idx) => (
              <div key={idx} className="bg-gray-800 p-8 rounded-lg text-center">
                <div className="flex justify-center">{item.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-400 mb-6">{item.description}</p>
                <a href={item.link} className="text-bf-green hover:underline font-semibold">
                  Explore í
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
          <p className="text-gray-400 mb-8">
            Subscribe to our newsletter for monthly insights, case studies, and advertising tips delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-grow bg-gray-700 px-6 py-3 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bf-green"
            />
            <button
              type="submit"
              className="bg-bf-green text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Your Success Story?</h2>
          <p className="text-gray-400 mb-8">
            Join the brands making headlines with BeatFlow advertising.
          </p>
          <Link to="/ad-signup">
            <button className="bg-bf-green text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition">
              Get Started Today
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
