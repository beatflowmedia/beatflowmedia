// src/services/marketingService.js
// Firestore CRUD operations for marketing content
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

class MarketingService {
  constructor() {
    this.collectionsRef = {
      landingPages: collection(db, 'marketing_content'),
      blogPosts: collection(db, 'blog_posts'),
      socialCampaigns: collection(db, 'social_media_posts')
    };
  }

  // ==================== LANDING PAGES ====================

  /**
   * Create a new landing page
   */
  async createLandingPage(pageData) {
    try {
      const docRef = await addDoc(this.collectionsRef.landingPages, {
        ...pageData,
        type: 'landing-page',
        status: 'draft',
        views: 0,
        conversions: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { id: docRef.id, ...pageData };
    } catch (error) {
      console.error('Error creating landing page:', error);
      throw error;
    }
  }

  /**
   * Get all landing pages
   */
  async getLandingPages(filters = {}) {
    try {
      let q = query(
        this.collectionsRef.landingPages,
        where('type', '==', 'landing-page')
      );

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.segment) {
        q = query(q, where('segment', '==', filters.segment));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching landing pages:', error);
      throw error;
    }
  }

  /**
   * Get single landing page by ID
   */
  async getLandingPage(pageId) {
    try {
      const docRef = doc(this.collectionsRef.landingPages, pageId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Landing page not found');
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error fetching landing page:', error);
      throw error;
    }
  }

  /**
   * Update landing page
   */
  async updateLandingPage(pageId, updates) {
    try {
      const docRef = doc(this.collectionsRef.landingPages, pageId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { id: pageId, ...updates };
    } catch (error) {
      console.error('Error updating landing page:', error);
      throw error;
    }
  }

  /**
   * Publish landing page
   */
  async publishLandingPage(pageId) {
    return this.updateLandingPage(pageId, {
      status: 'published',
      publishedAt: serverTimestamp()
    });
  }

  /**
   * Unpublish landing page
   */
  async unpublishLandingPage(pageId) {
    return this.updateLandingPage(pageId, {
      status: 'draft',
      publishedAt: null
    });
  }

  /**
   * Delete landing page
   */
  async deleteLandingPage(pageId) {
    try {
      const docRef = doc(this.collectionsRef.landingPages, pageId);
      await deleteDoc(docRef);
      return { success: true, id: pageId };
    } catch (error) {
      console.error('Error deleting landing page:', error);
      throw error;
    }
  }

  /**
   * Track landing page view
   */
  async trackLandingPageView(pageId) {
    try {
      const docRef = doc(this.collectionsRef.landingPages, pageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentViews = docSnap.data().views || 0;
        await updateDoc(docRef, {
          views: currentViews + 1
        });
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  /**
   * Track landing page conversion
   */
  async trackLandingPageConversion(pageId) {
    try {
      const docRef = doc(this.collectionsRef.landingPages, pageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentConversions = docSnap.data().conversions || 0;
        await updateDoc(docRef, {
          conversions: currentConversions + 1
        });
      }
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  // ==================== BLOG POSTS ====================

  /**
   * Create a new blog post
   */
  async createBlogPost(postData) {
    try {
      const docRef = await addDoc(this.collectionsRef.blogPosts, {
        ...postData,
        status: 'draft',
        views: 0,
        shares: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { id: docRef.id, ...postData };
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  }

  /**
   * Get all blog posts
   */
  async getBlogPosts(filters = {}) {
    try {
      let q = query(this.collectionsRef.blogPosts);

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }
  }

  /**
   * Get single blog post by ID
   */
  async getBlogPost(postId) {
    try {
      const docRef = doc(this.collectionsRef.blogPosts, postId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Blog post not found');
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error fetching blog post:', error);
      throw error;
    }
  }

  /**
   * Get blog post by slug
   */
  async getBlogPostBySlug(slug) {
    try {
      const q = query(
        this.collectionsRef.blogPosts,
        where('slug', '==', slug),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Blog post not found');
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      throw error;
    }
  }

  /**
   * Update blog post
   */
  async updateBlogPost(postId, updates) {
    try {
      const docRef = doc(this.collectionsRef.blogPosts, postId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { id: postId, ...updates };
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  }

  /**
   * Publish blog post
   */
  async publishBlogPost(postId) {
    return this.updateBlogPost(postId, {
      status: 'published',
      publishedAt: serverTimestamp()
    });
  }

  /**
   * Unpublish blog post
   */
  async unpublishBlogPost(postId) {
    return this.updateBlogPost(postId, {
      status: 'draft',
      publishedAt: null
    });
  }

  /**
   * Delete blog post
   */
  async deleteBlogPost(postId) {
    try {
      const docRef = doc(this.collectionsRef.blogPosts, postId);
      await deleteDoc(docRef);
      return { success: true, id: postId };
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  }

  /**
   * Track blog post view
   */
  async trackBlogPostView(postId) {
    try {
      const docRef = doc(this.collectionsRef.blogPosts, postId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentViews = docSnap.data().views || 0;
        await updateDoc(docRef, {
          views: currentViews + 1
        });
      }
    } catch (error) {
      console.error('Error tracking blog view:', error);
    }
  }

  /**
   * Track blog post share
   */
  async trackBlogPostShare(postId) {
    try {
      const docRef = doc(this.collectionsRef.blogPosts, postId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentShares = docSnap.data().shares || 0;
        await updateDoc(docRef, {
          shares: currentShares + 1
        });
      }
    } catch (error) {
      console.error('Error tracking blog share:', error);
    }
  }

  // ==================== SOCIAL MEDIA CAMPAIGNS ====================

  /**
   * Create a new social media campaign
   */
  async createSocialCampaign(campaignData) {
    try {
      const docRef = await addDoc(this.collectionsRef.socialCampaigns, {
        ...campaignData,
        status: 'draft',
        impressions: 0,
        clicks: 0,
        shares: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { id: docRef.id, ...campaignData };
    } catch (error) {
      console.error('Error creating social campaign:', error);
      throw error;
    }
  }

  /**
   * Get all social campaigns
   */
  async getSocialCampaigns(filters = {}) {
    try {
      let q = query(this.collectionsRef.socialCampaigns);

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.segment) {
        q = query(q, where('targetSegment', '==', filters.segment));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching social campaigns:', error);
      throw error;
    }
  }

  /**
   * Get single social campaign by ID
   */
  async getSocialCampaign(campaignId) {
    try {
      const docRef = doc(this.collectionsRef.socialCampaigns, campaignId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Social campaign not found');
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error fetching social campaign:', error);
      throw error;
    }
  }

  /**
   * Update social campaign
   */
  async updateSocialCampaign(campaignId, updates) {
    try {
      const docRef = doc(this.collectionsRef.socialCampaigns, campaignId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { id: campaignId, ...updates };
    } catch (error) {
      console.error('Error updating social campaign:', error);
      throw error;
    }
  }

  /**
   * Publish social campaign
   */
  async publishSocialCampaign(campaignId) {
    return this.updateSocialCampaign(campaignId, {
      status: 'published',
      publishedAt: serverTimestamp()
    });
  }

  /**
   * Delete social campaign
   */
  async deleteSocialCampaign(campaignId) {
    try {
      const docRef = doc(this.collectionsRef.socialCampaigns, campaignId);
      await deleteDoc(docRef);
      return { success: true, id: campaignId };
    } catch (error) {
      console.error('Error deleting social campaign:', error);
      throw error;
    }
  }

  /**
   * Track social campaign metrics
   */
  async trackSocialCampaignMetric(campaignId, metricType) {
    try {
      const docRef = doc(this.collectionsRef.socialCampaigns, campaignId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentValue = docSnap.data()[metricType] || 0;
        await updateDoc(docRef, {
          [metricType]: currentValue + 1
        });
      }
    } catch (error) {
      console.error(`Error tracking ${metricType}:`, error);
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get marketing dashboard stats
   */
  async getMarketingStats() {
    try {
      const [landingPages, blogPosts, socialCampaigns] = await Promise.all([
        this.getLandingPages(),
        this.getBlogPosts(),
        this.getSocialCampaigns()
      ]);

      return {
        landingPages: {
          total: landingPages.length,
          published: landingPages.filter(p => p.status === 'published').length,
          totalViews: landingPages.reduce((sum, p) => sum + (p.views || 0), 0),
          totalConversions: landingPages.reduce((sum, p) => sum + (p.conversions || 0), 0)
        },
        blogPosts: {
          total: blogPosts.length,
          published: blogPosts.filter(p => p.status === 'published').length,
          totalViews: blogPosts.reduce((sum, p) => sum + (p.views || 0), 0),
          totalShares: blogPosts.reduce((sum, p) => sum + (p.shares || 0), 0)
        },
        socialCampaigns: {
          total: socialCampaigns.length,
          published: socialCampaigns.filter(c => c.status === 'published').length,
          totalImpressions: socialCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0),
          totalClicks: socialCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0)
        },
        totalImages: socialCampaigns.length * 3 // 3 aspect ratios per campaign
      };
    } catch (error) {
      console.error('Error fetching marketing stats:', error);
      throw error;
    }
  }

  /**
   * Get top performing content
   */
  async getTopPerformingContent(contentType = 'landing-page', metric = 'views', limitCount = 10) {
    try {
      let collectionRef;

      if (contentType === 'landing-page') {
        collectionRef = this.collectionsRef.landingPages;
      } else if (contentType === 'blog') {
        collectionRef = this.collectionsRef.blogPosts;
      } else if (contentType === 'social') {
        collectionRef = this.collectionsRef.socialCampaigns;
      }

      const q = query(
        collectionRef,
        where('status', '==', 'published'),
        orderBy(metric, 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching top performing content:', error);
      throw error;
    }
  }
}

const marketingServiceInstance = new MarketingService();
export default marketingServiceInstance;
