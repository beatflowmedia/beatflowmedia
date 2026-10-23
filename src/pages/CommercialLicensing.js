// src/pages/CommercialLicensing.js
//
// THE PILLAR. /commercial-music-licensing
//
// WHY THIS PAGE EXISTS
// CLAUDE.md's SEO section asks for "a few DEEP pillar pages (the definitive treatment of
// a core topic), HUB pages that route to them, and SPOKES that support them". BFMG had
// the hubs and the spokes and no pillar: /browse/library routes to 23 collections, each
// collection routes to its tracks, /sync-licensing converts a quote — and nothing above
// any of it said what a commercial music licence IS. A cluster with no centre reads as
// isolated pages, which is the thin/duplicate signal the whole structure exists to avoid.
//
// THE CAVEAT IS THE HARD PART: "depth must be real. Padding a stub to a word count
// produces the exact thin/duplicate signal you were escaping." So this page is built out
// of the things BFMG actually knows and can prove, and nothing else:
//
//   the two rights, and why holding both matters          one-stop clearance
//   what each product costs and WHY the curve is a curve  real arithmetic, from pricing.js
//   whether a video gets claimed                          the Content ID position
//   what is excluded and why those are quoted             broadcast, cinema, paid ads
//   how AI provenance is handled                          stated in writing
//   how to tell a licence is real                         the certificate and its number
//
// Every number is DERIVED from src/utils/pricing.js rather than typed, so the page and
// the checkout cannot disagree. A pillar quoting a price the cart does not charge is the
// collection-page fault from 2026-10-18, on the page that argues for trusting us.
//
// IT IS NOT A SECOND /sync-licensing. That page converts a quote: tell us about the
// project and we come back with terms. This one explains the subject and routes down to
// the products. Different jobs, mutual links — the rule radio/albums.js states best:
// "Two sites saying the same thing compete for the same searches; two sites with
// different jobs that link to each other do not." It is as true of two pages.
//
// A NOTE ON CHECKING A CLAIM, because this page nearly shipped UNDERSTATED.
//
// Writing the verification section, I grepped src/AppRoutes.js for a /verify route,
// found none, concluded the "public verification link" promised in Terms.js:276 was an
// overclaim, and softened the section to say independent lookup was not built. All of
// that was wrong. /verify/<LIC-id> is a NETLIFY FUNCTION, routed in public/_redirects
// line 24, so it appears in no React route table -- and it has been live in production
// since 2026-10-16. Confirmed by curling it and getting the function's own
// "No licence to check" page back rather than the SPA shell.
//
// The general lesson, which is the same one the sitemap and the radio links taught:
// AppRoutes.js is not the list of routes this site serves. _redirects and netlify.toml
// each add more, and a function route is invisible to a grep of the React tree. Check
// the live URL, not the router.
//
// The specific lesson is newer and worse: a check reading LOW looks exactly like a clean
// result, and that cuts both ways. Being wrong about our own capability in the
// PESSIMISTIC direction felt like caution, so it got no scrutiny -- it would have
// quietly dropped the single strongest thing this page has to say.
//
// NOT LEGAL ADVICE, and it says so where it matters. Three licences are published and no
// lawyer has reviewed them.

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import {
  COMMERCIAL_TRACK_PRICE,
  COMMERCIAL_RELEASE_TRACK_PRICE,
  calculateCollectionPrice,
  calculateCommercialPrice,
  commercialRateForPool,
  formatPrice,
  SONG_PRICE
} from '../utils/pricing';
import { generateBreadcrumbSchema, schemaScript } from '../utils/schemaMarkup';

// Worked from the real curve, not chosen for the page. 24 tracks is the most common
// collection size (fourteen of the twenty-three), and the per-track figure is what makes
// the volume argument concrete rather than asserted.
const EXAMPLE_TRACKS = 24;
const examplePrice = calculateCollectionPrice(EXAMPLE_TRACKS, 'production-music');
const exampleSingly = calculateCommercialPrice(1, commercialRateForPool('production-music')) * EXAMPLE_TRACKS;
const examplePerTrack = examplePrice / EXAMPLE_TRACKS;

function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4">{title}</h2>
      <div className="text-gray-300 leading-relaxed space-y-4">{children}</div>
    </section>
  );
}

