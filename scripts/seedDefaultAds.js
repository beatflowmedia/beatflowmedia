// Script to seed default advertisements
// Run with: node scripts/seedDefaultAds.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoXc1YonnH1uW3P4OlAO6eAi911DdyHgs",
  authDomain: "beatflowmedia.firebaseapp.com",
  projectId: "beatflowmedia",
  storageBucket: "beatflowmedia.firebasestorage.app",
  messagingSenderId: "770153949772",
  appId: "1:770153949772:web:0034a30777827ae7dce2e9",
  measurementId: "G-11SMJF5YQR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const defaultAds = [
  {
    title: "🎵 Curated Music Library",
    description: "Discover thousands of handpicked tracks from talented artists worldwide. Find the perfect sound for every mood.",
    imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=711&fit=crop",
    ctaText: "Explore Music",
    ctaLink: "/browse",
    isActive: true,
    priority: 10,
    type: "promotional",
    displayLocations: ["mini_player", "homepage"],
    frequency: 5,
    duration: 10
  },
  {
    title: "📜 Sync Licensing Made Easy",
    description: "License high-quality music for your films, ads, games, and content. Simple, transparent, and fast.",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=711&fit=crop",
    ctaText: "Learn More",
    ctaLink: "/browse",
    isActive: true,
    priority: 9,
    type: "homepage_feature",
    displayLocations: ["mini_player", "homepage"],
    frequency: 5,
    duration: 10
  },
  {
    title: "🎨 For Artists",
    description: "Showcase your talent and earn from your music. Join our community of creators and reach new audiences.",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=711&fit=crop",
    ctaText: "Join Now",
    ctaLink: "/for-artists",
    isActive: true,
    priority: 8,
    type: "promotional",
    displayLocations: ["mini_player", "commercial_break"],
    frequency: 7,
    duration: 12
  },
  {
    title: "🎧 Premium Sound Quality",
    description: "Experience music the way it was meant to be heard. Crystal clear, high-fidelity audio streaming.",
    imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=711&fit=crop",
    ctaText: "Upgrade Now",
    ctaLink: "/explore-premium",
    isActive: true,
    priority: 7,
    type: "commercial_break",
    displayLocations: ["commercial_break"],
    frequency: 5,
    duration: 10
  },
  {
    title: "🎼 Curator Portal",
    description: "Help artists grow by curating and promoting amazing music. Earn rewards for discovering talent.",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=711&fit=crop",
    ctaText: "Become a Curator",
    ctaLink: "/curator-portal",
    isActive: true,
    priority: 6,
    type: "promotional",
    displayLocations: ["mini_player"],
    frequency: 5,
    duration: 10
  },
  {
    title: "💼 Music for Business",
    description: "Elevate your brand with the perfect soundtrack. Flexible licensing for businesses of all sizes.",
    imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&h=711&fit=crop",
    ctaText: "Get Started",
    ctaLink: "/browse",
    isActive: true,
    priority: 5,
    type: "homepage_feature",
    displayLocations: ["homepage", "mini_player"],
    frequency: 5,
    duration: 10
  },
  {
    title: "🌟 New Releases Weekly",
    description: "Stay ahead of the curve with fresh tracks added every week. Never miss the next big hit.",
    imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=711&fit=crop",
    ctaText: "See What's New",
    ctaLink: "/whats-new",
    isActive: true,
    priority: 4,
    type: "promotional",
    displayLocations: ["mini_player", "commercial_break"],
    frequency: 6,
    duration: 8
  },
  {
    title: "🎬 Perfect for Content Creators",
    description: "Find royalty-free music for YouTube, TikTok, podcasts, and more. Create without limits.",
    imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=711&fit=crop",
    ctaText: "Browse Tracks",
    ctaLink: "/browse",
    isActive: true,
    priority: 3,
    type: "commercial_break",
    displayLocations: ["commercial_break", "mini_player"],
    frequency: 5,
    duration: 10
  }
];

async function seedAds() {
  console.log("🌱 Starting to seed default advertisements...");

  try {
    for (const ad of defaultAds) {
      const docRef = await addDoc(collection(db, "advertisements"), {
        ...ad,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Created ad: "${ad.title}" (ID: ${docRef.id})`);
    }

    console.log(`\n🎉 Successfully seeded ${defaultAds.length} advertisements!`);
    console.log("\nYou can view them at: http://localhost:3000/ads");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding advertisements:", error);
    process.exit(1);
  }
}

seedAds();
