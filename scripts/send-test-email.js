// Test script to send takedown notification email
const nodemailer = require('../functions/node_modules/nodemailer');

async function sendTestEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'beatflowmediagroup@gmail.com',
      pass: 'eezqfupeocueocow' // New app password without spaces
    }
  });

  const takedownEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #d32f2f; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">⚠️ Content Takedown Notice</h1>
        <p style="color: white; margin: 10px 0 0 0;">Your content has been unpublished</p>
      </div>

      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333;">Content Unpublished (TEST)</h2>

        <p style="color: #666; line-height: 1.6;">
          Hi Percy,
        </p>

        <p style="color: #666; line-height: 1.6;">
          This is a <strong>TEST EMAIL</strong> to verify that the content takedown notification system is working correctly.
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <h3 style="color: #333; margin-top: 0;">Test Takedown Details:</h3>
          <p style="color: #666; margin: 5px 0;"><strong>Song:</strong> Test Song Title</p>
          <p style="color: #666; margin: 5px 0;"><strong>Artist:</strong> Test Artist</p>
          <p style="color: #666; margin: 5px 0;"><strong>Reason:</strong> Testing Email System</p>
          <p style="color: #666; margin: 15px 0 5px 0;"><strong>Additional Information:</strong></p>
          <p style="color: #666; margin: 5px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">
            This is a test email to verify the Firebase Functions email notification system is working properly.
            If you receive this email, the system is functioning correctly!
          </p>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>This is a test:</strong> No actual content has been taken down. This is only a test of the email notification system.
          </p>
        </div>

        <h3 style="color: #333;">Next Steps:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li>If you received this email, the notification system is working!</li>
          <li>Real takedown emails will look similar to this</li>
          <li>Artists will receive these notifications when content is unpublished</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://beatflowmedia.com/contact"
             style="background: #1DB954; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
            Contact Support
          </a>
        </div>

        <p style="color: #666; line-height: 1.6;">
          If you have questions about this test, please contact us at
          <a href="mailto:office@beatflowmedia.com" style="color: #1DB954;">office@beatflowmedia.com</a>
        </p>

        <p style="color: #666; line-height: 1.6;">
          Best regards,<br>
          <strong>The BeatFlow Media Team</strong>
        </p>
      </div>

      <div style="padding: 20px; text-align: center; background: #333; color: #999; font-size: 12px;">
        <p>© 2025 BeatFlow Media | 478 Clubhouse Dr, Middletown, NJ 07748</p>
        <p>
          <a href="https://beatflowmedia.com/terms" style="color: #1DB954; text-decoration: none;">Terms of Service</a> |
          <a href="https://beatflowmedia.com/user-guidelines" style="color: #1DB954; text-decoration: none;">Community Guidelines</a> |
          <a href="mailto:office@beatflowmedia.com" style="color: #1DB954; text-decoration: none;">Support</a>
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: 'BeatFlow Media <noreply@beatflowmedia.com>',
    to: 'percyricemusic@gmail.com',
    subject: '⚠️ TEST: Content Takedown Notice - BeatFlow Media',
    html: takedownEmailHtml
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('To:', 'percyricemusic@gmail.com');
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

sendTestEmail();
