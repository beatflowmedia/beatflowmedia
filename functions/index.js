const {onDocumentUpdated} = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Helper function to send email
async function sendEmail(to, subject, html) {
  // Get email credentials
  const emailUser = 'beatflowmediagroup@gmail.com';
  const emailPass = 'eezqfupeocueocow'; // App password

  if (!emailUser || !emailPass) {
    console.log('Skipping email send (no credentials configured):', to, subject);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  const mailOptions = {
    from: 'BeatFlow Media <noreply@beatflowmedia.com>',
    to: to,
    subject: subject,
    html: html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// ========================================
// CONTENT TAKEDOWN NOTIFICATION EMAIL (SONGS)
// ========================================
exports.onContentTakedown = onDocumentUpdated('songs/{songId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only send email if content was just unpublished
  const wasVisible = before.isVisible !== false;
  const nowHidden = after.isVisible === false;
  const hasTakedownReason = after.takedownReason;

  if (!wasVisible || !nowHidden || !hasTakedownReason) {
    return null;
  }

  try {
    // Get artist/uploader details
    const uploaderId = after.uploadedBy;
    if (!uploaderId) {
      console.log('No uploader ID found for song:', event.params.songId);
      return null;
    }

    // Try to get user from users collection
    let userEmail = null;
    let userName = 'Artist';

    const userDoc = await admin.firestore().collection('users').doc(uploaderId).get();
    if (userDoc.exists) {
      const user = userDoc.data();
      userEmail = user?.email;
      userName = user?.displayName || user?.email?.split('@')[0] || 'Artist';
    }

    if (!userEmail) {
      console.error('No email found for uploader:', uploaderId);
      return null;
    }

    const reasonLabels = {
      'copyright': 'Copyright Infringement',
      'dmca': 'DMCA Takedown Request',
      'tos': 'Terms of Service Violation',
      'inappropriate': 'Inappropriate Content',
      'quality': 'Quality Issues',
      'duplicate': 'Duplicate Content',
      'other': 'Policy Violation'
    };

    const reasonText = reasonLabels[after.takedownReason] || after.takedownReason;

    // Email to artist (takedown notification)
    const takedownEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #d32f2f; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ Content Takedown Notice</h1>
          <p style="color: white; margin: 10px 0 0 0;">Your content has been unpublished</p>
        </div>

        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Content Unpublished</h2>

          <p style="color: #666; line-height: 1.6;">
            Hi ${userName},
          </p>

          <p style="color: #666; line-height: 1.6;">
            We're writing to inform you that your song has been unpublished from BeatFlow Media and is no longer visible to users.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <h3 style="color: #333; margin-top: 0;">Takedown Details:</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Song:</strong> ${after.title || 'Untitled'}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Artist:</strong> ${after.artist || 'Unknown'}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Reason:</strong> ${reasonText}</p>
            ${after.takedownNotes ? `<p style="color: #666; margin: 15px 0 5px 0;"><strong>Additional Information:</strong></p><p style="color: #666; margin: 5px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">${after.takedownNotes}</p>` : ''}
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>What this means:</strong> Your content has been removed from public view but has not been permanently deleted.
              The content will remain in our system while this matter is being reviewed.
            </p>
          </div>

          <h3 style="color: #333;">Next Steps:</h3>
          <ul style="color: #666; line-height: 1.8;">
            <li>If you believe this was done in error, you can appeal this decision below</li>
            <li>Review our Terms of Service and Community Guidelines</li>
            <li>Do not re-upload the same content without resolution</li>
            <li>For copyright issues, you may need to provide proof of ownership or licensing</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/appeal-takedown?songId=${event.params.songId}&reason=${encodeURIComponent(after.takedownReason)}"
               style="background: #ff9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; margin-right: 10px;">
              Appeal This Decision
            </a>
            <a href="http://localhost:3000/contact"
               style="background: #1DB954; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
              Contact Support
            </a>
          </div>

          <p style="color: #666; line-height: 1.6;">
            If you have questions about this takedown, please reply to this email or contact us at
            <a href="mailto:office@beatflowmedia.com" style="color: #1DB954;">office@beatflowmedia.com</a>
          </p>

          <p style="color: #666; line-height: 1.6;">
            Thank you for your understanding,<br>
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

    // Send takedown notification to artist
    await sendEmail(
      userEmail,
      `⚠️ Content Takedown Notice: ${after.title || 'Your Song'} - BeatFlow Media`,
      takedownEmailHtml
    );

    console.log('Content takedown email sent to:', userEmail, 'for song:', after.title);
    return null;
  } catch (error) {
    console.error('Error sending content takedown email:', error);
    return null;
  }
});

// ========================================
// ALBUM TAKEDOWN NOTIFICATION EMAIL
// ========================================
exports.onAlbumTakedown = onDocumentUpdated('albums/{albumId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only send email if content was just unpublished
  const wasVisible = before.isVisible !== false;
  const nowHidden = after.isVisible === false;
  const hasTakedownReason = after.takedownReason;

  if (!wasVisible || !nowHidden || !hasTakedownReason) {
    return null;
  }

  try {
    const uploaderId = after.uploadedBy;
    if (!uploaderId) {
      console.log('No uploader ID found for album:', event.params.albumId);
      return null;
    }

    let userEmail = null;
    let userName = 'Artist';

    const userDoc = await admin.firestore().collection('users').doc(uploaderId).get();
    if (userDoc.exists) {
      const user = userDoc.data();
      userEmail = user?.email;
      userName = user?.displayName || user?.email?.split('@')[0] || 'Artist';
    }

    if (!userEmail) {
      console.error('No email found for uploader:', uploaderId);
      return null;
    }

    const reasonLabels = {
      'copyright': 'Copyright Infringement',
      'dmca': 'DMCA Takedown Request',
      'tos': 'Terms of Service Violation',
      'inappropriate': 'Inappropriate Content',
      'quality': 'Quality Issues',
      'duplicate': 'Duplicate Content',
      'other': 'Policy Violation'
    };

    const reasonText = reasonLabels[after.takedownReason] || after.takedownReason;

    const takedownEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #d32f2f; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ Content Takedown Notice</h1>
          <p style="color: white; margin: 10px 0 0 0;">Your content has been unpublished</p>
        </div>

        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Album Unpublished</h2>

          <p style="color: #666; line-height: 1.6;">
            Hi ${userName},
          </p>

          <p style="color: #666; line-height: 1.6;">
            We're writing to inform you that your album has been unpublished from BeatFlow Media and is no longer visible to users.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <h3 style="color: #333; margin-top: 0;">Takedown Details:</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Album:</strong> ${after.title || 'Untitled'}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Artist:</strong> ${after.artist || 'Unknown'}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Tracks:</strong> ${after.trackCount || 0} songs (also unpublished)</p>
            <p style="color: #666; margin: 5px 0;"><strong>Reason:</strong> ${reasonText}</p>
            ${after.takedownNotes ? `<p style="color: #666; margin: 15px 0 5px 0;"><strong>Additional Information:</strong></p><p style="color: #666; margin: 5px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">${after.takedownNotes}</p>` : ''}
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>What this means:</strong> Your album and all its tracks have been removed from public view but have not been permanently deleted.
              The content will remain in our system while this matter is being reviewed.
            </p>
          </div>

          <h3 style="color: #333;">Next Steps:</h3>
          <ul style="color: #666; line-height: 1.8;">
            <li>If you believe this was done in error, you can appeal this decision below</li>
            <li>Review our Terms of Service and Community Guidelines</li>
            <li>Do not re-upload the same content without resolution</li>
            <li>For copyright issues, you may need to provide proof of ownership or licensing</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/appeal-takedown?songId=${event.params.songId}&reason=${encodeURIComponent(after.takedownReason)}"
               style="background: #ff9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; margin-right: 10px;">
              Appeal This Decision
            </a>
            <a href="http://localhost:3000/contact"
               style="background: #1DB954; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
              Contact Support
            </a>
          </div>

          <p style="color: #666; line-height: 1.6;">
            If you have questions about this takedown, please reply to this email or contact us at
            <a href="mailto:office@beatflowmedia.com" style="color: #1DB954;">office@beatflowmedia.com</a>
          </p>

          <p style="color: #666; line-height: 1.6;">
            Thank you for your understanding,<br>
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

    await sendEmail(
      userEmail,
      `⚠️ Content Takedown Notice: ${after.title || 'Your Album'} - BeatFlow Media`,
      takedownEmailHtml
    );

    console.log('Album takedown email sent to:', userEmail, 'for album:', after.title);
    return null;
  } catch (error) {
    console.error('Error sending album takedown email:', error);
    return null;
  }
});

// ========================================
// APPEAL DECISION NOTIFICATION EMAIL
// ========================================
exports.onAppealDecision = onDocumentUpdated('appeals/{appealId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only send email when appeal status changes to approved or denied
  const statusChanged = before.status !== after.status;
  const isDecided = after.status === 'approved' || after.status === 'denied';

  if (!statusChanged || !isDecided) {
    return null;
  }

  try {
    const artistEmail = after.artistEmail;
    const artistName = after.artistName;

    if (!artistEmail) {
      console.error('No email found for appeal:', event.params.appealId);
      return null;
    }

    const isApproved = after.status === 'approved';

    const decisionEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${isApproved ? '#4caf50' : '#ff5722'}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">${isApproved ? '✓' : '✗'} Appeal Decision</h1>
          <p style="color: white; margin: 10px 0 0 0;">Your appeal has been ${isApproved ? 'approved' : 'denied'}</p>
        </div>

        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Appeal ${isApproved ? 'Approved' : 'Denied'}</h2>

          <p style="color: #666; line-height: 1.6;">
            Hi ${artistName},
          </p>

          <p style="color: #666; line-height: 1.6;">
            We have reviewed your appeal for the content takedown and have ${isApproved ? 'approved' : 'denied'} your request.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isApproved ? '#4caf50' : '#ff5722'};">
            <h3 style="color: #333; margin-top: 0;">Content Details:</h3>
            <p style="color: #666; margin: 5px 0;"><strong>${after.contentType === 'song' ? 'Song' : 'Album'}:</strong> ${after.contentTitle}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Artist:</strong> ${after.contentArtist}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Original Takedown Reason:</strong> ${after.originalTakedownReason}</p>
            ${after.adminNotes ? `<p style="color: #666; margin: 15px 0 5px 0;"><strong>Admin Notes:</strong></p><p style="color: #666; margin: 5px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">${after.adminNotes}</p>` : ''}
          </div>

          ${isApproved ? `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0; font-size: 14px;">
                <strong>Great News!</strong> Your content has been republished and is now visible to users on BeatFlow Media.
              </p>
            </div>

            <h3 style="color: #333;">What's Next:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Your content is now live and available for streaming/purchase</li>
              <li>You can view it on your artist profile</li>
              <li>Thank you for providing the necessary evidence</li>
            </ul>
          ` : `
            <div style="background: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #ff5722; margin: 20px 0;">
              <p style="color: #c62828; margin: 0; font-size: 14px;">
                <strong>Appeal Denied:</strong> After review, we have determined that the original takedown was justified.
              </p>
            </div>

            <h3 style="color: #333;">What's Next:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Your content will remain unpublished</li>
              <li>If you have additional evidence, you may contact support</li>
              <li>For copyright disputes, you may need to resolve the issue with the copyright holder</li>
              <li>Repeated violations may result in account restrictions</li>
            </ul>
          `}

          <div style="text-align: center; margin: 30px 0;">
            ${isApproved ? `
              <a href="https://beatflowmedia.com/artist-profile"
                 style="background: #1DB954; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                View Your Content
              </a>
            ` : `
              <a href="https://beatflowmedia.com/contact"
                 style="background: #1DB954; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                Contact Support
              </a>
            `}
          </div>

          <p style="color: #666; line-height: 1.6;">
            If you have questions about this decision, please contact us at
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

    await sendEmail(
      artistEmail,
      `${isApproved ? '✓' : '✗'} Appeal ${isApproved ? 'Approved' : 'Denied'}: ${after.contentTitle} - BeatFlow Media`,
      decisionEmailHtml
    );

    console.log(`Appeal decision email sent to: ${artistEmail}, Status: ${after.status}`);
    return null;
  } catch (error) {
    console.error('Error sending appeal decision email:', error);
    return null;
  }
});
