// src/data/pricingPlans.js
// Centralized pricing plan configuration for /explore-premium
// This file is the single source of truth for all pricing data

/**
 * Plan feature definitions
 * Used to build comparison tables and ensure consistency
 */
export const PLAN_FEATURES = {
  // Core Features
  'unlimited-downloads': {
    id: 'unlimited-downloads',
    name: 'Unlimited downloads',
    description: 'Download as many tracks as you need',
    category: 'core',
    tiers: ['student', 'creator', 'pro', 'agency']
  },
  'commercial-use': {
    id: 'commercial-use',
    name: 'Commercial use (monetized content)',
    description: 'Use music in content that generates revenue',
    category: 'core',
    tiers: ['student', 'creator', 'pro', 'agency']
  },
  'youtube-tiktok-instagram': {
    id: 'youtube-tiktok-instagram',
    name: 'YouTube, TikTok, Instagram',
    description: 'License for all major social platforms',
    category: 'core',
    tiers: ['student', 'creator', 'pro', 'agency']
  },
  'podcast-licensing': {
    id: 'podcast-licensing',
    name: 'Podcast licensing',
    description: 'Use in podcasts and audio content',
    category: 'core',
    tiers: ['student', 'creator', 'pro', 'agency']
  },

  // Pro Features
  'film-tv-distribution': {
    id: 'film-tv-distribution',
    name: 'Film & TV distribution',
    description: 'Broadcast and film distribution rights',
    category: 'professional',
    tiers: ['pro', 'agency']
  },
  'client-work': {
    id: 'client-work',
    name: 'Client work & agency projects',
    description: 'License music for client deliverables',
    category: 'professional',
    tiers: ['pro', 'agency']
  },
  'broadcast-rights': {
    id: 'broadcast-rights',
    name: 'Broadcast rights',
    description: 'TV, radio, and streaming broadcast',
    category: 'professional',
    tiers: ['pro', 'agency']
  },

  // Enterprise Features
  'white-label': {
    id: 'white-label',
    name: 'White-label options',
    description: 'Rebrand for your clients',
    category: 'enterprise',
    tiers: ['agency']
  }
};

/**
 * Pricing plans configuration
 * Prices are stored in cents to avoid floating point issues
 */
export const PRICING_PLANS = {
  student: {
    id: 'student',
    title: 'Student',
    slug: 'student',
    price: 999, // $9.99 in cents
    currency: 'USD',
    interval: 'month',

    // Stripe Integration
    stripePriceId: process.env.REACT_APP_STRIPE_STUDENT_PRICE_ID,

    // Display
    tag: '🎓 Student Deal',
    tagColor: 'gray',
    popular: false,

    // Marketing
    targetAudience: 'Film students, content creation courses, portfolio building',
    description: 'Educational discount with commercial licensing',

    // License Type
    licenseType: 'time-bound', // Licenses valid during active subscription + published content

    // Subscriber Discount
    perTrackDiscount: 0.20, // 20% off perpetual licenses

    // Features (ordered for display)
    features: [
      { id: 'edu-discount', label: 'Educational discount', included: true },
      { id: 'commercial', label: 'Commercial licensing for published work', included: true },
      { id: 'unlimited-downloads', label: 'Unlimited downloads while active', included: true },
      { id: 'social-safe', label: 'YouTube, TikTok, Instagram safe', included: true },
      { id: 'published-perpetual', label: 'Published content stays licensed forever', included: true },
      { id: 'cancel-anytime', label: 'Cancel anytime', included: true }
    ],

    // Access control
    requirements: ['edu_email_verification'],

    // CTA
    ctaLabel: 'Get Started',
    ctaNote: '.edu email verification required. Content published while subscribed stays licensed.',

    // Metadata
    active: true,
    sortOrder: 1
  },

  creator: {
    id: 'creator',
    title: 'Creator',
    slug: 'creator',
    price: 2400, // $24.00 in cents (updated from $19.99)
    currency: 'USD',
    interval: 'month',

    // Stripe Integration
    stripePriceId: process.env.REACT_APP_STRIPE_CREATOR_PRICE_ID,

    // Display
    tag: '🎬 Most Popular',
    tagColor: 'green',
    popular: true,

    // Marketing
    targetAudience: 'YouTubers, TikTokers, Instagram creators, podcasters',
    description: 'For active content creators publishing regularly',

    // License Type
    licenseType: 'time-bound', // Licenses valid during active subscription + published content

    // Subscriber Discount
    perTrackDiscount: 0.30, // 30% off perpetual licenses

    // Features
    features: [
      { id: 'unlimited-downloads', label: 'Unlimited downloads while active', included: true },
      { id: 'commercial-use', label: 'Commercial use for published content', included: true },
      { id: 'no-copyright', label: 'No copyright strikes, ever', included: true },
      { id: 'platforms', label: 'YouTube, TikTok, Instagram, podcasts', included: true },
      { id: 'published-perpetual', label: 'Published work stays licensed forever', included: true },
      { id: 'cancel-anytime', label: 'Cancel anytime', included: true }
    ],

    // Access control
    requirements: [],

    // CTA
    ctaLabel: 'Subscribe Now',
    ctaNote: 'Content you publish while subscribed stays licensed forever.',

    // Metadata
    active: true,
    sortOrder: 2
  },

  pro: {
    id: 'pro',
    title: 'Pro',
    slug: 'pro',
    price: 4900, // $49.00 in cents (updated from $39.99)
    currency: 'USD',
    interval: 'month',

    // Stripe Integration
    stripePriceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID,

    // Display
    tag: '🎥 Professional',
    tagColor: 'gray',
    popular: false,

    // Marketing
    targetAudience: 'Filmmakers, TV producers, video production companies',
    description: 'For professional productions, broadcast, and client work',

    // License Type
    licenseType: 'time-bound', // Licenses valid during active subscription + published content

    // Subscriber Discount
    perTrackDiscount: 0.40, // 40% off perpetual licenses

    // Features
    features: [
      { id: 'everything-creator', label: 'Everything in Creator', included: true },
      { id: 'broadcast-film', label: 'Broadcast & film distribution rights', included: true },
      { id: 'client-work', label: 'Client work & agency projects', included: true },
      { id: 'tv-web-indie', label: 'TV, web series, indie films', included: true },
      { id: 'published-perpetual', label: 'Published work stays licensed forever', included: true },
      { id: 'priority-support', label: 'Priority support', included: true }
    ],

    // Access control
    requirements: [],

    // CTA
    ctaLabel: 'Subscribe Now',
    ctaNote: 'Completed projects retain licenses. Perfect for filmmakers.',

    // Metadata
    active: true,
    sortOrder: 3
  },

  agency: {
    id: 'agency',
    title: 'Agency',
    slug: 'agency',
    price: 14900, // $149 in cents (updated from $99)
    currency: 'USD',
    interval: 'month',

    // Stripe Integration
    stripePriceId: process.env.REACT_APP_STRIPE_AGENCY_PRICE_ID,

    // Display
    tag: '💼 Business',
    tagColor: 'gray',
    popular: false,

    // Marketing
    targetAudience: 'Marketing agencies, corporate teams, production studios',
    description: 'For teams managing multiple client projects',

    // License Type
    licenseType: 'time-bound', // Licenses valid during active subscription + published content

    // Subscriber Discount
    perTrackDiscount: 0.50, // 50% off perpetual licenses

    // Features
    features: [
      { id: 'everything-pro', label: 'Everything in Pro', included: true },
      { id: 'team-members', label: 'Up to 3 team seats included', included: true },
      { id: 'client-licensing', label: 'Unlimited client projects', included: true },
      { id: 'published-perpetual', label: 'Client deliverables stay licensed forever', included: true },
      { id: 'team-management', label: 'Team license management dashboard', included: true },
      { id: 'account-manager', label: 'Priority support', included: true }
    ],

    // Access control
    requirements: [],

    // CTA
    ctaLabel: 'Subscribe Now',
    ctaType: 'subscription',
    ctaNote: 'Perfect for agencies. Client work stays licensed after completion.',

    // Metadata
    active: true,
    sortOrder: 4
  }
};

