import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function Nda() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">
            Non-Disclosure Agreement (NDA)
          </h1>

          <p className="text-gray-400 mb-6">
            By checking “I Agree,” you (“Recipient”) agree to the following
            terms with BeatFlow Media (“Disclosing Party”):
          </p>
          <hr className="border-gray-700 mb-6" />
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">1. Definitions</h2>
            <ul className="list-disc list-inside text-gray-400">
              <li>
                <strong>Confidential Information</strong> – All non-public
                business, financial, technical or marketing information
                disclosed by BeatFlow Media, including without limitation pitch
                decks, financial models, cap tables, user metrics, roadmaps,
                projections, and related discussions.
              </li>
            </ul>
          </section>
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">
              2. Recipient Obligations
            </h2>
            <ul className="list-disc list-inside text-gray-400">
              <li>
                <strong>Use Restriction</strong> – Recipient will use
                Confidential Information solely to evaluate a potential
                investment in BeatFlow Media.
              </li>
              <li>
                <strong>Non-Disclosure</strong> – Recipient will not disclose or
                disseminate any Confidential Information to third parties
                without prior written consent.
              </li>
              <li>
                <strong>Standard of Care</strong> – Recipient will protect
                Confidential Information with at least the same degree of care
                it uses to protect its own confidential data, but in no event
                less than reasonable care.
              </li>
            </ul>
          </section>
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">3. Exclusions</h2>
            <p className="text-gray-400">
              Confidential Information does <strong>not</strong> include
              information that Recipient can prove:
            </p>
            <ul className="list-decimal list-inside text-gray-400">
              <li>
                Is or becomes publicly known through no breach of this NDA;
              </li>
              <li>
                Was lawfully in Recipient’s possession prior to disclosure;
              </li>
              <li>
                Is lawfully received from a third party without confidentiality
                obligations;
              </li>
              <li>
                Is independently developed by Recipient without reference to
                Disclosing Party’s Confidential Information.
              </li>
            </ul>
          </section>
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">4. Term</h2>
            <p className="text-gray-400">
              This NDA takes effect when Recipient clicks “I Agree” and remains
              in force for <strong>three (3) years</strong>, unless terminated
              earlier by written notice.
            </p>
          </section>
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">
              5. Return or Destruction
            </h2>
            <p className="text-gray-400">
              Upon written request, Recipient will promptly return or destroy
              all materials containing Confidential Information and certify
              completion in writing.
            </p>
          </section>
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">6. No License</h2>
            <p className="text-gray-400">
              Nothing in this NDA grants Recipient any rights or licenses to
              Confidential Information except as expressly set forth herein.
            </p>
          </section>
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">7. Remedies</h2>
            <p className="text-gray-400">
              Recipient acknowledges that unauthorized disclosure may cause
              irreparable harm. Disclosing Party may seek injunctive relief in
              addition to any other available remedies.
            </p>
          </section>
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">8. Governing Law</h2>
            <p className="text-gray-400">
              This NDA is governed by and construed in accordance with the laws
              of the State of New Jersey, without regard to its conflict-of-laws
              principles.
            </p>
          </section>
          <hr className="border-gray-700 my-6" />
          <p className="text-gray-400 mb-6">
            By clicking <strong>"I Agree"</strong>, you certify that you have
            read, understood, and agree to be bound by these terms.
          </p>

          <div className="text-center mb-8">
            <Link
              to="/investors"
              className="inline-block bg-bf-green text-black font-semibold px-8 py-3 rounded-full hover:bg-green-600 transition"
            >
              I Agree
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
