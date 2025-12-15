import React from "react";
import { Link } from "react-router-dom";
import { FiMic, FiVideo, FiEdit, FiCheckCircle } from "react-icons/fi";

export default function CreativeLab() {
  const services = [
    {
      icon: <FiMic className="text-5xl text-bf-green mb-4" />,
      title: "Audio Production",
      description: "Professional voiceover talent, sound design, and music composition for high-impact audio ads.",
      features: [
        "Professional voice talent casting",
        "Scriptwriting and copywriting",
        "Sound design and mixing",
        "Music licensing and composition",
        "Multiple language support"
      ],
      turnaround: "5-7 business days",
      pricing: "Starting at $1,500"
    },
    {
      icon: <FiVideo className="text-5xl text-bf-green mb-4" />,
      title: "Video Production",
      description: "Full-service video production from concept to final delivery, optimized for BeatFlow's platform.",
      features: [
        "Concept development and storyboarding",
        "Motion graphics and animation",
        "Video editing and color grading",
        "Mobile-first optimization",
        "Multiple aspect ratios delivered"
      ],
      turnaround: "10-14 business days",
      pricing: "Starting at $3,500"
    },
    {
      icon: <FiEdit className="text-5xl text-bf-green mb-4" />,
      title: "Creative Strategy",
      description: "Expert consultation to develop high-performing ad creative aligned with your brand and objectives.",
      features: [
        "Creative brief development",
        "Audience insights and targeting strategy",
        "A/B testing recommendations",
        "Competitor analysis",
        "Performance optimization"
      ],
      turnaround: "3-5 business days",
      pricing: "Starting at $800"
    },
    {
      icon: <FiCheckCircle className="text-5xl text-bf-green mb-4" />,
      title: "Creative Review & Optimization",
      description: "Get expert feedback on your existing creative assets and recommendations for improvement.",
      features: [
        "Creative audit and analysis",
        "Performance benchmarking",
        "Optimization recommendations",
        "Best practices guidance",
        "Format conversion assistance"
      ],
      turnaround: "2-3 business days",
      pricing: "Starting at $500"
    }
  ];

  const process = [
    {
      step: 1,
      title: "Submit Your Brief",
      description: "Tell us about your campaign objectives, target audience, and creative needs."
    },
    {
      step: 2,
      title: "Strategy Session",
      description: "Our creative team reviews your brief and schedules a consultation call to align on direction."
    },
    {
      step: 3,
      title: "Creative Development",
      description: "We develop concepts, scripts, and designs. You review and provide feedback at key milestones."
    },
    {
      step: 4,
      title: "Production & Delivery",
      description: "Final assets are produced, reviewed, and delivered in all required formats ready to upload."
    }
  ];

  const portfolio = [
    {
      brand: "TechStart Pro",
      industry: "Software",
      format: "Audio Ad Campaign",
      result: "3.5x above benchmark CTR"
    },
    {
      brand: "FreshBite Foods",
      industry: "Food & Beverage",
      format: "Video Ad Series",
      result: "92% brand recall increase"
    },
    {
      brand: "Wellness Hub",
      industry: "Health & Fitness",
      format: "Podcast Sponsorship",
      result: "4.2x ROAS"
    },
    {
      brand: "Urban Threads",
      industry: "Fashion",
      format: "Multi-Format Campaign",
      result: "250% increase in app installs"
    }
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-br from-bf-green to-green-700 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Link to="/advertising" className="text-black hover:underline mb-4 inline-block">
            � Back to Advertising
          </Link>
          <h1 className="text-6xl font-bold mb-4 text-black">BeatFlow Creative Lab</h1>
          <p className="text-black text-xl max-w-3xl mx-auto">
            Professional creative services designed to help your ads stand out and drive results.
          </p>
        </div>
      </header>

      {/* Services */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, idx) => (
              <div key={idx} className="bg-gray-800 p-8 rounded-lg">
                <div className="flex justify-center">{service.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-center">{service.title}</h3>
                <p className="text-gray-400 mb-6">{service.description}</p>

                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-bf-green">What's Included:</h4>
                  <ul className="space-y-2">
                    {service.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start text-gray-300 text-sm">
                        <FiCheckCircle className="text-bf-green mr-2 mt-1 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">Turnaround</p>
                    <p className="font-semibold">{service.turnaround}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Pricing</p>
                    <p className="font-semibold text-bf-green">{service.pricing}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {process.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-bf-green text-black font-bold rounded-full w-16 h-16 flex items-center justify-center text-2xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Featured Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {portfolio.map((project, idx) => (
              <div key={idx} className="bg-gray-800 p-8 rounded-lg">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold mb-2">{project.brand}</h3>
                  <p className="text-gray-400 text-sm">{project.industry}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded mb-4">
                  <p className="text-gray-400 text-sm mb-1">Campaign Type</p>
                  <p className="font-semibold">{project.format}</p>
                </div>
                <div className="bg-bf-green bg-opacity-10 border border-bf-green p-4 rounded">
                  <p className="text-gray-400 text-sm mb-1">Result</p>
                  <p className="font-bold text-bf-green text-lg">{project.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Why Choose Creative Lab</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-bf-green mb-4">500+</div>
              <h3 className="text-xl font-bold mb-2">Campaigns Delivered</h3>
              <p className="text-gray-400">Proven track record of high-performing creative</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-bf-green mb-4">95%</div>
              <h3 className="text-xl font-bold mb-2">Client Satisfaction</h3>
              <p className="text-gray-400">Consistently exceeding expectations</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-bf-green mb-4">2.8x</div>
              <h3 className="text-xl font-bold mb-2">Avg Performance Lift</h3>
              <p className="text-gray-400">Professional creative drives better results</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Something Amazing?</h2>
          <p className="text-gray-400 mb-8">
            Let's bring your vision to life with professional creative services from BeatFlow Creative Lab.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/creative-quote">
              <button className="bg-bf-green text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition">
                Request a Quote
              </button>
            </Link>
            <Link to="/resources/creative-best-practices">
              <button className="border border-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition">
                View Best Practices
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
