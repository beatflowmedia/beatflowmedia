import { FaCcVisa, FaCcMastercard, FaCcStripe } from 'react-icons/fa';

const plans = [
  {
    title: 'Individual',
    price: '$11.99 / month after',
    details: [
      '1 Premium account',
      'Cancel anytime',
      '15-hour/month of listening time from our audiobooks',
    ],
    button: 'Try free for 1 month',
    note: 'Free for 1 month, then $11.99/month after.',
    tag: 'Free for 1 month',
  },
  {
    title: 'Student',
    price: '$9.99 / month after',
    details: [
      '1 verified Premium account',
      'Discount for eligible students',
      'Same benefits as Individual',
    ],
    button: 'Try free for 1 month',
    note: 'Free for 1 month, then $9.99/month after.',
    tag: 'Free for 1 month',
  },
  {
    title: 'Duo',
    price: '$16.99 / month after',
    details: [
      '2 Premium accounts',
      'For couples under one roof',
      'Plan manager only',
    ],
    button: 'Get Premium Duo',
    note: 'For couples who reside at the same address.',
    tag: 'Free for 1 month',
  },
  {
    title: 'Family',
    price: '$18.99 / month',
    details: [
      'Up to 6 Premium or Kids accounts',
      'Control content marked as explicit',
      'Access to BeatFlow Kids',
      'Plan manager only',
    ],
    button: 'Get Premium Family',
    note: 'For couples or families who reside at the same address.',
    tag: 'Popular',
  },
];

export default function ExplorePremium() {
  return (
    <div className="min-h-screen bg-bf-page text-bf-text">
      {/* Hero Section */}
      <section className="w-full bg-bf-card py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Listen without limits. Try 1 month of Premium Individual for free.
          </h1>
          <p className="text-base sm:text-lg text-bf-subtext mb-6">
            Only $19.99/month after. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button className="bg-bf-green text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition">
              Get started
            </button>
            <button className="border border-bf-green text-bf-green font-semibold px-6 py-3 rounded-full hover:bg-bf-green hover:text-white transition">
              View plans
            </button>
          </div>
        </div>
      </section>

      {/* Payment Icons */}
      <section className="py-8 text-center">
        <div className="flex justify-center gap-6 text-3xl">
          <FaCcVisa className="text-bf-text hover:text-white transition" />
          <FaCcMastercard className="text-bf-text hover:text-white transition" />
          <FaCcStripe className="text-bf-text hover:text-white transition" />
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          Affordable plans for any situation
        </h2>
        <p className="text-bf-subtext mb-8 max-w-2xl mx-auto text-base sm:text-lg">
          Choose a Premium plan and listen to ad-free music on all your devices.
          Pay in various ways. Cancel anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map(plan => (
            <div
              key={plan.title}
              className="bg-bf-card p-6 rounded-lg flex flex-col h-full"
            >
              {/* Top content */}
              <div>
                <span className="inline-block bg-bf-green text-white px-3 py-1 rounded-full text-xs font-medium mb-4">
                  {plan.tag}
                </span>
                <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
                <p className="text-sm text-bf-subtext mb-4">{plan.price}</p>
                <ul className="text-bf-subtext text-sm space-y-1 mb-6">
                  {plan.details.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>

              {/* CTA & note container */}
              <div className="mt-auto flex flex-col">
                <button className="w-full bg-bf-green text-white font-semibold py-2 rounded-full hover:opacity-90 transition mb-2">
                  {plan.button}
                </button>
                <div className="h-8">
                  <p className="text-xs text-bf-subtext text-center">
                    {plan.note}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
          Experience the difference
        </h2>
        <p className="text-center text-bf-subtext mb-6 text-base sm:text-lg">
          Go Premium and enjoy full control of your listening. Cancel anytime.
        </p>
        <div className="max-w-4xl mx-auto bg-bf-card rounded-lg overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-bf-page">
                <th className="p-4 text-sm text-bf-subtext">What you get</th>
                <th className="p-4 text-sm text-bf-subtext text-center">Free</th>
                <th className="p-4 text-sm text-bf-subtext text-center">Premium</th>
              </tr>
            </thead>
            <tbody>
              {[
                'Ad-free music listening',
                'Download songs',
                'High-quality audio',
                'Listen with fewer ads',
                'Organize listening space',
              ].map((feature, idx) => (
                <tr key={idx} className="border-b border-bf-page">
                  <td className="p-4 text-bf-text">{feature}</td>
                  <td className="p-4 text-center">✖</td>
                  <td className="p-4 text-center">✔</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bf-page text-bf-subtext py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              title: 'Company',
              links: [
                ['About', '/about'],
                ['Jobs', '/jobs'],
                ['For the Record', '/for-the-record'],
              ],
            },
            {
              title: 'Communities',
              links: [
                ['For Artists', '/for-artist'],
                ['Developers', '/developers'],
                ['Advertising', '/advertising'],
              ],
            },
            {
              title: 'Useful links',
              links: [
                ['Support', '/support'],
                ['Web Player App', '/webplayer'],
              ],
            },
            {
              title: 'BeatFlow Plans',
              links: [
                ['Premium Individual', '/individual'],
                ['Premium Student', '/student'],
                ['Premium Duo', '/duo'],
                ['Premium Family', '/family'],
                ['Audiobooks Access', '/audiobooks'],
              ],
            },
          ].map(section => (
            <div key={section.title}>
              <h4 className="text-bf-text font-semibold mb-2">
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.links.map(([text, href]) => (
                  <li key={href}>
                    <a href={href} className="hover:text-bf-text">
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-xs mt-6">
          © 2025 BeatFlow Media. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
