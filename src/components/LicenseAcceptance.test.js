/**
 * @jest-environment jsdom
 */
// src/components/LicenseAcceptance.test.js
//
// The clickwrap is the only artefact in this product that has to survive being read back
// to us by somebody else. Everything else can be fixed in the next deploy; what a buyer
// agreed to on a given day cannot be re-agreed retroactively.
//
// So this asserts the things that make it clickwrap rather than decoration, and in
// particular the two statutory elements added on 2026-10-15. Those were previously
// absent, and their absence is what let a UK or EU buyer download a master, cancel inside
// 14 days under CCR 2013 reg.37, and bear no cost -- keeping the file, legally.
//
// Rendered rather than string-matched on purpose. A grep proves the words exist in a
// file; this proves they reach the DOM a buyer actually sees, through the component tree,
// with the checkbox wired to them.

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LicenseAcceptance from './LicenseAcceptance';

function renderIt(props = {}) {
  const onChange = jest.fn();
  const utils = render(
    <MemoryRouter>
      <LicenseAcceptance
        id="test-accept"
        accepted={false}
        onChange={onChange}
        {...props}
      />
    </MemoryRouter>
  );
  return { onChange, ...utils };
}

describe('LicenseAcceptance — the affirmative act', () => {
  test('is UNCHECKED by default: the buyer performs the act, not the page', () => {
    renderIt();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  test('states assent to the terms, with the surprising restrictions named inline', () => {
    renderIt();
    // Named in the label itself rather than only behind the link, so a buyer cannot
    // later say the limits were buried.
    expect(
      screen.getByText(/public performance, DJ use, remixes or redistribution/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/I have read and agree to the/i)).toBeInTheDocument();
  });

  // --- the two statutory elements ---------------------------------------------------
  //
  // UK CCR 2013 reg.37 / EU CRD art.16(m) exclude the 14-day cancellation right for a
  // download ONLY where the buyer does BOTH. Either one missing and reg.37(4) says the
  // consumer bears no cost for content supplied in the window.

  test('captures express consent to IMMEDIATE supply', () => {
    renderIt();
    expect(
      screen.getByText(/made available immediately/i)
    ).toBeInTheDocument();
  });

  test('captures acknowledgement that this LOSES the right to cancel', () => {
    renderIt();
    expect(
      screen.getByText(/lose my right to cancel/i)
    ).toBeInTheDocument();
  });

  test('both statutory elements are in ONE statement the checkbox governs', () => {
    const { container } = renderIt();
    const label = container.querySelector('label[for="test-accept"]');
    expect(label).toBeTruthy();
    const text = label.textContent;
    // Ticking the box must assent to both, not to one with the other floating nearby.
    expect(text).toMatch(/made available immediately/i);
    expect(text).toMatch(/lose my right to cancel/i);
  });

  // --- it has to actually work ------------------------------------------------------

  test('ticking it reports true to the host', async () => {
    const user = userEvent.setup();
    const { onChange } = renderIt();
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('tapping the LABEL toggles the box — the whole row is the target', async () => {
    const user = userEvent.setup();
    const { onChange, container } = renderIt();
    const label = container.querySelector('label[for="test-accept"]');
    await user.click(label);
    expect(onChange).toHaveBeenCalled();
  });

  test('the checkbox is associated with the label by id', () => {
    const { container } = renderIt();
    const box = screen.getByRole('checkbox');
    const label = container.querySelector('label[for="test-accept"]');
    expect(label).toBeTruthy();
    // The input MUI renders must carry the id the label points at, or a screen reader
    // announces an unlabelled checkbox on the one control that records consent.
    expect(box.getAttribute('id')).toBe('test-accept');
  });

  test('opening the terms link does not flip the checkbox', async () => {
    const user = userEvent.setup();
    const { onChange } = renderIt();
    const link = screen.getByRole('link', { name: /Download License Terms/i });
    await user.click(link);
    // The label wraps the link, so without stopPropagation a tap on "Terms" would both
    // navigate AND silently record consent. That is the one interaction that must never
    // happen by accident.
    expect(onChange).not.toHaveBeenCalled();
  });
});

// --- the commercial variant ----------------------------------------------------------
//
// ONE control now serves two products, and the failure mode of that is a buyer shown the
// wrong document. These assertions pin the two halves that must differ and the two that
// must not.
//
// Why it matters more here than it looks: the download licence's longest clause is the
// eight things it FORBIDS, and sync is one of them. The commercial licence PERMITS sync.
// Render the wrong one and the buyer either assents to a prohibition on the thing they
// paid for, or is told they have a right the record does not give them.

describe('LicenseAcceptance — the commercial variant', () => {
  const COMMERCIAL = { scope: 'commercial', term: 'perpetual', grant: 'sync' };

  test('a commercial purchase shows the COMMERCIAL terms, not the download terms', () => {
    renderIt({ product: COMMERCIAL, trackCount: 24 });
    // The commercial summary's own heading copy, which the download summary does not have.
    expect(screen.getByText(/We will not claim or mute your video/i)).toBeInTheDocument();
    // And not the download summary's call-out.
    expect(screen.queryByText(/Putting it in a video, DJing/i)).not.toBeInTheDocument();
  });

  test('it names the number of recordings the licence covers', () => {
    // "Commercial licence" reads as catalogue-wide. It is not: it covers what is on the
    // licence, and saying the count out loud is the cheapest way to prevent that reading.
    renderIt({ product: COMMERCIAL, trackCount: 24 });
    expect(screen.getByText(/the 24 recordings in this purchase/i)).toBeInTheDocument();
  });

  test('the checkbox label links to the COMMERCIAL terms by name', () => {
    renderIt({ product: COMMERCIAL });
    expect(screen.getByRole('link', { name: /Commercial License Terms/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Download License Terms$/i })).not.toBeInTheDocument();
  });

  test('the named restrictions are the COMMERCIAL ones', () => {
    // A commercial buyer who skims will assume broadcast and cinema are included,
    // because "commercial use" sounds like it covers them. Those are the four worth
    // naming inline rather than leaving behind the link.
    const { container } = renderIt({ product: COMMERCIAL, id: 'test-accept' });
    const text = container.querySelector('label[for="test-accept"]').textContent;
    expect(text).toMatch(/broadcast television or radio/i);
    expect(text).toMatch(/cinema/i);
    expect(text).toMatch(/paid advertising campaigns/i);
    // And NOT the download licence's inline list, which would be false here: a
    // commercial licence does cover remixes-in-context and is not about DJ use.
    expect(text).not.toMatch(/public performance, DJ use/i);
  });

  test('BOTH statutory elements survive the commercial wording', () => {
    // The whole reason the checkbox is shared rather than duplicated. A one-off
    // commercial licence is digital content supplied without a physical medium exactly
    // as a download is, so reg.37 / art.16(m) reach it identically and both elements
    // still have to be captured. A second copy of this control is how one of them goes
    // missing from one product and nobody notices.
    const { container } = renderIt({ product: COMMERCIAL, id: 'test-accept' });
    const text = container.querySelector('label[for="test-accept"]').textContent;
    expect(text).toMatch(/made\s+available immediately/i);
    expect(text).toMatch(/lose my right to cancel/i);
  });

  test('it is still unchecked by default, and still the buyer who acts', () => {
    renderIt({ product: COMMERCIAL });
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  test('an omitted product falls back to the DOWNLOAD terms, the narrower grant', () => {
    // Five existing call sites pass no product. If the default were ever the commercial
    // licence, every $1.99 download would collect assent to a sync grant it does not
    // give -- and the buyer would have the document saying otherwise.
    renderIt();
    expect(screen.getByRole('link', { name: /Download License Terms/i })).toBeInTheDocument();
    expect(screen.queryByText(/We will not claim or mute your video/i)).not.toBeInTheDocument();
  });
});
