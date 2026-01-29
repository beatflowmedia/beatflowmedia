const {onDocumentUpdated, onDocumentCreated} = require('firebase-functions/v2/firestore');
const {onCall} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');

admin.initializeApp();

// Helper function to send email
async function sendEmail(to, subject, html) {
  // Get email credentials from centralized config
  const {smtp, addresses} = emailConfig;

  if (!smtp.user || !smtp.pass) {
    console.log('Skipping email send (no credentials configured):', to, subject);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: smtp.service,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });

  const mailOptions = {
    from: addresses.from,
    replyTo: addresses.replyTo, // User replies go to office.beatflowmediagroup@gmail.com
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
// SECURE AUDIO STREAMING - SIGNED URL GENERATION
// ========================================
exports.getSignedAudioUrl = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new Error('Authentication required to stream audio.');
  }

  const {songId} = request.data;

  if (!songId) {
    throw new Error('songId is required.');
  }

  try {
    const userId = request.auth.uid;

    // Get song data from Firestore
    const songDoc = await admin.firestore().collection('songs').doc(songId).get();

    if (!songDoc.exists) {
      throw new Error('Song not found.');
    }

    const songData = songDoc.data();
    const audioUrl = songData.audioUrl || songData.streamUrl;

    if (!audioUrl) {
      throw new Error('Audio URL not found for this song.');
    }

    // Check if user has purchased the song OR if it's free to stream
    const isPurchased = await checkSongPurchase(userId, songId);
    const isFreeToStream = songData.price === 0 || songData.streamable === true;

    if (!isPurchased && !isFreeToStream) {
      // User must purchase to stream
      throw new Error('Purchase required to stream this song.');
    }

    // Extract the file path from the Firebase Storage URL
    // Example: https://firebasestorage.googleapis.com/v0/b/beatflowmedia.firebasestorage.app/o/artist-uploads%2Faudio%2F1767312405420_Say%20the%20Words.wav?alt=media&token=...
    const match = audioUrl.match(/\/o\/([^?]+)/);

    if (!match) {
      throw new Error('Invalid audio URL format.');
    }

    const filePath = decodeURIComponent(match[1]);

    // Generate signed URL that expires in 1 hour
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Log access for analytics
    await admin.firestore().collection('audioAccess').add({
      userId,
      songId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isPurchased,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });

    return {
      signedUrl,
      expiresAt: Date.now() + 60 * 60 * 1000
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
});

