/**
 * Email Configuration
 *
 * Centralized email configuration for BeatFlow Media platform
 * Following DRY and separation of concerns principles
 *
 * Email Architecture:
 * - SMTP Sending: beatflowmediagroup@gmail.com (infrastructure)
 * - Customer Support: office.beatflowmediagroup@gmail.com (customer-facing)
 * - Contact Display: office@beatflowmediagroup.com (professional domain)
 */

module.exports = {
  // SMTP Configuration (for sending emails)
  smtp: {
    user: process.env.SMTP_USER || 'beatflowmediagroup@gmail.com',
    pass: process.env.SMTP_PASSWORD, // REQUIRED: Set SMTP_PASSWORD in Netlify environment variables
    service: 'gmail'
  },

  // Email Addresses
  addresses: {
    // "From" address for automated emails
    from: 'BeatFlow Media <noreply@beatflowmediagroup.com>',

    // "Reply-To" address - where customer replies should go
    replyTo: 'office.beatflowmediagroup@gmail.com',

    // Contact email displayed in emails and on website
    contact: 'office.beatflowmediagroup@gmail.com'
  },

  // Email Templates Configuration
  templates: {
    footer: {
      companyName: 'BeatFlow Media',
      address: '478 Clubhouse Dr, Middletown, NJ 07748',
      year: new Date().getFullYear()
    }
  }
};
