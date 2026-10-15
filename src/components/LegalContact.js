// src/components/LegalContact.js
//
// THE contact block for every legal page. Single source.
//
// WHY THIS EXISTS
// This block was copy-pasted into five pages -- Terms, PrivacyPolicy,
// NoticeAtCollection, Legal and UserGuidelines -- and the copies had already drifted
// in the two ways copies always do:
//
//   1. The entity name disagreed. Four pages said "BeatFlow Media Group", and
//      NoticeAtCollection said "BeatFlow Media Inc.". On a privacy notice, the name of
//      the entity that holds your data is not decoration; two names across two legal
//      documents is a question a regulator asks.
//   2. The street address was misspelled "Cubhouse" on all five pages, against
//      "Clubhouse" in the email templates. Five copies of an address, none of them
//      correct, is a worked example of why five copies is the problem.
//
// NO POSTAL ADDRESS, DELIBERATELY
// BeatFlow Media Group has no brick-and-mortar location to publish, and the address
// that was here was a private residence. A home address on five public legal pages is
// not a contact detail, it is an unnecessary disclosure that cannot be taken back once
// it has been crawled. Contact runs through the platform's own form instead, which is
// also the only channel that produces a tracked record of the request. When there is a
// real business address, it goes HERE, once, and every page gets it.
//
// This component does NOT cover the email footers in functions/index.js. Those are a
// separate decision: US commercial email has a postal-address requirement that a
// website page does not, so stripping it there is a legal question, not a cleanup.

import React from 'react';
import { Link } from 'react-router-dom';

/** The canonical entity name. One spelling, one place. */
export const LEGAL_ENTITY = 'BeatFlow Media Group';

/** The addresses that exist. Named rather than typed as literals at each call site, so
 *  a page cannot invent a mailbox nobody reads. */
export const LEGAL_EMAILS = {
  legal: 'legal@beatflowmediagroup.com',
  privacy: 'privacy@beatflowmediagroup.com',
  support: 'support@beatflowmediagroup.com',
  accessibility: 'accessibility@beatflowmediagroup.com',
  security: 'security@beatflowmediagroup.com'
};

/**
 * @param {object} props
 * @param {string} props.department - e.g. "Legal Department", "Privacy Department"
 * @param {keyof LEGAL_EMAILS} props.mailbox - which address to show
 * @param {string} [props.intro] - the sentence above the block
 * @param {boolean} [props.boxed] - render on a panel, matching the page it sits in
 */
export default function LegalContact({ department, mailbox, intro, boxed = true }) {
  const email = LEGAL_EMAILS[mailbox] || LEGAL_EMAILS.support;

  return (
    <div className="text-gray-300 space-y-4">
      {intro && <p>{intro}</p>}

      <div className={boxed ? 'bg-gray-800 rounded-lg p-6 space-y-2' : 'space-y-2'}>
        <p><strong className="text-white">{LEGAL_ENTITY}</strong></p>
        {department && <p>{department}</p>}

        {/* The form first, because it is the channel that produces a tracked record.
          * min-h-11 is 44px -- the block below is read on a phone more often than not,
          * and an underlined phrase in a sentence is not a tap target. */}
        <p className="pt-4">
          <Link
            to="/contact"
            className="inline-flex items-center min-h-11 text-green-500 hover:underline focus:underline"
          >
            Contact us through the platform
          </Link>
        </p>

        <p>
          Or email:{' '}
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center min-h-11 text-green-500 hover:underline focus:underline"
          >
            {email}
          </a>
        </p>
      </div>
    </div>
  );
}
