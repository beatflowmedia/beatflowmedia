import React from "react";
import Footer from "../components/Footer";

export default function Accessibility() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Accessibility</h1>
          <p className="text-xl text-gray-400 mb-12">
            Our commitment to making BeatFlow Media accessible to everyone
          </p>

          {/* Mission Statement */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold mb-3">Music for Everyone</h2>
            <p className="text-lg">
              At BeatFlow Media, we believe everyone should be able to enjoy music, regardless of their
              abilities. We're committed to making our service accessible to all users, including those
              with disabilities.
            </p>
          </div>

          {/* Accessibility Features */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Accessibility features</h2>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🎧</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Screen Reader Support</h3>
                    <p className="text-gray-400 mb-3">
                      BeatFlow Media is compatible with popular screen readers including JAWS, NVDA, VoiceOver,
                      and TalkBack. All interactive elements are properly labeled for screen reader users.
                    </p>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Descriptive labels for all buttons and controls</li>
                      <li>• Logical reading order and navigation structure</li>
                      <li>• ARIA landmarks and live regions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">⌨️</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Keyboard Navigation</h3>
                    <p className="text-gray-400 mb-3">
                      Full keyboard navigation support allows you to use BeatFlow Media without a mouse.
                    </p>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Tab through all interactive elements</li>
                      <li>• Spacebar to play/pause</li>
                      <li>• Arrow keys for volume and track navigation</li>
                      <li>• Keyboard shortcuts for common actions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🎨</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">High Contrast Mode</h3>
                    <p className="text-gray-400 mb-3">
                      Our interface respects your system's high contrast settings and provides sufficient
                      color contrast ratios for better visibility.
                    </p>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• WCAG 2.1 Level AA compliant contrast ratios</li>
                      <li>• Support for system high contrast modes</li>
                      <li>• Clear visual focus indicators</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🔍</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Text Scaling</h3>
                    <p className="text-gray-400 mb-3">
                      Adjust text size according to your preferences and needs.
                    </p>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Respects browser and system text size settings</li>
                      <li>• Text remains readable when zoomed up to 200%</li>
                      <li>• Responsive layout adapts to different sizes</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🎵</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Captions for Video Content</h3>
                    <p className="text-gray-400 mb-3">
                      Video content on BeatFlow Media includes closed captions for users who are deaf or
                      hard of hearing.
                    </p>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Closed captions for music videos</li>
                      <li>• Transcripts for podcast content</li>
                      <li>• Adjustable caption settings</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🗣️</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Voice Control</h3>
                    <p className="text-gray-400 mb-3">
                      Control BeatFlow Media with your voice through integration with voice assistants.
                    </p>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Amazon Alexa integration</li>
                      <li>• Google Assistant support</li>
                      <li>• Siri voice commands (iOS)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Support */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Platform accessibility</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Web</h3>
                <ul className="text-gray-400 space-y-2">
                  <li>• WCAG 2.1 Level AA compliance</li>
                  <li>• Works with all major browsers</li>
                  <li>• Keyboard and screen reader accessible</li>
                  <li>• Responsive design for all screen sizes</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">iOS</h3>
                <ul className="text-gray-400 space-y-2">
                  <li>• VoiceOver support</li>
                  <li>• Dynamic Type for text sizing</li>
                  <li>• Voice Control compatibility</li>
                  <li>• Reduce Motion support</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Android</h3>
                <ul className="text-gray-400 space-y-2">
                  <li>• TalkBack compatibility</li>
                  <li>• Font size preferences</li>
                  <li>• Voice Access support</li>
                  <li>• High contrast themes</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Desktop Apps</h3>
                <ul className="text-gray-400 space-y-2">
                  <li>• Screen reader compatible</li>
                  <li>• Full keyboard navigation</li>
                  <li>• System accessibility settings</li>
                  <li>• Custom keyboard shortcuts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Keyboard shortcuts</h2>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-4">Action</th>
                    <th className="text-left p-4">Shortcut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <tr>
                    <td className="p-4">Play/Pause</td>
                    <td className="p-4 text-gray-400">Spacebar</td>
                  </tr>
                  <tr>
                    <td className="p-4">Next Track</td>
                    <td className="p-4 text-gray-400">Ctrl/Cmd + →</td>
                  </tr>
                  <tr>
                    <td className="p-4">Previous Track</td>
                    <td className="p-4 text-gray-400">Ctrl/Cmd + ←</td>
                  </tr>
                  <tr>
                    <td className="p-4">Volume Up</td>
                    <td className="p-4 text-gray-400">Ctrl/Cmd + ↑</td>
                  </tr>
                  <tr>
                    <td className="p-4">Volume Down</td>
                    <td className="p-4 text-gray-400">Ctrl/Cmd + ↓</td>
                  </tr>
                  <tr>
                    <td className="p-4">Search</td>
                    <td className="p-4 text-gray-400">Ctrl/Cmd + K</td>
                  </tr>
                  <tr>
                    <td className="p-4">Like Song</td>
                    <td className="p-4 text-gray-400">Ctrl/Cmd + S</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Standards Compliance */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Standards & compliance</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                BeatFlow Media is committed to meeting or exceeding the following accessibility standards:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• <strong>WCAG 2.1 Level AA:</strong> Web Content Accessibility Guidelines</li>
                <li>• <strong>Section 508:</strong> U.S. federal accessibility standards</li>
                <li>• <strong>ADA:</strong> Americans with Disabilities Act compliance</li>
                <li>• <strong>EN 301 549:</strong> European accessibility standard</li>
              </ul>
            </div>
          </div>

          {/* Ongoing Improvements */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Ongoing improvements</h2>
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                We're continuously working to improve accessibility across all platforms. Our efforts include:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Regular accessibility audits and testing</li>
                <li>• User feedback and testing with assistive technology users</li>
                <li>• Staff training on accessibility best practices</li>
                <li>• Collaboration with accessibility experts</li>
                <li>• Ongoing updates to meet evolving standards</li>
              </ul>
            </div>
          </div>

          {/* Feedback */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">We want your feedback</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                We value feedback from users of all abilities. If you encounter accessibility barriers
                while using BeatFlow Media, or if you have suggestions for improvement, please let us know.
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Email:</p>
                  <a href="mailto:accessibility@beatflowmediagroup.com" className="text-green-500 hover:underline">
                    accessibility@beatflowmediagroup.com
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Support:</p>
                  <a href="/support" className="text-green-500 hover:underline">
                    Visit our Help Center
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Accessibility resources</h2>
            <p className="text-gray-300 mb-4">
              Learn more about accessibility features on different platforms:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a href="/#" className="text-green-500 hover:underline">Apple Accessibility →</a>
              <a href="/#" className="text-green-500 hover:underline">Android Accessibility →</a>
              <a href="/#" className="text-green-500 hover:underline">Windows Accessibility →</a>
              <a href="/#" className="text-green-500 hover:underline">Web Accessibility Initiative →</a>
            </div>
          </div>
          </div>
      </main>
      <Footer />
    </div>
  );
}
