// scripts/set-user-role.js
// Set user role for development/testing
// Run with: node scripts/set-user-role.js <role>
// Example: node scripts/set-user-role.js artist

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function setUserRole(userId, email, role) {
  console.log(`👤 Setting role for user: ${email}`);
  console.log(`🎭 Role: ${role}\n`);

  try {
    // Get current user document
    const userDoc = await db.collection('users').doc(userId).get();

    if (userDoc.exists) {
      const currentData = userDoc.data();
      console.log('📊 Current user data:');
      console.log(`   Email: ${currentData.email || 'N/A'}`);
      console.log(`   Current Role: ${currentData.role || 'none'}`);
      console.log(`   Display Name: ${currentData.displayName || 'N/A'}`);
      console.log();
    } else {
      console.log('⚠️  User document does not exist, creating new one...\n');
    }

    // Update user role
    await db.collection('users').doc(userId).set({
      email: email,
      role: role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ Role updated successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   New Role: ${role}`);
    console.log();
    console.log('✅ Done! User role has been set.');

  } catch (error) {
    console.error('❌ Error setting role:', error);
    throw error;
  }
}

// Configuration
const userId = 'qOeXglBQj8NMyqk3XI1i9T6fIKK2'; // percyricemusic@gmail.com
const email = 'percyricemusic@gmail.com';
const role = process.argv[2] || 'artist';

// Validate role
const validRoles = ['artist', 'curator', 'investor', 'admin', 'user'];
if (!validRoles.includes(role)) {
  console.error(`❌ Invalid role: ${role}`);
  console.error(`   Valid roles: ${validRoles.join(', ')}`);
  process.exit(1);
}

setUserRole(userId, email, role)
  .then(() => {
    console.log('🎉 Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
