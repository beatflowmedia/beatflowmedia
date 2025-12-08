# 🚀 BeatFlow Agents - Deployment Guide

Complete guide for deploying the BeatFlow Agentic Suite to production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Netlify Functions Setup](#netlify-functions-setup)
6. [Firebase/Firestore Configuration](#firebasefirestore-configuration)
7. [Monitoring & Observability](#monitoring--observability)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

---

## Prerequisites

### Required Software

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Git**: Latest version
- **Firebase CLI**: `npm install -g firebase-tools`
- **Netlify CLI** (optional): `npm install -g netlify-cli`

### Required Accounts & Services

- Firebase project with Firestore enabled
- Netlify account (for serverless functions)
- GitHub account (for CI/CD)
- Optional: Grafana Cloud or Datadog for monitoring

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/BeatFlowMedia/music-license-app.git
cd music-license-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env` file in the project root:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin SDK (for agents)
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/serviceAccountKey.json

# Agent Configuration
AGENT_REPORTS_DIR=./agents/reports
AGENT_LOG_LEVEL=info

# Netlify Functions
NETLIFY_FUNCTIONS_PORT=9999

# Optional: External Services
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 4. Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json` in project root (DO NOT commit!)
4. Add to `.gitignore`:

```gitignore
serviceAccountKey.json
.env
.env.local
```

---

## Local Development

### Start Development Server

```bash
npm start
```

The app will run at `http://localhost:3000`.

### Run Agents Locally

#### Test Individual Agents

```bash
# Content Ingestion
npm run agents:ingest -- --file ./path/to/audio.mp3 --title "Track Title"

# Analytics
npm run agents:analytics

# Recommendations
npm run agents:recommend -- --user-id user123 --limit 10

# Moderation
npm run agents:moderate -- --content-id track456

# Notifications
npm run agents:notify -- --user-id user123 --type update
```

#### Run Agent Tests

```bash
# Run all agent tests
npm test -- agents/tests/

# Run specific test suite
npm test -- agents/tests/analytics.test.js

# Run integration tests
npm test -- agents/tests/integration.test.js
```

### Local Netlify Functions

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start local dev server with functions
netlify dev
```

Functions will be available at `http://localhost:9999/.netlify/functions/`.

---

## Production Deployment

### Option 1: Netlify (Recommended)

#### 1. Connect Repository

1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings:

```
Build command: npm run build
Publish directory: build
```

#### 2. Set Environment Variables

In Netlify dashboard → Site Settings → Environment Variables:

- Add all variables from `.env`
- Set `NODE_ENV=production`
- Add `FIREBASE_SERVICE_ACCOUNT_KEY` as JSON string

#### 3. Deploy

```bash
# Manual deployment
npm run build
netlify deploy --prod

# Or push to main branch for auto-deploy
git push origin main
```

### Option 2: Custom Server

#### 1. Build Application

```bash
npm run build
```

#### 2. Install Production Dependencies

```bash
npm ci --production
```

#### 3. Configure Web Server

**Nginx Example:**

```nginx
server {
    listen 80;
    server_name beatflow.app;

    root /var/www/beatflow/build;
    index index.html;

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy agent API requests
    location /api/agents {
        proxy_pass http://localhost:9999;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static assets caching
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4. Start Agent Services

Create systemd service files for each agent:

**Example: `/etc/systemd/system/beatflow-analytics.service`**

```ini
[Unit]
Description=BeatFlow Analytics Agent
After=network.target

[Service]
Type=simple
User=beatflow
WorkingDirectory=/var/www/beatflow
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node agents/cli.js analytics analyze
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start services:

```bash
sudo systemctl enable beatflow-analytics
sudo systemctl start beatflow-analytics
sudo systemctl status beatflow-analytics
```

---

## Netlify Functions Setup

### Deploy Functions

Functions are automatically deployed with your site. Ensure they're in the correct directory:

```
netlify/functions/
├── api/
│   ├── agents-status.js
│   └── other-endpoints.js
└── analytics/
    └── analytics-export.js
```

### Test Functions

```bash
# Local testing
netlify dev

# Test endpoint
curl http://localhost:9999/.netlify/functions/api/agents-status
```

### Function Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "build"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[functions]
  node_bundler = "esbuild"

[functions."api/*"]
  timeout = 30
```

---

## Firebase/Firestore Configuration

### 1. Initialize Firebase

```bash
firebase login
firebase init
```

Select:
- ✅ Firestore
- ✅ Hosting
- ✅ Storage

### 2. Firestore Security Rules

Update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Analytics events - write-only for agents
    match /analytics_events/{eventId} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if request.auth != null;
    }

    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null &&
                     (request.auth.uid == userId || request.auth.token.admin == true);
      allow write: if request.auth != null && request.auth.uid == userId;

      // User notifications
      match /notifications/{notificationId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if request.auth != null;
      }
    }

    // Content metadata - read for all, write for authenticated
    match /content_metadata/{contentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Recommendations - read only for owner
    match /recommendations/{recommendationId} {
      allow read: if request.auth != null &&
                     resource.data.userId == request.auth.uid;
      allow write: if request.auth != null;
    }

    // Moderation results - admin only
    match /moderation_results/{contentId} {
      allow read, write: if request.auth != null &&
                            request.auth.token.admin == true;
    }

    // Notifications - admin write, user read
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### 3. Firestore Indexes

Update `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "analytics_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "analytics_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "recommendation_interactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "moderation_results",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "decision", "order": "ASCENDING" },
        { "fieldPath": "reviewRequired", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 4. Deploy Firestore Configuration

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. Initialize Firestore Integration in Agents

Update agent initialization to use Firestore:

```javascript
// agents/experts/AnalyticsAgent.js
const FirestoreIntegration = require('../integrations/FirestoreIntegration');

class AnalyticsAgent extends AgentBase {
  constructor(config = {}) {
    super('analytics', config);

    // Initialize Firestore integration
    this.firestore = new FirestoreIntegration({
      firebaseConfig: {
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
      }
    });
  }

  async initialize() {
    await super.initialize();
    await this.firestore.initialize();
  }
}
```

---

## Monitoring & Observability

### 1. Configure Monitoring Dashboard

The monitoring configuration is in `agents/monitoring/dashboard-config.json`.

#### Grafana Setup

1. Install Grafana:

```bash
# Using Docker
docker run -d -p 3001:3000 grafana/grafana
```

2. Add Firebase Data Source
3. Import dashboard from `agents/monitoring/dashboard-config.json`

#### Datadog Setup

1. Install Datadog agent:

```bash
DD_API_KEY=<your_key> bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

2. Configure integration:

```yaml
# /etc/datadog-agent/conf.d/beatflow_agents.yaml
init_config:

instances:
  - min_collection_interval: 60
    url: "https://beatflow.app/.netlify/functions/api/agents-status"
    method: GET
```

### 2. Set Up Alerts

Configure alerts based on thresholds in `dashboard-config.json`:

- Agent error rate > 5%
- No agent activity for > 1 hour
- Firestore read/write errors
- Function timeout errors

### 3. Log Aggregation

**Using CloudWatch (AWS):**

```javascript
// agents/shared/AgentBase.js
const winston = require('winston');
const CloudWatchTransport = require('winston-cloudwatch');

this.logger = winston.createLogger({
  transports: [
    new CloudWatchTransport({
      logGroupName: 'beatflow-agents',
      logStreamName: this.agentName,
      awsRegion: 'us-east-1'
    })
  ]
});
```

**Using Datadog:**

```javascript
const winston = require('winston');
const { DatadogTransport } = require('@datadog/winston');

this.logger = winston.createLogger({
  transports: [
    new DatadogTransport({
      apiKey: process.env.DATADOG_API_KEY,
      service: 'beatflow-agents',
      ddsource: 'nodejs',
      ddtags: `agent:${this.agentName}`
    })
  ]
});
```

---

## CI/CD Pipeline

### GitHub Actions (Already Configured)

The CI/CD pipeline is configured in `.github/workflows/agent-ci.yml`.

#### Workflow Overview

1. **Validate**: Check agent file structure
2. **Test**: Run tests for each agent in parallel
3. **Integration**: Run full integration test suite
4. **Deploy**: Deploy to Netlify on success

#### Customize Workflow

Update `.github/workflows/agent-ci.yml` for your needs:

```yaml
# Add deployment to custom server
- name: Deploy to Production
  if: github.ref == 'refs/heads/main'
  run: |
    npm run build
    scp -r build/ user@server:/var/www/beatflow/
    ssh user@server 'sudo systemctl restart beatflow-agents'
```

### Manual Deployment

```bash
# Run all tests
npm test

# Build production bundle
npm run build

# Deploy to Netlify
netlify deploy --prod

# Or deploy to custom server
rsync -avz build/ user@server:/var/www/beatflow/
```

---

## Troubleshooting

### Agent Not Starting

**Problem**: Agent fails to initialize

**Solutions**:

1. Check environment variables:
```bash
node -e "console.log(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)"
```

2. Verify Firebase credentials:
```bash
firebase projects:list
```

3. Check agent logs:
```bash
tail -f agents/reports/*.log
```

### Firestore Connection Errors

**Problem**: "Permission denied" or connection timeout

**Solutions**:

1. Verify Firestore rules are deployed:
```bash
firebase deploy --only firestore:rules
```

2. Check service account permissions
3. Ensure indexes are created:
```bash
firebase deploy --only firestore:indexes
```

### Netlify Functions Timeout

**Problem**: Functions exceed 10s timeout

**Solutions**:

1. Optimize queries (add indexes)
2. Implement pagination
3. Increase timeout in `netlify.toml`:

```toml
[functions."api/*"]
  timeout = 30
```

### High Memory Usage

**Problem**: Agents consuming too much memory

**Solutions**:

1. Limit batch sizes:
```javascript
// agents/experts/AnalyticsAgent.js
const BATCH_SIZE = 100; // Reduce from 1000
```

2. Implement streaming:
```javascript
const stream = this.firestore.collection('events').stream();
stream.on('data', processEvent);
```

3. Add garbage collection:
```bash
node --max-old-space-size=512 agents/cli.js analytics analyze
```

---

## Security Considerations

### 1. Environment Variables

- **Never commit** `.env` files or service account keys
- Use secrets management: GitHub Secrets, AWS Secrets Manager, etc.
- Rotate credentials regularly

### 2. Firestore Security

- Implement strict security rules (see Firebase section)
- Use Firebase Admin SDK for server-side operations only
- Enable audit logging:

```bash
gcloud firestore operations list --filter="metadata.verb:CREATE OR metadata.verb:UPDATE"
```

### 3. API Security

- Implement rate limiting:

```javascript
// netlify/functions/api/agents-status.js
const rateLimit = require('lambda-rate-limiter')({
  interval: 60000, // 1 minute
  uniqueTokenPerInterval: 500
});

exports.handler = async (event, context) => {
  try {
    await rateLimit.check(10, event.headers['client-ip']);
  } catch (err) {
    return { statusCode: 429, body: 'Rate limit exceeded' };
  }
  // ... rest of handler
};
```

- Add authentication:

```javascript
const verifyToken = async (token) => {
  const admin = require('firebase-admin');
  return await admin.auth().verifyIdToken(token);
};
```

### 4. CORS Configuration

Update `netlify.toml`:

```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://beatflow.app"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
```

### 5. Content Security Policy

Add CSP headers:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com"
```

---

## Performance Optimization

### 1. Function Cold Starts

Minimize cold start times:

```javascript
// Keep Firebase Admin initialized globally
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.handler = async (event, context) => {
  // Use pre-initialized db instance
  const data = await db.collection('events').limit(10).get();
  // ...
};
```

### 2. Caching

Implement caching for frequently accessed data:

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minute TTL

const getAgentStatus = async () => {
  const cached = cache.get('agent-status');
  if (cached) return cached;

  const status = await fetchFromFirestore();
  cache.set('agent-status', status);
  return status;
};
```

### 3. Database Optimization

- Use composite indexes for complex queries
- Implement pagination for large datasets
- Batch writes when possible

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error rates in dashboard
- Check agent execution logs
- Verify Firestore quota usage

**Weekly:**
- Review agent performance metrics
- Clean up old reports: `find agents/reports -mtime +30 -delete`
- Update dependencies: `npm outdated`

**Monthly:**
- Security audit: `npm audit`
- Review and optimize Firestore indexes
- Backup critical data

### Backup Strategy

```bash
# Backup Firestore data
gcloud firestore export gs://beatflow-backups/$(date +%Y-%m-%d)

# Backup configuration
tar -czf config-backup-$(date +%Y-%m-%d).tar.gz \
  .env \
  firebase.json \
  firestore.rules \
  netlify.toml
```

---

## Support & Resources

- **Documentation**: `/agents/API_REFERENCE.md`
- **Examples**: `/agents/examples/USAGE_RECIPES.md`
- **GitHub Issues**: https://github.com/BeatFlowMedia/music-license-app/issues
- **Firebase Docs**: https://firebase.google.com/docs
- **Netlify Docs**: https://docs.netlify.com

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing (`npm test`)
- [ ] Environment variables configured
- [ ] Firebase service account set up
- [ ] Firestore rules deployed
- [ ] Firestore indexes created
- [ ] Netlify site configured
- [ ] Monitoring dashboard set up
- [ ] Alerts configured
- [ ] Security audit completed
- [ ] Backup strategy implemented
- [ ] Documentation updated
- [ ] Team trained on operations

---

**Last Updated**: December 2024
**Version**: 2.1.0
**Maintainer**: BeatFlow Engineering Team
