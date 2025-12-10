# Firestore Security Rules Update

You need to add permissions for the `advertisements` collection in your Firebase Firestore security rules.

## TEMPORARY: To Seed Default Ads

**Step 1:** Temporarily allow all writes to seed the database:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **beatflowmedia**
3. Go to **Firestore Database** → **Rules** tab
4. Add this TEMPORARY rule:

```javascript
match /advertisements/{adId} {
  allow read: if true;
  allow write: if true; // TEMPORARY - for seeding only
}
```

5. Click **Publish**
6. Wait for me to confirm the seed script ran successfully
7. Then follow Step 2 below to restore secure rules

## Step 2: Restore Secure Rules (After Seeding)

After seeding is complete, update to these secure rules:

```javascript
// Add this to your existing rules
match /advertisements/{adId} {
  // Allow anyone to read active advertisements
  allow read: if true;

  // Allow authenticated users to create/update/delete ads
  // You can make this more restrictive (admin only) if needed
  allow write: if request.auth != null;
}
```

## Full Example (if starting fresh):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Existing rules for songs, playlists, users, etc.
    // ... keep your existing rules here ...

    // NEW: Advertisement rules
    match /advertisements/{adId} {
      // Allow anyone to read advertisements (for display)
      allow read: if true;

      // Only authenticated users can create/update/delete
      // For production, you might want to restrict to admin only
      allow write: if request.auth != null;
    }

  }
}
```

## More Restrictive Option (Admin Only):

If you want only specific users to manage ads:

```javascript
match /advertisements/{adId} {
  allow read: if true;

  // Only allow admin users (you'll need to set a custom claim)
  allow write: if request.auth != null &&
                 request.auth.token.admin == true;
}
```

After updating the rules, click **Publish** in the Firebase Console.

The error "Missing or insufficient permissions" will be resolved once you add these rules.