/**
 * Comparison table configuration
 * Defines what features to show in the comparison table
 */
export const COMPARISON_FEATURES = [
  {
    feature: 'Unlimited downloads',
    featureId: 'unlimited-downloads',
    student: true,
    creator: true,
    pro: true,
    agency: true
  },
  {
    feature: 'YouTube, TikTok, Instagram',
    featureId: 'youtube-tiktok-instagram',
    student: true,
    creator: true,
    pro: true,
    agency: true
  },
  {
    feature: 'Commercial use (monetized content)',
    featureId: 'commercial-use',
    student: true,
    creator: true,
    pro: true,
    agency: true
  },
  {
    feature: 'Podcast licensing',
    featureId: 'podcast-licensing',
    student: true,
    creator: true,
    pro: true,
    agency: true
  },
  {
    feature: 'Film & TV distribution',
    featureId: 'film-tv-distribution',
    student: false,
    creator: false,
    pro: true,
    agency: true
  },
  {
    feature: 'Client work & agency projects',
    featureId: 'client-work',
    student: false,
    creator: false,
    pro: true,
    agency: true
  },
  {
    feature: 'Broadcast rights',
    featureId: 'broadcast-rights',
    student: false,
    creator: false,
    pro: true,
    agency: true
  },
  {
    feature: 'White-label options',
    featureId: 'white-label',
    student: false,
    creator: false,
    pro: false,
    agency: true
  },
  {
    feature: 'Team members',
    featureId: 'team-members',
    student: '1',
    creator: '1',
    pro: '1',
    agency: '5+'
  },
  {
    feature: 'Support level',
    featureId: 'support-level',
    student: 'Email',
    creator: 'Email',
    pro: 'Priority',
    agency: 'Dedicated'
  }
];

/**
 * Get all active plans in display order
 */
export const getActivePlans = () => {
  return Object.values(PRICING_PLANS)
    .filter(plan => plan.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

/**
 * Get plan by ID
 */
export const getPlanById = (planId) => {
  return PRICING_PLANS[planId] || null;
};

/**
 * Get plan by Stripe price ID
 */
export const getPlanByStripePriceId = (stripePriceId) => {
  return Object.values(PRICING_PLANS).find(
    plan => plan.stripePriceId === stripePriceId
  ) || null;
};

/**
 * Check if a plan has a specific feature
 */
export const planHasFeature = (planId, featureId) => {
  const plan = PRICING_PLANS[planId];
  if (!plan) return false;

  const feature = PLAN_FEATURES[featureId];
  if (!feature) return false;

  return feature.tiers.includes(planId);
};

/**
 * Format price from cents to display string
 */
export const formatPrice = (priceInCents, currency = 'USD') => {
  const amount = priceInCents / 100;

  if (currency === 'USD') {
    return `$${amount.toFixed(2).replace('.00', '')}`;
  }

  // Add more currency formatting as needed
  return `${amount.toFixed(2)} ${currency}`;
};

/**
 * Get promotional pricing (stub for future implementation)
 */
export const getPromotionalPricing = (planId) => {
  // TODO: Implement promotional pricing from Firestore
  // This would check for active promotions and return sale price if applicable
  return null;
};
