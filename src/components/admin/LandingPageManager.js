// src/components/admin/LandingPageManager.js
//
// Landing pages: what exists, what is published, and what each one is.
//
// WHAT THIS REPLACED, 2026-10-21
//
// A `mockPages` array under the comment "Simulated data - in production, fetch from
// Firestore marketing_content collection". Three invented pages, and two numbers that
// were typed into the source:
//
//     views: 1247,
//     conversions: 89,
//
// Rendered as "1,247 Total Views" and "89 Conversions" on a platform with six users and
// four purchases. That is worse than the bulk generator that faked doing work: a
// fabricated filename wastes ten minutes when you go looking for it, a fabricated
// conversion rate is a number somebody plans around.
//
// The three mock pages were for Artists, Listeners and Curators -- two of the segments
// the product does not serve. Curators were removed from the platform entirely.
//
// NOW IT READS `landingPages`, WHICH IS WHAT THE SITE SERVES. The mock comment named
// `marketing_content`, a collection that appears nowhere else in the codebase.
// MarketingLanding.js -- the page a visitor gets at /marketing/landing/<slug> -- reads
// `landingPages`. Managing a different collection from the one the site renders is a
// second source of truth whose drift nobody would notice, because both halves look fine
// on their own.
//
// THE METRICS ARE GONE RATHER THAN ZEROED, which is the judgement worth keeping.
// Nothing tracks a landing page view: MarketingLanding.js records no event of any kind.
// Showing 0 would claim a measurement that was never taken -- "nobody came" instead of
// "never counted" -- and those are different facts that a dashboard must not blur. The
// panel says what is missing and what it would take to have it.

import { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert
} from '@mui/material';
import {
  Edit, Visibility, Delete, Publish, CheckCircle, PendingActions, Web
} from '@mui/icons-material';
import { useModal } from '../../hooks/useModal';
import {
  loadLandingPages, saveLandingPage, deleteLandingPage
} from '../../services/landingPageStore';

const TAP = 44;

export default function LandingPageManager() {
  const { showConfirm, showAlert } = useModal();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPages(await loadLandingPages());
    } catch (err) {
      console.error('LandingPageManager: load failed —', err);
      setError(err.message || 'Could not load landing pages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const published = pages.filter((p) => p.status === 'published');
  const drafts = pages.filter((p) => p.status !== 'published');

  const openEditor = (page) => {
    setEditing(page || { slug: '', status: 'draft' });
    setDraft({
      slug: page?.slug || '',
      title: page?.hero?.title || '',
      subtitle: page?.hero?.subtitle || '',
      description: page?.meta?.description || '',
      status: page?.status || 'draft'
    });
  };

  const save = async () => {
    setBusy(true);
    try {
      // Written in the shape MarketingLanding.js renders. Anything outside `hero`,
      // `sections`, `cta` and `redirect` is stored and never shown, which is the
      // quietest way to lose work.
      await saveLandingPage(draft.slug, {
        hero: { title: draft.title, subtitle: draft.subtitle },
        meta: { description: draft.description },
        status: draft.status
      });
      setEditing(null);
      await load();
    } catch (err) {
      await showAlert('Could not save', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (page) => {
    const ok = await showConfirm(
      `Delete /marketing/landing/${page.slug}?`,
      page.status === 'published'
        ? 'This page is PUBLISHED. Deleting it makes the URL 404. If it was ever indexed, it should be redirected rather than removed — see the SEO notes in CLAUDE.md.'
        : 'This is a draft and is not served to anyone.',
      'warning'
    );
    if (!ok) return;
    await deleteLandingPage(page.slug);
    await load();
  };

  const togglePublish = async (page) => {
    await saveLandingPage(page.slug, {
      status: page.status === 'published' ? 'draft' : 'published'
    });
    await load();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Landing Page Manager</Typography>
        <Chip
          label={`${published.length} published / ${drafts.length} draft`}
          color={published.length ? 'success' : 'default'}
        />
      </Box>

      {/* WHAT IS NOT MEASURED, SAID OUT LOUD.
        *
        * This replaced four stat cards, two of which showed invented numbers. A
        * dashboard that says "I do not know" is more useful than one that guesses,
        * because the guess gets quoted and the admission gets fixed. */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Views and conversions are not tracked.</strong> Nothing records a visit
        to <code>/marketing/landing/&lt;slug&gt;</code> — the public page fires no
        analytics event, so there is no number to show. The figures that used to appear
        here (1,247 views, 89 conversions) were hardcoded. Tracking would mean the public
        page writing a view event and the checkout attributing a purchase back to it.
      </Alert>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Button
        variant="contained"
        startIcon={<Web />}
        onClick={() => openEditor(null)}
        sx={{ minHeight: TAP, mb: 3, textTransform: 'none', fontWeight: 700 }}
      >
        New landing page
      </Button>

      {loading ? <Typography sx={{ color: 'text.secondary' }}>Loading…</Typography> : null}

      {!loading && !pages.length ? (
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>No landing pages yet.</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
              The <code>landingPages</code> collection is empty. Before writing one, read
              the SEO section of CLAUDE.md: a page earns its index slot by belonging to a
              silo — linking into a pillar, with the pillar linking back out — not by
              existing. Thirty near-identical segment pages are doorway pages, which is
              what the bulk generator removed on 2026-10-20 would have produced.
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {pages.map((page) => (
        <Card key={page.slug} sx={{ bgcolor: 'background.paper', mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {page.status === 'published'
                ? <CheckCircle sx={{ color: 'success.main' }} />
                : <PendingActions sx={{ color: 'warning.main' }} />}
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {page.hero?.title || page.slug}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {page.hero?.subtitle || page.meta?.description || 'No description.'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
                  /marketing/landing/{page.slug}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  aria-label={`Open ${page.slug}`}
                  href={`/marketing/landing/${page.slug}`}
                  target="_blank"
                  rel="noopener"
                  sx={{ width: TAP, height: TAP }}
                >
                  <Visibility />
                </IconButton>
                <IconButton aria-label={`Edit ${page.slug}`} onClick={() => openEditor(page)} sx={{ width: TAP, height: TAP }}>
                  <Edit />
                </IconButton>
                <IconButton
                  aria-label={page.status === 'published' ? `Unpublish ${page.slug}` : `Publish ${page.slug}`}
                  onClick={() => togglePublish(page)}
                  sx={{ width: TAP, height: TAP, color: page.status === 'published' ? 'success.main' : 'inherit' }}
                >
                  <Publish />
                </IconButton>
                <IconButton aria-label={`Delete ${page.slug}`} onClick={() => remove(page)} sx={{ width: TAP, height: TAP, color: 'error.main' }}>
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing?.slug ? `Edit ${editing.slug}` : 'New landing page'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth margin="normal" label="Slug (becomes the URL)"
            value={draft.slug || ''}
            disabled={!!editing?.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            helperText="/marketing/landing/<slug>. Cannot be changed later — a URL that moves loses whatever it had."
          />
          <TextField
            fullWidth margin="normal" label="Hero title"
            value={draft.title || ''}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <TextField
            fullWidth margin="normal" label="Hero subtitle"
            value={draft.subtitle || ''}
            onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
          />
          <TextField
            fullWidth margin="normal" multiline rows={3} label="Meta description"
            value={draft.description || ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            helperText="150–160 characters is what a search result shows."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} sx={{ minHeight: TAP }}>Cancel</Button>
          <Button onClick={save} variant="contained" disabled={busy || !draft.slug} sx={{ minHeight: TAP }}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
