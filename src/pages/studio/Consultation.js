import { Helmet } from 'react-helmet-async';
import StudioNavBar from '../../components/studio/StudioNavBar';
import StudioFooter from '../../components/studio/StudioFooter';
import ConsultationForm from '../../components/studio/ConsultationForm';

export default function Consultation() {
  return (
    <>
      <Helmet>
        <title>Book a Free Consultation - Custom Audio Solutions | BeatFlow Studio</title>
        <meta name="description" content="Schedule a free 30-minute consultation with our expert producers. Discuss your audio needs, brand goals, and get a custom quote for your project." />
        <meta property="og:title" content="Book a Consultation | BeatFlow Studio" />
        <meta property="og:description" content="Free consultation for custom audio and sonic branding projects" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content="consultation, audio consultation, music production consultation, sonic branding quote, free consultation" />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-white">
        <StudioNavBar />
        <main className="container mx-auto px-6 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Book a Consultation</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-2">
              Schedule a consultation with our expert producers to discuss your music production needs.
            </p>
            <p className="text-gray-400 text-sm">
              Fill out the form below and we'll get back to you within 24 hours.
            </p>
          </div>

          {/* Consultation Form */}
          <ConsultationForm />

          {/* Contact Info Section */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">
              Prefer to reach out directly?{' '}
              <a href="mailto:studio@beatflow.com" className="text-green-500 hover:text-green-400 underline">
                studio@beatflow.com
              </a>
            </p>
          </div>
        </main>
        <StudioFooter />
      </div>
    </>
  );
}
