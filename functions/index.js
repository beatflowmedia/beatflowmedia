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