export default function CommercialLicensing() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Commercial music licensing', url: '/commercial-music-licensing' }
  ]);

  return (
    <>
      <Helmet>
        <title>Commercial Music Licensing: What You Are Buying | BeatFlow Media</title>
        <meta
          name="description"
          content="What a commercial music licence actually covers, what it costs and why, whether your video will get claimed, and how to check a licence is real."
        />
        <link rel="canonical" href="https://beatflowmediagroup.com/commercial-music-licensing" />
      </Helmet>

      {schemaScript(breadcrumb)}

      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <main className="flex-1 px-6 pt-16 pb-12">
          <div className="max-w-3xl mx-auto">

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Commercial music licensing: what you are actually buying
            </h1>
            <p className="text-lg text-gray-400 mb-10 leading-relaxed">
              Most libraries tell you a track is &ldquo;royalty-free&rdquo; and leave you to
              work out what that means when a platform claims your video. This page sets out
              what a licence from us covers, what it costs and why, what it deliberately does
              not cover, and how to check that any licence — ours or anyone&rsquo;s — is
              worth what you paid.
            </p>

            <Section id="two-rights" title="A recording has two rights, and you need both">
              <p>
                Every piece of recorded music carries two separate copyrights: the{' '}
                <strong className="text-white">recording</strong> (the specific performance
                captured) and the <strong className="text-white">composition</strong> (the
                underlying song — melody, chords, lyrics). They are frequently owned by
                different people.
              </p>
              <p>
                This is the single most common reason a licence fails when it is tested. A
                buyer clears the recording from a library, publishes, and is contacted by a
                publisher who controls the composition and was never asked. The licence was
                real; it only covered half of what was needed.
              </p>
              <p>
                <strong className="text-white">BFMG controls both</strong> for everything in
                its catalogue, so one licence covers both and there is no publisher to clear
                separately. That is what &ldquo;one-stop&rdquo; means, and it is worth asking
                any library whether they can say it.
              </p>
            </Section>

            <Section id="what-you-can-buy" title="Three things you can buy, and what each does">
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left border-b border-gray-700">
                      <th className="py-3 pr-4 font-semibold text-white">Licence</th>
                      <th className="py-3 pr-4 font-semibold text-white">Price</th>
                      <th className="py-3 font-semibold text-white">What it covers</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-gray-800">
                      <td className="py-3 pr-4 align-top">Personal download</td>
                      <td className="py-3 pr-4 align-top whitespace-nowrap">{formatPrice(SONG_PRICE)}</td>
                      <td className="py-3 align-top">
                        Listening. It does <strong>not</strong> cover putting the track in a
                        video, playing it to an audience, or any commercial use.
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-3 pr-4 align-top">Commercial, single track</td>
                      <td className="py-3 pr-4 align-top whitespace-nowrap">
                        {formatPrice(COMMERCIAL_TRACK_PRICE)}
                        <span className="block text-gray-500">
                          {formatPrice(COMMERCIAL_RELEASE_TRACK_PRICE)} released songs
                        </span>
                      </td>
                      <td className="py-3 align-top">
                        Video, podcasts, apps, games, presentations and client work.
                        Permanent, worldwide, monetised content included.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 align-top">Commercial, whole collection</td>
                      <td className="py-3 pr-4 align-top whitespace-nowrap">
                        {formatPrice(calculateCollectionPrice(21, 'production-music'))}–
                        {formatPrice(calculateCollectionPrice(56, 'production-music'))}
                      </td>
                      <td className="py-3 align-top">
                        The same licence across every track in a curated set. One payment.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500">
                A production cue is background; a released single with a featured artist
                carries the scene. Pricing them identically would say they are the same
                product, which is why the released catalogue costs more.
              </p>
            </Section>

            <Section id="pricing" title="Why a collection costs less per track, and by how much">
              <p>
                A {EXAMPLE_TRACKS}-track collection is{' '}
                <strong className="text-white">{formatPrice(examplePrice)}</strong>. The same{' '}
                {EXAMPLE_TRACKS} tracks bought one at a time would be{' '}
                {formatPrice(exampleSingly)} — so the collection works out at{' '}
                <strong className="text-white">{formatPrice(examplePerTrack)} a track</strong>,{' '}
                {Math.round((1 - examplePrice / exampleSingly) * 100)}% less.
              </p>
              <p>
                The rate falls on a <strong className="text-white">curve</strong> rather than
                in bands, and that is worth explaining because it affects what you can plan
                against. Banded pricing produces a point where <em>buying more costs less</em>:
                a library charging {formatPrice(COMMERCIAL_TRACK_PRICE)} a track up to four,
                then a discounted rate from five, sells four tracks for{' '}
                {formatPrice(COMMERCIAL_TRACK_PRICE * 4)} and five for less than that. A price
                list that contradicts itself is a price list you cannot budget from.
              </p>
              <p>
                On a curve there is no such point:{' '}
                <strong className="text-white">adding a track never reduces the total.</strong>{' '}
                You can check that against any collection on the site.
              </p>
              <p className="text-sm text-gray-400 border-l-2 border-gray-700 pl-4">
                <strong className="text-gray-300">Being precise about it:</strong> prices round
                to a trailing 9, so two collections one track apart often cost the same, and
                across a single rounding step the per-track rate can tick up slightly. The
                rate falls steadily over any real range — {EXAMPLE_TRACKS} tracks at{' '}
                {formatPrice(examplePerTrack)} against {formatPrice(COMMERCIAL_TRACK_PRICE)}{' '}
                singly — but &ldquo;every extra track is cheaper than the last&rdquo; would be
                an overclaim, so we are not making it.
              </p>
            </Section>

            <Section id="claims" title="Will your video get claimed?">
              <p>
                This is the question that actually matters, and most libraries answer it
                with the word &ldquo;royalty-free&rdquo;, which does not address it at all.
              </p>
              <p>
                Content ID and Meta Rights Manager are automated matching systems. A
                rightsholder enrols a recording, and the platform flags uploads containing
                it. If your music library has enrolled its own catalogue — which many do,
                because it earns them a share of other people&rsquo;s ad revenue — then{' '}
                <strong className="text-white">your video can be claimed by the library
                you licensed it from.</strong> Your licence is valid. The claim still
                happens, because the system matching audio never saw it.
              </p>
              <p>
                <strong className="text-white">
                  Nothing in the BFMG catalogue is enrolled in Content ID or Meta Rights
                  Manager.
                </strong>{' '}
                Enrolment is opt-in and paid — through DistroKid&rsquo;s Social Media Pack,
                which has never been purchased for any release here. So we do not claim or
                mute our licensees&rsquo; videos, because we have no mechanism to.
              </p>
              <p className="text-sm text-gray-400 border-l-2 border-gray-700 pl-4">
                <strong className="text-gray-300">The honest limit:</strong> we say{' '}
                <em>we</em> do not claim, not that no claim can occur. An unrelated
                rightsholder&rsquo;s automated system can raise a false match against music
                that resembles their catalogue — a real risk with AI-assisted recordings and
                outside anyone&rsquo;s control. If it happens, your account gives you a
                dispute pack: your licence number, its public verification link, and a
                statement to submit. We cannot submit it for you — platforms accept disputes
                only from the account that uploaded the video.
              </p>
            </Section>

            <Section id="excluded" title="What a commercial licence does not cover">
              <p>Five things are excluded, and each is quoted per project rather than sold:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong className="text-white">Broadcast television and radio</strong>, and cinema release.</li>
                <li><strong className="text-white">Paid advertising campaigns</strong> — anything backed by media spend.</li>
                <li><strong className="text-white">Public performance</strong> — playing music to an audience or in a business. No download or sync licence covers this, from us or anyone; it needs performance rights, usually from a PRO.</li>
                <li><strong className="text-white">Reselling the music on its own</strong>, including uploading it to another library or sample service.</li>
                <li><strong className="text-white">AI and machine-learning training.</strong></li>
              </ul>
              <p>
                These are quoted rather than priced because a national advertisement and a
                student film are not the same number, and neither are one café and a gym
                chain.{' '}
                <Link to="/sync-licensing" className="text-green-500 hover:underline">
                  Tell us about the project
                </Link>{' '}
                and you get terms and a figure, usually within two business days.
              </p>
            </Section>

            <Section id="ai" title="AI provenance, stated rather than hidden">
              <p>
                Recordings in this catalogue are AI-assisted or AI-generated, and we tell you
                so in writing on every licence. The legal status of copyright in AI-generated
                material is genuinely unsettled and varies by jurisdiction.
              </p>
              <p>
                That is why your rights here are{' '}
                <strong className="text-white">contractual</strong>: the licence binds us
                regardless of who owns what, which is a stronger position than a copyright
                claim nobody has tested. If a broadcaster or platform asks how a recording
                was made, you have the answer in writing — which is not true of most
                catalogues, AI or otherwise.
              </p>
            </Section>

            <Section id="verify" title="How to prove a licence is real">
              <p>
                Most libraries give you a PDF receipt. A PDF proves very little on its own:
                it can be edited, and it cannot tell anyone whether the licence behind it is
                still in force — a licence ended by a payment reversal looks identical on
                paper to a live one.
              </p>
              <p>
                Every licence issued here has a number and a{' '}
                <strong className="text-white">public page at{' '}
                <code className="text-gray-200">/verify/&lt;licence number&gt;</code></strong>.
                Anyone you hand the certificate to — a client, a broadcaster, a platform
                reviewing a dispute — opens that address and sees our current record, with no
                account and without contacting us. It shows whether the licence is{' '}
                <strong className="text-white">valid or revoked</strong>, what was licensed,
                the ISRC, the date, the rights granted, and{' '}
                <strong className="text-white">which version of the terms was accepted</strong>,
                linked through to that exact text.
              </p>
              <p>
                It shows the holder <em>masked</em> — initials or a partial email — which is
                enough to match the person presenting the document without publishing their
                identity to anyone who guesses a licence number.
              </p>
              <p>
                The certificate also carries a verification code and a QR code. Scanning it
                opens the same page with the code attached, and the page states plainly
                whether it matches. That matters more than it sounds:{' '}
                <strong className="text-white">a forged certificate can print any code it
                likes.</strong> What it cannot do is make this domain agree with it. So the
                proof is the page, not the paper — which is why every certificate we issue
                says so in those words.
              </p>
              <p className="text-sm text-gray-400 border-l-2 border-gray-700 pl-4">
                <strong className="text-gray-300">Being precise about it:</strong> this is a
                code we issue and check, not a cryptographic signature your PDF reader
                validates — no green tick appears in Acrobat. Its whole strength is that a
                third party follows the link. A certificate nobody checks is just a document,
                the same as everyone else&rsquo;s.
              </p>
            </Section>

            {/* THE SILO, LINKED DOWN. A pillar that does not route anywhere is a dead end;
              * the hubs and spokes already link up here, and this closes the loop. Each
              * link goes somewhere that does a different job, not to a page repeating
              * this one. */}
            <section className="mb-12 border-t border-gray-800 pt-8">
              <h2 className="text-2xl font-bold mb-4">Where to go next</h2>
              <ul className="space-y-3">
                <li>
                  <Link to="/browse/library" className="text-green-500 hover:underline font-semibold">
                    Browse the production library
                  </Link>
                  <span className="text-gray-400"> — 23 collections, licensable whole or by the track.</span>
                </li>
                <li>
                  <Link to="/sync-licensing" className="text-green-500 hover:underline font-semibold">
                    Request a quote
                  </Link>
                  <span className="text-gray-400"> — for broadcast, cinema, paid advertising or public performance.</span>
                </li>
                <li>
                  <Link to="/terms" className="text-green-500 hover:underline font-semibold">
                    Read the licence terms
                  </Link>
                  <span className="text-gray-400"> — the text that actually binds, in full.</span>
                </li>
                <li>
                  <Link to="/changes" className="text-green-500 hover:underline font-semibold">
                    See what has changed
                  </Link>
                  <span className="text-gray-400"> — every superseded licence version stays readable, because the one you accepted is the one that governs you.</span>
                </li>
              </ul>
            </section>

            <p className="text-xs text-gray-600 border-t border-gray-800 pt-6">
              This page explains how our licences work. It is not legal advice, and it is not
              a substitute for the{' '}
              <Link to="/terms" className="text-gray-500 hover:underline">licence terms</Link>,
              which are what bind. If your use is unusual or the stakes are high, have a
              lawyer in your jurisdiction read them.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
