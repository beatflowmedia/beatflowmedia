import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { Link } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useModal } from "../hooks/useModal";
import Footer from '../components/Footer';

// Resources dropdown items
const resourcesLinks = [
  { label: "Help Center", href: "/resources/help-center" },
  { label: "Ad Specs", href: "/resources/ad-specs" },
  { label: "Wrapped for Advertisers 2024", href: "/resources/wrapped-2024" },
  {
    label: "Creative Best Practices",
    href: "/resources/creative-best-practices"
  },
  { label: "Partners", href: "/resources/partners" },
  { label: "Analytics Help Center", href: "/resources/analytics-help-center" },
];

export default function Advertising() {
  const { showAlert } = useModal();
  const [formData, setFormData] = useState({
    businessType: "I am a brand/business",
    objective: "Looking to drive revenue",
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    website: "",
    country: "United States",
    state: "",
    newsletter: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, "advertisingInquiries"), {
        ...formData,
        submittedAt: new Date(),
        status: "pending",
      });

      console.log("Advertising inquiry submitted with ID:", docRef.id);
      await showAlert('Success', 'Thank you for your interest! Our advertising team will contact you within 24 hours.', 'success');

      // Reset form
      setFormData({
        businessType: "I am a brand/business",
        objective: "Looking to drive revenue",
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        website: "",
        country: "United States",
        state: "",
        newsletter: false,
      });
    } catch (error) {
      console.error("Error submitting advertising inquiry:", error);
      await showAlert('Error', 'There was an error submitting your inquiry. Please try again.', 'error');
    }
  };
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header nav */}
      <header className="bg-gray-900">
        <nav className="max-w-6xl mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center space-x-8">
            <span className="text-2xl font-bold text-bf-green">
              BeatFlow Advertising
            </span>
            <Link to="/get-started" className="hover:text-gray-400">
              Get Started
            </Link>
            <Link to="/ad-formats" className="hover:text-gray-400">
              Ad Formats
            </Link>
            <Link to="/goals" className="hover:text-gray-400">
              Goals
            </Link>
            <Link to="/news-inspiration" className="hover:text-gray-400">
              News & Inspiration
            </Link>
            <Link to="/creative-lab" className="hover:text-gray-400">
              Creative Lab
            </Link>
            <div className="relative group">
              <button className="flex items-center hover:text-gray-400">
                Resources <FiChevronDown className="ml-1" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {resourcesLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="block px-4 py-2 hover:bg-gray-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link to="/ad-signup">
            <button className="bg-bf-green px-4 py-2 rounded-full text-black font-semibold">
              Create an ad
            </button>
          </Link>
        </nav>
      </header>

      {/* Hero section with image */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold mb-4">
              Your ads work harder with BeatFlow Media
            </h1>
            <p className="text-gray-400 mb-8">
              Advertising on BeatFlow Media gives you more moments to reach your
              audience, more attention paid to your message, more success across
              the funnel, and flexible ways to buy to help you achieve your
              business objectives.
            </p>
            <div className="flex justify-center lg:justify-start space-x-4">
              <Link to="/ad-signup">
                <button className="bg-white text-black px-6 py-3 rounded-full font-semibold">
                  Create an ad
                </button>
              </Link>
              <button className="border border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-black">
                Learn More
              </button>
            </div>
          </div>
          <div>
            <img
              src="/images/hero-ads.png"
              alt="Advertising creative"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">The numbers don't lie</h2>
          <p className="text-gray-400">
            When ads reach you at the right moment, they don’t interrupt—they
            engage. That’s why ads on BeatFlow Media are remembered more
            frequently and more favorably than other platforms.
          </p>
        </div>
      </section>

      {/* Custom inquiry form */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Prompt text */}
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Looking for something a little more custom? Let's talk.
            </h2>
          </div>
          {/* Inquiry form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-gray-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="bg-gray-700 p-3 rounded w-full"
              >
                <option>I am a brand/business</option>
                <option>Agency/Partner</option>
              </select>
              <select
                name="objective"
                value={formData.objective}
                onChange={handleChange}
                className="bg-gray-700 p-3 rounded w-full"
              >
                <option>Looking to drive revenue</option>
                <option>Building brand awareness</option>
              </select>
            </div>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              required
              className="w-full bg-gray-700 p-3 rounded"
            />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              required
              className="w-full bg-gray-700 p-3 rounded"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              className="w-full bg-gray-700 p-3 rounded"
            />
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Company"
              required
              className="w-full bg-gray-700 p-3 rounded"
            />
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="Website"
              className="w-full bg-gray-700 p-3 rounded"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="bg-gray-700 p-3 rounded w-full"
              >
                <option>United States</option>
                <option>United Kingdom</option>
              </select>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="bg-gray-700 p-3 rounded w-full"
              >
                <option value="">State</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="newsletter"
                name="newsletter"
                type="checkbox"
                checked={formData.newsletter}
                onChange={handleChange}
                className="bg-gray-700 rounded text-bf-green"
              />
              <label htmlFor="newsletter" className="text-gray-300">
                Sign up for our newsletter
              </label>
            </div>
            <button
              type="submit"
              className="bg-bf-green text-black px-6 py-3 rounded-full font-semibold"
            >
              Get in touch
            </button>
          </form>
        </div>
      </section>

      {/* Ad formats section */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Ad formats that help drive outcomes
            </h2>
            <p className="text-gray-400">
              Our ad formats and capabilities are as dynamic as our base.
              BeatFlow Ads Manager makes it easy to get the right ad to the
              right person, at the right time.
            </p>
          </div>
          <div className="relative">
            {/* Placeholder for ad formats carousel/image */}
            <img
              src="/images/ad-formats.jpg"
              alt="Ad formats showcase"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
        {/* Video Ads */}
        <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <img
            src="/images/video-ads.jpg"
            alt="Eye-catching video ads"
            className="rounded-lg shadow-lg"
          />
          <div>
            <h3 className="text-2xl font-semibold mb-2">
              Eye-catching video ads
            </h3>
            <p className="text-gray-400 mb-4">
              Create moments of connection through visual storytelling, served
              only when your audience is listening in the app.
            </p>
            <button className="bg-bf-green text-black px-4 py-2 rounded-full font-semibold">
              Learn more
            </button>
          </div>
        </div>
        {/* Audio Ads */}
        <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <img
            src="/images/audio-ads.jpg"
            alt="Audio ads"
            className="rounded-lg shadow-lg"
          />
          <div>
            <h3 className="text-2xl font-semibold mb-2">
              Attention-grabbing audio ads
            </h3>
            <p className="text-gray-400 mb-4">
              Reach active listeners on any device, at any time of day. Audio
              ads are served between songs, so listeners are distraction-free
              and focused on what you have to say.
            </p>
            <button className="bg-bf-green text-black px-4 py-2 rounded-full font-semibold">
              Learn more
            </button>
          </div>
        </div>
        {/* Podcast Ads */}
        <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <img
            src="/images/podcast-ads.jpg"
            alt="Podcast ads"
            className="rounded-lg shadow-lg"
          />
          <div>
            <h3 className="text-2xl font-semibold mb-2">
              Thought-provoking podcast ads
            </h3>
            <p className="text-gray-400 mb-4">
              Align your message with top podcasts and shows for deep listener
              engagement. Podcast ads drive conversation and brand recall.
            </p>
            <button className="bg-bf-green text-black px-4 py-2 rounded-full font-semibold">
              Learn more
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