// Helper function to check if user has purchased a song
async function checkSongPurchase(userId, songId) {
  const purchaseDoc = await admin.firestore()
    .collection('purchases')
    .where('userId', '==', userId)
    .where('songId', '==', songId)
    .where('status', '==', 'completed')
    .limit(1)
    .get();

  return !purchaseDoc.empty;
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
            <a href="https://beatflowmediagroup.com/appeal-takedown?songId=${event.params.songId}&reason=${encodeURIComponent(after.takedownReason)}"
               style="background: #ff9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; margin-right: 10px;">
              Appeal This Decision
            </a>
            <a href="https://beatflowmediagroup.com/contact"
               style="background: #1DB954; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
              Contact Support
            </a>
          </div>

          <p style="color: #666; line-height: 1.6;">
            If you have questions about this takedown, please reply to this email or contact us at
            <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954;">office.beatflowmediagroup@gmail.com</a>
          </p>

          <p style="color: #666; line-height: 1.6;">
            Thank you for your understanding,<br>
            <strong>The BeatFlow Media Team</strong>
          </p>
        </div>

        <div style="padding: 20px; text-align: center; background: #333; color: #999; font-size: 12px;">
          <p>© 2025 BeatFlow Media | 478 Clubhouse Dr, Middletown, NJ 07748</p>
          <p>
            <a href="https://beatflowmediagroup.com/terms" style="color: #1DB954; text-decoration: none;">Terms of Service</a> |
            <a href="https://beatflowmediagroup.com/user-guidelines" style="color: #1DB954; text-decoration: none;">Community Guidelines</a> |
            <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954; text-decoration: none;">Support</a>
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
            <a href="https://beatflowmediagroup.com/appeal-takedown?songId=${event.params.songId}&reason=${encodeURIComponent(after.takedownReason)}"
               style="background: #ff9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; margin-right: 10px;">
              Appeal This Decision
            </a>
            <a href="https://beatflowmediagroup.com/contact"
               style="background: #1DB954; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
              Contact Support
            </a>
          </div>

          <p style="color: #666; line-height: 1.6;">
            If you have questions about this takedown, please reply to this email or contact us at
            <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954;">office.beatflowmediagroup@gmail.com</a>
          </p>

          <p style="color: #666; line-height: 1.6;">
            Thank you for your understanding,<br>
            <strong>The BeatFlow Media Team</strong>
          </p>
        </div>

        <div style="padding: 20px; text-align: center; background: #333; color: #999; font-size: 12px;">
          <p>© 2025 BeatFlow Media | 478 Clubhouse Dr, Middletown, NJ 07748</p>
          <p>
            <a href="https://beatflowmediagroup.com/terms" style="color: #1DB954; text-decoration: none;">Terms of Service</a> |
            <a href="https://beatflowmediagroup.com/user-guidelines" style="color: #1DB954; text-decoration: none;">Community Guidelines</a> |
            <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954; text-decoration: none;">Support</a>
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
              <a href="https://beatflowmediagroup.com/artist-profile"
                 style="background: #1DB954; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                View Your Content
              </a>
            ` : `
              <a href="https://beatflowmediagroup.com/contact"
                 style="background: #1DB954; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                Contact Support
              </a>
            `}
          </div>

          <p style="color: #666; line-height: 1.6;">
            If you have questions about this decision, please contact us at
            <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954;">office.beatflowmediagroup@gmail.com</a>
          </p>

          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            <strong>The BeatFlow Media Team</strong>
          </p>
        </div>

        <div style="padding: 20px; text-align: center; background: #333; color: #999; font-size: 12px;">
          <p>© 2025 BeatFlow Media | 478 Clubhouse Dr, Middletown, NJ 07748</p>
          <p>
            <a href="https://beatflowmediagroup.com/terms" style="color: #1DB954; text-decoration: none;">Terms of Service</a> |
            <a href="https://beatflowmediagroup.com/user-guidelines" style="color: #1DB954; text-decoration: none;">Community Guidelines</a> |
            <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954; text-decoration: none;">Support</a>
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

// ========================================
// CURATOR APPLICATION DECISION EMAIL
// ========================================
exports.onCuratorApplicationDecision = onDocumentUpdated('curatorApplications/{applicationId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only send email when application status changes to approved or rejected
  const statusChanged = before.status !== after.status;
  const isDecided = after.status === 'approved' || after.status === 'rejected';

  if (!statusChanged || !isDecided) {
    return null;
  }

  try {
    const applicantEmail = after.email;
    const applicantName = after.name;

    if (!applicantEmail) {
      console.error('No email found for curator application:', event.params.applicationId);
      return null;
    }

    const isApproved = after.status === 'approved';

    const decisionEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${isApproved ? '#1DB954' : '#ff5722'}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">${isApproved ? '🎉' : '📋'} Curator Application ${isApproved ? 'Approved' : 'Decision'}</h1>
          <p style="color: white; margin: 10px 0 0 0;">${isApproved ? 'Welcome to BeatFlow Media!' : 'Thank you for your application'}</p>
        </div>

        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Application ${isApproved ? 'Approved' : 'Decision'}</h2>

          <p style="color: #666; line-height: 1.6;">
            Hi ${applicantName},
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

            ${after.notes ? `
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                <h3 style="color: #333; margin-top: 0;">Feedback:</h3>
                <p style="color: #666; margin: 5px 0;">${after.notes}</p>
              </div>
            ` : ''}

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

    await sendEmail(
      applicantEmail,
      `${isApproved ? '🎉 Curator Application Approved' : 'Curator Application Decision'} - BeatFlow Media`,
      decisionEmailHtml
    );

    console.log(`Curator application decision email sent to: ${applicantEmail}, Status: ${after.status}`);
    return null;
  } catch (error) {
    console.error('Error sending curator application decision email:', error);
    return null;
  }
});

// ========================================
// CURATOR STATUS CHANGE EMAIL
// ========================================
exports.onCuratorStatusChange = onDocumentUpdated('curators/{curatorId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only send email when status changes to suspended, revoked, or reactivated
  const statusChanged = before.status !== after.status;
  const isStatusChange = after.status === 'suspended' || after.status === 'revoked' ||
                        (after.status === 'active' && before.status !== 'active');

  if (!statusChanged || !isStatusChange) {
    return null;
  }

  try {
    const curatorEmail = after.email;
    const curatorName = after.name;

    if (!curatorEmail) {
      console.error('No email found for curator:', event.params.curatorId);
      return null;
    }

    const status = after.status;
    const reason = after.suspensionReason || after.revocationReason || after.reactivationNotes || 'No reason provided';

    let subject, heading, message, callToAction;

    if (status === 'suspended') {
      subject = '⚠️ Curator Account Suspended - BeatFlow Media';
      heading = 'Account Suspended';
      message = `Your curator account has been temporarily suspended. During this time, you will not be able to access curator features or receive new submissions.`;
    } else if (status === 'revoked') {
      subject = '🚫 Curator Access Revoked - BeatFlow Media';
      heading = 'Access Revoked';
      message = `Your curator access has been revoked and your curator role has been removed. You will no longer have access to curator features.`;
    } else if (status === 'active' && before.status !== 'active') {
      subject = '✅ Curator Account Reactivated - BeatFlow Media';
      heading = 'Account Reactivated';
      message = `Great news! Your curator account has been reactivated. You now have full access to all curator features.`;
    }

    const statusEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${status === 'active' ? '#1DB954' : status === 'suspended' ? '#ff9800' : '#ff5722'}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">${heading}</h1>
          <p style="color: white; margin: 10px 0 0 0;">BeatFlow Media Curator Program</p>
        </div>

        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Curator Account Status Update</h2>

          <p style="color: #666; line-height: 1.6;">
            Hi ${curatorName},
          </p>

          <p style="color: #666; line-height: 1.6;">
            ${message}
          </p>

          <div style="background: ${status === 'active' ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${status === 'active' ? '#1DB954' : status === 'suspended' ? '#ff9800' : '#ff5722'}; margin: 20px 0;">
            <p style="color: #333; margin: 0; font-size: 14px;">
              <strong>Reason:</strong> ${reason}
            </p>
          </div>

          ${status === 'active' ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://beatflowmediagroup.com/curator-portal"
                 style="background: #1DB954; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                Access Curator Portal →
              </a>
            </div>
          ` : status === 'suspended' ? `
            <h3 style="color: #333;">What This Means:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Your curator dashboard is temporarily inaccessible</li>
              <li>You will not receive new track submissions</li>
              <li>Existing submissions will be on hold</li>
              <li>Your account can be reactivated once issues are resolved</li>
            </ul>
          ` : `
            <h3 style="color: #333;">What This Means:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Your curator role has been permanently removed</li>
              <li>You no longer have access to curator features</li>
              <li>All pending submissions have been cancelled</li>
              <li>You may reapply for curator status in the future</li>
            </ul>
          `}

          <p style="color: #666; line-height: 1.6;">
            If you have questions about this decision or would like to appeal, please contact us at
            <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954;">office.beatflowmediagroup@gmail.com</a>
          </p>

          <p style="color: #666; line-height: 1.6;">
            Thank you,<br>
            <strong>BeatFlow Media Team</strong>
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            BeatFlow Media |
            <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954; text-decoration: none;">Support</a>
          </p>
        </div>
      </div>
    `;

    await sendEmail(curatorEmail, subject, statusEmailHtml);

    console.log(`Curator status change email sent to: ${curatorEmail}, New Status: ${status}`);
    return null;
  } catch (error) {
    console.error('Error sending curator status change email:', error);
    return null;
  }
});

// ========================================
// INVESTOR DECK REQUEST EMAIL
// ========================================
exports.onInvestorRequest = onDocumentCreated('investorRequests/{requestId}', async (event) => {
  const request = event.data.data();
  const investorEmail = request.email;
  const requestId = event.params.requestId;

  if (!investorEmail) {
    console.error('No email found for investor request:', requestId);
    return null;
  }

  try {
    // Generate unique access token and expiration (7 days)
    const crypto = require('crypto');
    const accessToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    );

    // Store token in Firestore
    await admin.firestore().collection('investorTokens').doc(accessToken).set({
      email: investorEmail,
      requestId: requestId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiresAt,
      accessed: false,
      accessCount: 0
    });

    // Generate secure deck access URL
    const deckUrl = `https://beatflowmediagroup.com/investor-deck?token=${accessToken}`;

    const investorEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1DB954; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎵 BeatFlow Media Investor Deck</h1>
          <p style="color: white; margin: 10px 0 0 0;">Thank you for your interest in BeatFlow Media</p>
        </div>

        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Investment Opportunity</h2>

          <p style="color: #666; line-height: 1.6;">
            Thank you for your interest in BeatFlow Media Group. We're excited to share our vision with you.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1DB954;">
            <h3 style="color: #333; margin-top: 0;">Executive Summary</h3>
            <p style="color: #666; margin: 5px 0;">
              <strong>Seeking:</strong> $1M seed funding
            </p>
            <p style="color: #666; margin: 5px 0;">
              <strong>Projected Year 1 Revenue:</strong> $3.8M
            </p>
            <p style="color: #666; margin: 5px 0;">
              <strong>Target Exit:</strong> $25-50M (5× return)
            </p>
            <p style="color: #666; margin: 5px 0;">
              <strong>Market:</strong> Hybrid artist-curator music streaming platform
            </p>
          </div>

          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
            <p style="color: #2e7d32; margin: 0; font-size: 14px;">
              <strong>What Makes Us Different:</strong> We combine direct artist distribution with curator-driven discovery,
              creating a sustainable ecosystem that benefits both creators and listeners.
            </p>
          </div>

          <h3 style="color: #333;">Key Metrics & Traction</h3>
          <ul style="color: #666; line-height: 1.8;">
            <li>Platform built and operational</li>
            <li>Direct artist onboarding system</li>
            <li>Stripe integration for payments and payouts</li>
            <li>Multi-tier premium subscription model</li>
            <li>Revenue sharing with independent artists</li>
          </ul>

          <h3 style="color: #333;">Access Your Private Investment Deck</h3>
          <p style="color: #666; line-height: 1.6;">
            We've prepared a comprehensive investment package with financial projections, ROI models, cap table, and use of funds.
          </p>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>🔒 Secure Access:</strong> This link is unique to you and expires in 7 days.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${deckUrl}"
               style="background: #1DB954; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 16px;">
              View Full Investment Deck →
            </a>
          </div>

          <p style="color: #999; font-size: 13px; text-align: center;">
            Link expires: ${expiresAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <p style="color: #666; line-height: 1.6;">
            We're happy to schedule a call to discuss the opportunity in detail and answer any questions you may have.
          </p>

          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            <strong>Percy Rice</strong><br>
            Founder & CEO<br>
            BeatFlow Media Group<br>
            <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954;">office.beatflowmediagroup@gmail.com</a>
          </p>
        </div>

        <div style="padding: 20px; text-align: center; background: #333; color: #999; font-size: 12px;">
          <p>© 2025 BeatFlow Media | 478 Clubhouse Dr, Middletown, NJ 07748</p>
          <p>
            <a href="https://beatflowmediagroup.com/investors" style="color: #1DB954; text-decoration: none;">Investor Portal</a> |
            <a href="https://beatflowmediagroup.com/nda" style="color: #1DB954; text-decoration: none;">NDA Terms</a> |
            <a href="mailto:office.beatflowmediagroup@gmail.com" style="color: #1DB954; text-decoration: none;">Contact</a>
          </p>
        </div>
      </div>
    `;

    await sendEmail(
      investorEmail,
      '🎵 BeatFlow Media - Investor Deck & Opportunity Details',
      investorEmailHtml
    );

    // Also notify admin
    await sendEmail(
      'office.beatflowmediagroup@gmail.com',
      `New Investor Request: ${investorEmail}`,
      `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New Investor Request Received</h2>
          <p><strong>Email:</strong> ${investorEmail}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Action:</strong> Investor deck email has been automatically sent.</p>
          <p>Follow up with this investor to provide the full deck and schedule a call.</p>
        </div>
      `
    );

    console.log('Investor deck email sent to:', investorEmail);
    return null;
  } catch (error) {
    console.error('Error sending investor deck email:', error);
    return null;
  }
});

// ========================================
// 2026 HYBRID MARKETING STRATEGY - EMAIL NOTIFICATIONS
// ========================================

/**
 * Send welcome email with exclusive content when fan captures email
 * Triggered when fanCaptures/{captureId} document is created
 */
exports.onFanEmailCapture = onDocumentCreated('fanCaptures/{captureId}', async (event) => {
  const captureData = event.data.data();
  const {email, artistName, artistId, incentiveType, incentiveContent} = captureData;

  if (!email || !artistName) {
    console.error('Missing email or artist name in fan capture:', event.params.captureId);
    return null;
  }

  try {
    const welcomeEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e14; color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #1db954 0%, #1ed760 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎵 Welcome to ${artistName}'s Inner Circle!</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px;">Thanks for following on BeatFlow Media</p>
        </div>

        <div style="padding: 40px 30px; background: #111827;">
          <p style="color: #f9fafb; font-size: 16px; line-height: 1.6;">
            Hey there! 👋
          </p>
          <p style="color: #f9fafb; font-size: 16px; line-height: 1.6;">
            As promised, here's your exclusive ${incentiveType === 'demo' ? 'unreleased demo' : 'early access content'} from ${artistName}:
          </p>

          ${incentiveContent ? `
          <div style="background: #1f2937; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #1db954;">
            <h3 style="color: #1db954; margin: 0 0 15px 0; font-size: 18px;">🎁 Your Exclusive Content</h3>
            <p style="color: #d1d5db; margin: 0; line-height: 1.6;">${incentiveContent}</p>
            <a href="https://beatflowmedia.com/artist/${encodeURIComponent(artistName)}"
               style="display: inline-block; margin-top: 20px; background: #1db954; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Listen Now on BeatFlow
            </a>
          </div>
          ` : ''}

          <p style="color: #f9fafb; font-size: 16px; line-height: 1.6; margin-top: 30px;">
            You'll be the first to know when ${artistName} drops new music, announces shows, or shares exclusive behind-the-scenes content.
          </p>

          <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; padding-top: 30px; border-top: 1px solid #374151;">
            You're receiving this because you followed ${artistName} on BeatFlow Media.
            <a href="https://beatflowmedia.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #1db954; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `;

    await sendEmail(
      email,
      `🎵 Welcome! Your exclusive content from ${artistName}`,
      welcomeEmailHtml
    );

    console.log('Fan capture welcome email sent to:', email, 'for artist:', artistName);
    return null;
  } catch (error) {
    console.error('Error sending fan capture email:', error);
    return null;
  }
});

