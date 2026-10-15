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
