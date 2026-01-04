// Script to send a test curator approval/rejection email
const nodemailer = require('nodemailer');
const emailConfig = require('../functions/emailConfig');

// Change this to 'approved' or 'rejected' to test different emails
const emailType = 'approved'; // or 'rejected'
const isApproved = emailType === 'approved';

const testEmail = 'percyrice@gmail.com';
const testName = 'Test Curator';
const testNotes = 'This is a test email to preview what curators will receive.';

const decisionEmailHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: ${isApproved ? '#1DB954' : '#ff5722'}; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0;">${isApproved ? '🎉' : '📋'} Curator Application ${isApproved ? 'Approved' : 'Decision'}</h1>
      <p style="color: white; margin: 10px 0 0 0;">${isApproved ? 'Welcome to BeatFlow Media!' : 'Thank you for your application'}</p>
    </div>

    <div style="padding: 30px; background: #f9f9f9;">
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin-bottom: 20px;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          <strong>⚠️ TEST EMAIL:</strong> This is a test email. This is what curators will receive when their application is ${emailType}.
        </p>
      </div>

      <h2 style="color: #333;">Application ${isApproved ? 'Approved' : 'Decision'}</h2>

      <p style="color: #666; line-height: 1.6;">
        Hi ${testName},
      </p>

      <p style="color: #666; line-height: 1.6;">
        ${isApproved
          ? 'Congratulations! We are excited to inform you that your curator application has been approved. You are now an official BeatFlow Media curator!'
          : 'Thank you for your interest in becoming a BeatFlow Media curator. After careful review, we have decided not to move forward with your application at this time.'}
      </p>

      ${isApproved ? `
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #1DB954; margin: 20px 0;">
          <p style="color: #2e7d32; margin: 0; font-size: 14px;">
            <strong>What's Next:</strong> You can now start earning money by accepting artist playlist submissions and curating great music!
          </p>
        </div>

        <h3 style="color: #333;">Getting Started:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li><strong>Access Your Curator Portal:</strong> Go to the curator portal to view your dashboard</li>
          <li><strong>Set Up Stripe Payouts:</strong> Complete Stripe Connect onboarding to receive payments</li>
          <li><strong>Review Submissions:</strong> Start reviewing artist track submissions in your inbox</li>
          <li><strong>Set Your Rates:</strong> Configure pricing for your playlists based on reach and engagement</li>
          <li><strong>Get Paid:</strong> Earn 90% of placement fees when you accept and add tracks to your playlists</li>
        </ul>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1DB954;">
          <h3 style="color: #333; margin-top: 0;">How Curator Earnings Work:</h3>
          <p style="color: #666; margin: 5px 0;">• Artists pay $25-$1,000 to submit tracks to your playlists</p>
          <p style="color: #666; margin: 5px 0;">• You review and accept quality submissions that fit your curation style</p>
          <p style="color: #666; margin: 5px 0;">• Once you add the track to your playlist, funds are released from escrow</p>
          <p style="color: #666; margin: 5px 0;">• <strong>You keep 90%</strong> of the placement fee, platform keeps 10%</p>
          <p style="color: #666; margin: 5px 0;">• Payments processed via Stripe Connect within 24-48 hours</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://beatflowmediagroup.com/curator-portal"
             style="background: #1DB954; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; margin-bottom: 10px;">
            Go to Curator Portal →
          </a>
          <br>
          <a href="https://beatflowmediagroup.com/curator-earnings"
             style="background: #ff9800; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
            See Your Earning Potential
          </a>
        </div>
      ` : `
        <div style="background: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #ff5722; margin: 20px 0;">
          <p style="color: #c62828; margin: 0; font-size: 14px;">
            <strong>Application Not Approved:</strong> At this time, we are unable to accept your curator application.
          </p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h3 style="color: #333; margin-top: 0;">Feedback:</h3>
          <p style="color: #666; margin: 5px 0;">${testNotes}</p>
        </div>

        <h3 style="color: #333;">What You Can Do:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li>Continue growing your playlist following and engagement</li>
          <li>You may reapply in the future once you meet our curator criteria</li>
          <li>Explore other opportunities on BeatFlow Media (artist submissions, licensing, etc.)</li>
          <li>Contact us if you have questions about this decision</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://beatflowmediagroup.com/contact"
             style="background: #1DB954; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
            Contact Support
          </a>
        </div>
      `}

      <p style="color: #666; line-height: 1.6;">
        ${isApproved
          ? 'If you have any questions about getting started, please reach out to us at'
          : 'If you have questions about this decision, please contact us at'}
        <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954;">office.beatflowmediagroup@gmail.com</a>
      </p>

      <p style="color: #666; line-height: 1.6;">
        ${isApproved ? 'Welcome to the BeatFlow curator community!' : 'Thank you for your interest in BeatFlow Media.'}<br>
        <strong>The BeatFlow Media Team</strong>
      </p>
    </div>

    <div style="padding: 20px; text-align: center; background: #333; color: #999; font-size: 12px;">
      <p>© 2025 BeatFlow Media | 478 Clubhouse Dr, Middletown, NJ 07748</p>
      <p>
        <a href="https://beatflowmediagroup.com/curator-pricing" style="color: #1DB954; text-decoration: none;">Curator Program</a> |
        <a href="https://beatflowmediagroup.com/terms" style="color: #1DB954; text-decoration: none;">Terms of Service</a> |
        <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954; text-decoration: none;">Support</a>
      </p>
    </div>
  </div>
`;

async function sendTestEmail() {
  const {smtp, addresses} = emailConfig;

  const transporter = nodemailer.createTransport({
    service: smtp.service,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });

  const mailOptions = {
    from: addresses.from,
    replyTo: addresses.replyTo,
    to: testEmail,
    subject: `[TEST] ${isApproved ? '🎉 Curator Application Approved' : 'Curator Application Decision'} - BeatFlow Media`,
    html: decisionEmailHtml
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Test ${emailType} email sent successfully to ${testEmail}`);
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

sendTestEmail();