/**
 * Send Release Radar notification when artist uploads new song
 * Triggered when songs/{songId} document is created
 */
exports.onNewSongRelease = onDocumentCreated('songs/{songId}', async (event) => {
  const songData = event.data.data();
  const {title, artistName, artist, uploadedBy, coverUrl, cover, genre} = songData;

  if (!uploadedBy || !title) {
    return null; // Skip if missing data
  }

  try {
    // Get all fans who follow this artist (from fanCaptures collection)
    const fansSnapshot = await admin.firestore()
      .collection('fanCaptures')
      .where('artistId', '==', uploadedBy)
      .get();

    if (fansSnapshot.empty) {
      console.log('No fans to notify for artist:', artistName || artist);
      return null;
    }

    const artistDisplayName = artistName || artist || 'Your Favorite Artist';
    const songImage = coverUrl || cover || 'https://beatflowmedia.com/images/default-cover.jpg';

    // Send email to all followers (batched to avoid rate limits)
    const emailPromises = [];
    fansSnapshot.forEach((doc) => {
      const fanData = doc.data();
      const fanEmail = fanData.email;

      if (!fanEmail) return;

      const releaseEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e14; color: #f9fafb;">
          <div style="background: linear-gradient(135deg, #1db954 0%, #1ed760 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔥 New Release from ${artistDisplayName}!</h1>
            <p style="color: white; margin: 15px 0 0 0; font-size: 16px;">Fresh music just dropped on BeatFlow</p>
          </div>

          <div style="padding: 40px 30px; background: #111827;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${songImage}" alt="${title}" style="width: 250px; height: 250px; border-radius: 12px; object-fit: cover; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
            </div>

            <h2 style="color: #1db954; text-align: center; font-size: 24px; margin: 0 0 10px 0;">${title}</h2>
            <p style="color: #9ca3af; text-align: center; font-size: 16px; margin: 0 0 30px 0;">by ${artistDisplayName}</p>

            ${genre ? `<p style="color: #d1d5db; text-align: center; margin: 0 0 30px 0;"><span style="background: #1f2937; padding: 8px 16px; border-radius: 20px; font-size: 14px;">🎸 ${genre}</span></p>` : ''}

            <div style="text-align: center; margin: 40px 0;">
              <a href="https://beatflowmedia.com/song/${event.params.songId}"
                 style="display: inline-block; background: #1db954; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">
                ▶️ Listen Now
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 40px;">
              Be the first to stream, save, and share this new track!
            </p>

            <p style="color: #6b7280; font-size: 13px; margin-top: 40px; padding-top: 30px; border-top: 1px solid #374151; text-align: center;">
              You're receiving this because you follow ${artistDisplayName} on BeatFlow Media.
              <a href="https://beatflowmedia.com/unsubscribe?email=${encodeURIComponent(fanEmail)}" style="color: #1db954; text-decoration: none;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `;

      emailPromises.push(
        sendEmail(
          fanEmail,
          `🔥 New from ${artistDisplayName}: ${title}`,
          releaseEmailHtml
        ).catch(err => {
          console.error('Failed to send release email to:', fanEmail, err);
        })
      );
    });

    // Send all emails in batches of 10 to avoid rate limits
    for (let i = 0; i < emailPromises.length; i += 10) {
      const batch = emailPromises.slice(i, i + 10);
      await Promise.all(batch);
      // Small delay between batches
      if (i + 10 < emailPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Release Radar emails sent to ${emailPromises.length} fans for song: ${title}`);
    return null;
  } catch (error) {
    console.error('Error sending release radar emails:', error);
    return null;
  }
});

/**
 * Send campaign performance summary email to artist
 * Triggered when campaigns/{campaignId} status changes to 'completed'
 */
exports.onCampaignComplete = onDocumentUpdated('campaigns/{campaignId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only send when campaign status changes to completed
  if (before.status === 'completed' || after.status !== 'completed') {
    return null;
  }

  try {
    const {
      artistEmail,
      artistName,
      title,
      type,
      budget,
      conversions = {},
      performance = {},
      startDate,
      duration
    } = after;

    if (!artistEmail) {
      console.error('No artist email for campaign:', event.params.campaignId);
      return null;
    }

    const {
      clicks = 0,
      plays = 0,
      follows = 0,
      saves = 0,
      playlistAdds = 0,
      emailCaptures = 0,
      completionRate = 0,
      skipRate = 0
    } = conversions;

    const {
      cpc = 0,
      cpa = 0,
      roi = 0,
      engagement = 0
    } = performance;

    const campaignSummaryHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #0a0e14; color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #1db954 0%, #1ed760 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📊 Campaign Complete!</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 16px;">${title}</p>
        </div>

        <div style="padding: 40px 30px; background: #111827;">
          <p style="color: #f9fafb; font-size: 16px;">Hi ${artistName},</p>
          <p style="color: #f9fafb; font-size: 16px; line-height: 1.6;">
            Your <strong>${type}</strong> campaign has completed! Here's how it performed:
          </p>

          <div style="background: #1f2937; padding: 25px; border-radius: 12px; margin: 30px 0;">
            <h3 style="color: #1db954; margin: 0 0 20px 0; font-size: 20px;">Campaign Overview</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #9ca3af; padding: 10px 0; border-bottom: 1px solid #374151;">Budget</td>
                <td style="color: #f9fafb; padding: 10px 0; border-bottom: 1px solid #374151; text-align: right; font-weight: bold;">$${budget.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #9ca3af; padding: 10px 0; border-bottom: 1px solid #374151;">Duration</td>
                <td style="color: #f9fafb; padding: 10px 0; border-bottom: 1px solid #374151; text-align: right;">${duration} days</td>
              </tr>
              <tr>
                <td style="color: #9ca3af; padding: 10px 0; border-bottom: 1px solid #374151;">ROI</td>
                <td style="color: ${roi > 100 ? '#1db954' : '#f59e0b'}; padding: 10px 0; border-bottom: 1px solid #374151; text-align: right; font-weight: bold;">${roi.toFixed(0)}%</td>
              </tr>
              <tr>
                <td style="color: #9ca3af; padding: 10px 0;">Engagement Score</td>
                <td style="color: #f9fafb; padding: 10px 0; text-align: right; font-weight: bold;">${engagement.toFixed(0)}/100</td>
              </tr>
            </table>
          </div>

          <div style="background: #1f2937; padding: 25px; border-radius: 12px; margin: 30px 0;">
            <h3 style="color: #1db954; margin: 0 0 20px 0; font-size: 20px;">Performance Metrics</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <p style="color: #9ca3af; margin: 0; font-size: 14px;">Smart Link Clicks</p>
                <p style="color: #f9fafb; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${clicks.toLocaleString()}</p>
              </div>
              <div>
                <p style="color: #9ca3af; margin: 0; font-size: 14px;">Plays</p>
                <p style="color: #f9fafb; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${plays.toLocaleString()}</p>
              </div>
              <div>
                <p style="color: #9ca3af; margin: 0; font-size: 14px;">New Followers</p>
                <p style="color: #1db954; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${follows.toLocaleString()}</p>
              </div>
              <div>
                <p style="color: #9ca3af; margin: 0; font-size: 14px;">Saves</p>
                <p style="color: #1db954; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${saves.toLocaleString()}</p>
              </div>
              <div>
                <p style="color: #9ca3af; margin: 0; font-size: 14px;">Playlist Adds</p>
                <p style="color: #f9fafb; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${playlistAdds.toLocaleString()}</p>
              </div>
              <div>
                <p style="color: #9ca3af; margin: 0; font-size: 14px;">Email Captures</p>
                <p style="color: #f9fafb; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${emailCaptures.toLocaleString()}</p>
              </div>
            </div>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151;">
              <div style="margin-bottom: 15px;">
                <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 14px;">Completion Rate</p>
                <div style="background: #374151; height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="background: #1db954; height: 100%; width: ${completionRate}%;"></div>
                </div>
                <p style="color: #f9fafb; margin: 5px 0 0 0; font-size: 14px;">${completionRate.toFixed(1)}%</p>
              </div>
              <div>
                <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 14px;">Skip Rate</p>
                <div style="background: #374151; height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="background: ${skipRate > 30 ? '#ef4444' : '#f59e0b'}; height: 100%; width: ${skipRate}%;"></div>
                </div>
                <p style="color: #f9fafb; margin: 5px 0 0 0; font-size: 14px;">${skipRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div style="background: #1f2937; padding: 25px; border-radius: 12px; margin: 30px 0;">
            <h3 style="color: #1db954; margin: 0 0 15px 0; font-size: 20px;">Cost Analysis</h3>
            <p style="color: #9ca3af; margin: 0;">Cost Per Click: <span style="color: #f9fafb; font-weight: bold;">$${cpc.toFixed(2)}</span></p>
            <p style="color: #9ca3af; margin: 10px 0 0 0;">Cost Per Acquisition (Follow/Save): <span style="color: #f9fafb; font-weight: bold;">$${cpa.toFixed(2)}</span></p>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="https://beatflowmedia.com/artist-dashboard/campaigns/${event.params.campaignId}"
               style="display: inline-block; background: #1db954; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">
              View Full Report
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            Ready to launch your next campaign? Use these insights to optimize your targeting and budget allocation.
          </p>

          <p style="color: #6b7280; font-size: 13px; margin-top: 40px; padding-top: 30px; border-top: 1px solid #374151;">
            Questions? Reply to this email or contact us at support@beatflowmedia.com
          </p>
        </div>
      </div>
    `;

    await sendEmail(
      artistEmail,
      `📊 Campaign Complete: ${title} - Performance Report`,
      campaignSummaryHtml
    );

    console.log('Campaign completion email sent to:', artistEmail, 'for campaign:', title);
    return null;
  } catch (error) {
    console.error('Error sending campaign completion email:', error);
    return null;
  }
});

// ========================================
// PLATFORM STATS AUTO-UPDATE
// ========================================
/**
 * Auto-update platformStats when songs are created or deleted
 */
exports.updateStatsOnSongCreate = onDocumentCreated('songs/{songId}', async (event) => {
  try {
    const statsRef = admin.firestore().collection('platformStats').doc('global');
    await statsRef.update({
      totalSongs: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Platform stats updated: song created');
  } catch (error) {
    console.error('Error updating stats on song create:', error);
  }
});

exports.updateStatsOnSongDelete = onDocumentUpdated('songs/{songId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Check if song was soft-deleted (isVisible changed to false)
  if (before.isVisible !== false && after.isVisible === false) {
    try {
      const statsRef = admin.firestore().collection('platformStats').doc('global');
      await statsRef.update({
        totalSongs: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Platform stats updated: song deleted');
    } catch (error) {
      console.error('Error updating stats on song delete:', error);
    }
  }
});

/**
 * Auto-update platformStats when albums are created or deleted
 */
exports.updateStatsOnAlbumCreate = onDocumentCreated('albums/{albumId}', async (event) => {
  try {
    const statsRef = admin.firestore().collection('platformStats').doc('global');
    await statsRef.update({
      totalAlbums: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Platform stats updated: album created');
  } catch (error) {
    console.error('Error updating stats on album create:', error);
  }
});

exports.updateStatsOnAlbumDelete = onDocumentUpdated('albums/{albumId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Check if album was soft-deleted (isVisible changed to false)
  if (before.isVisible !== false && after.isVisible === false) {
    try {
      const statsRef = admin.firestore().collection('platformStats').doc('global');
      await statsRef.update({
        totalAlbums: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Platform stats updated: album deleted');
    } catch (error) {
      console.error('Error updating stats on album delete:', error);
    }
  }
});

/**
 * Auto-update platformStats when artists are created
 */
exports.updateStatsOnArtistCreate = onDocumentCreated('artists/{artistId}', async (event) => {
  try {
    const statsRef = admin.firestore().collection('platformStats').doc('global');
    await statsRef.update({
      totalArtists: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Platform stats updated: artist created');
  } catch (error) {
    console.error('Error updating stats on artist create:', error);
  }
});

/**
 * Auto-update platformStats when users are created
 */
exports.updateStatsOnUserCreate = onDocumentCreated('users/{userId}', async (event) => {
  try {
    const statsRef = admin.firestore().collection('platformStats').doc('global');
    await statsRef.update({
      totalUsers: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Platform stats updated: user created');
  } catch (error) {
    console.error('Error updating stats on user create:', error);
  }
});

/**
 * Auto-update platformStats when playlists are created
 */
exports.updateStatsOnPlaylistCreate = onDocumentCreated('playlists/{playlistId}', async (event) => {
  try {
    const statsRef = admin.firestore().collection('platformStats').doc('global');
    await statsRef.update({
      totalPlaylists: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Platform stats updated: playlist created');
  } catch (error) {
    console.error('Error updating stats on playlist create:', error);
  }
});

// ========================================
// SEO - XML SITEMAP GENERATION
// ========================================
/**
 * Generates XML sitemap for all songs, artists, playlists, and albums
 * Part of 2026 Hybrid Marketing Strategy (SEO Enhancement)
 *
 * Usage: Call this function on schedule or manually to regenerate sitemap
 * The sitemap is stored in Firestore and served via a public endpoint
 */
exports.generateSitemap = onCall(async (request) => {
  try {
    console.log('Generating XML sitemap...');

    const baseUrl = 'https://beatflowmedia.com'; // TODO: Replace with actual domain
    const now = new Date().toISOString();

    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Browse Page -->
  <url>
    <loc>${baseUrl}/browse</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Playlists Page -->
  <url>
    <loc>${baseUrl}/playlists</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Albums Page -->
  <url>
    <loc>${baseUrl}/albums</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

    // Fetch all public songs
    const songsSnapshot = await admin.firestore()
      .collection('songs')
      .where('isPublic', '==', true)
      .limit(5000) // Sitemap limit per file
      .get();

    console.log(`Found ${songsSnapshot.size} public songs`);

    songsSnapshot.forEach((doc) => {
      const song = doc.data();
      const songUrl = `${baseUrl}/song/${doc.id}`;
      const lastmod = song.updatedAt ? song.updatedAt.toDate().toISOString() : now;

      sitemapXml += `
  <!-- Song: ${song.title || 'Untitled'} -->
  <url>
    <loc>${songUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    // Fetch all artists (from songs to get unique artists)
    const artistsMap = new Map();
    songsSnapshot.forEach((doc) => {
      const song = doc.data();
      if (song.artistId && song.artistName) {
        artistsMap.set(song.artistId, {
          name: song.artistName,
          updatedAt: song.updatedAt
        });
      }
    });

    console.log(`Found ${artistsMap.size} unique artists`);

    artistsMap.forEach((artist, artistId) => {
      const artistUrl = `${baseUrl}/artist/${encodeURIComponent(artistId)}`;
      const lastmod = artist.updatedAt ? artist.updatedAt.toDate().toISOString() : now;

      sitemapXml += `
  <!-- Artist: ${artist.name} -->
  <url>
    <loc>${artistUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    // Fetch all public playlists
    const playlistsSnapshot = await admin.firestore()
      .collection('playlists')
      .where('isPublic', '==', true)
      .limit(1000)
      .get();

    console.log(`Found ${playlistsSnapshot.size} public playlists`);

    playlistsSnapshot.forEach((doc) => {
      const playlist = doc.data();
      const playlistUrl = `${baseUrl}/playlist/${doc.id}`;
      const lastmod = playlist.updatedAt ? playlist.updatedAt.toDate().toISOString() : now;

      sitemapXml += `
  <!-- Playlist: ${playlist.name || 'Untitled'} -->
  <url>
    <loc>${playlistUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    });

    // Fetch all public albums
    const albumsSnapshot = await admin.firestore()
      .collection('albums')
      .where('isPublic', '==', true)
      .limit(1000)
      .get();

    console.log(`Found ${albumsSnapshot.size} public albums`);

    albumsSnapshot.forEach((doc) => {
      const album = doc.data();
      const albumUrl = `${baseUrl}/album/${doc.id}`;
      const lastmod = album.updatedAt ? album.updatedAt.toDate().toISOString() : now;

      sitemapXml += `
  <!-- Album: ${album.title || 'Untitled'} -->
  <url>
    <loc>${albumUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    });

    // Close the sitemap
    sitemapXml += `</urlset>`;

    // Store sitemap in Firestore for easy retrieval
    await admin.firestore()
      .collection('seo')
      .doc('sitemap')
      .set({
        xml: sitemapXml,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        urlCount: songsSnapshot.size + artistsMap.size + playlistsSnapshot.size + albumsSnapshot.size + 4
      });

    console.log('Sitemap generated and stored successfully');

    return {
      success: true,
      urlCount: songsSnapshot.size + artistsMap.size + playlistsSnapshot.size + albumsSnapshot.size + 4,
      message: 'Sitemap generated successfully'
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw new Error(`Failed to generate sitemap: ${error.message}`);
  }
});
