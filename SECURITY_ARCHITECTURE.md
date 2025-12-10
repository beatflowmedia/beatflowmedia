# BeatflowMedia Security Architecture

## Overview

This document outlines the comprehensive authentication and authorization system implemented for BeatflowMedia, designed to meet enterprise-grade security standards for music industry content protection.

## 🔐 Authentication System

### Multi-Provider OAuth2/OIDC Support

The system supports authentication through multiple providers:

- **Google** - OAuth2 with email and profile scopes
- **Facebook** - OAuth2 with email scope
- **Apple** - Sign in with Apple using OIDC
- **Spotify** - OAuth2 with user profile access
- **Twitter** - OAuth 1.0a authentication
- **GitHub** - OAuth2 with email scope
- **Email/Password** - Traditional authentication with enhanced security

### Enhanced Security Features

#### Multi-Factor Authentication (MFA)
- SMS-based verification using Firebase Phone Auth
- TOTP (Time-based One-Time Password) support
- WebAuthn for biometric authentication
- Recovery codes for account recovery

#### Device Registration and Trust Management
- Automatic device fingerprinting using canvas and browser characteristics
- Device trust levels (trusted, untrusted, blocked)
- Device-specific session management
- Automatic device registration on login

#### Session Management
- JWT-based session tokens with refresh capabilities
- Secure session storage with encryption
- Automatic session cleanup on logout
- Session timeout enforcement

## 🎫 JWT Playback Token System

### Token Architecture

```javascript
{
  // Standard JWT claims
  "iss": "beatflow-auth",
  "aud": "beatflow-streaming",
  "sub": "user-id",
  "iat": 1640995200,
  "exp": 1640995320, // 2-minute TTL

  // Custom claims
  "contentId": "track-123",
  "contentType": "audio",
  "permissions": ["stream:premium"],
  "quality": "high",
  "territoryRestrictions": ["US", "CA"],
  "deviceId": "device-fingerprint",
  "sessionId": "sess_abc123"
}
```

### Token Features

- **Short-lived tokens** (30-120 seconds TTL)
- **Scoped permissions** per asset/playlist
- **Quality restrictions** based on subscription
- **Territorial licensing** enforcement
- **Rate limiting** and abuse prevention
- **Token revocation** and blacklisting
- **Automatic refresh** near expiry

### Security Measures

- HMAC-SHA256 signature verification
- Token blacklisting on revocation
- Unique JTI (JWT ID) for each token
- Device binding for additional security
- Audit logging for all token operations

## 🎯 Entitlement Management System

### Subscription Tiers

#### Free Tier
```javascript
{
  monthlyStreams: 1000,
  quality: "standard",
  skipsPerHour: 6,
  offline: false,
  ads: true,
  permissions: ["stream:free"]
}
```

#### Premium Tier
```javascript
{
  monthlyStreams: "unlimited",
  quality: "high",
  skipsPerHour: "unlimited",
  offline: true,
  ads: false,
  permissions: ["stream:premium", "download"]
}
```

#### Artist Pro Tier
```javascript
{
  monthlyStreams: "unlimited",
  quality: "lossless",
  skipsPerHour: "unlimited",
  offline: true,
  ads: false,
  analytics: true,
  uploadUnlimited: true,
  permissions: ["stream:premium", "upload:content", "analytics:view"]
}
```

### Content Access Control

#### Validation Pipeline
1. **User Authentication** - Verify user identity
2. **Subscription Validation** - Check active subscription
3. **Territorial Restrictions** - Validate geographic access
4. **Licensing Restrictions** - Check content licensing
5. **Usage Limits** - Enforce tier-specific quotas
6. **Quality Access** - Determine maximum quality

#### Licensing Types
- **Sync Licensing** - For video/advertising use
- **Mechanical Rights** - For reproduction
- **Performance Rights** - For public performance
- **Master Rights** - For sound recording use
- **Publishing Rights** - For composition use

### Usage Tracking and Analytics

- Real-time usage monitoring
- Monthly/daily quota enforcement
- Content analytics and metrics
- Billing integration support
- Abuse detection and prevention

## 🛡️ Security Middleware

### Request Authentication
```javascript
// JWT verification
const token = req.headers.authorization?.replace('Bearer ', '');
const decoded = jwt.verify(token, JWT_SECRET);

// User profile validation
const userProfile = await getUserProfile(decoded.sub);
if (!userProfile || userProfile.status !== 'active') {
  throw new UnauthorizedError();
}
```

### Rate Limiting

#### Configuration
- **General API**: 100 requests per 15 minutes
- **Authentication**: 20 attempts per 15 minutes
- **Playback Tokens**: 500 requests per hour
- **Streaming**: 60 requests per minute
- **Uploads**: 10 files per hour

#### Implementation
- Redis-based rate limiting (fallback to memory)
- Progressive rate limiting for repeat offenders
- IP-based and user-based limits
- Exponential backoff for violations

### CORS and CSP Policies

#### CORS Configuration
```javascript
{
  origin: ['https://beatflowmedia.com', 'https://app.beatflowmedia.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
  credentials: true,
  maxAge: 86400
}
```

#### Content Security Policy
```javascript
{
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "https://apis.google.com"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  imgSrc: ["'self'", "data:", "https:", "https://firebasestorage.googleapis.com"],
  mediaSrc: ["'self'", "https://firebasestorage.googleapis.com", "blob:"],
  connectSrc: ["'self'", "https://identitytoolkit.googleapis.com"]
}
```

### Security Headers
- `Strict-Transport-Security`: HSTS enforcement
- `X-Content-Type-Options`: MIME sniffing protection
- `X-Frame-Options`: Clickjacking protection
- `X-XSS-Protection`: XSS filtering
- `Referrer-Policy`: Referrer information control

## 👥 Admin Dashboard

### Security Dashboard Features

#### User Management
- User CRUD operations with audit logging
- Role-based access control (RBAC)
- Bulk user operations with approval workflow
- Password reset and account recovery
- MFA enrollment management

#### Security Monitoring
- Real-time security alerts
- Failed login attempt tracking
- Suspicious activity detection
- IP geolocation monitoring
- Device anomaly detection

#### Token Management
- Active token visualization
- Token revocation capabilities
- Token usage analytics
- Blacklist management
- Token lifecycle monitoring

#### Audit Trail
- Comprehensive audit logging
- Searchable security events
- Export capabilities for compliance
- Real-time event streaming
- Retention policy enforcement

### Access Control Matrix

| Role | User Mgmt | Security | Content | Analytics | Billing |
|------|-----------|----------|---------|-----------|---------|
| Free | ❌ | ❌ | Read | ❌ | ❌ |
| Premium | ❌ | ❌ | Read/Stream | Basic | View |
| Artist | Profile | ❌ | Upload/Manage | Advanced | View |
| Curator | ❌ | ❌ | Moderate | Advanced | ❌ |
| Admin | Full | Full | Full | Full | Full |

## 🔒 Security Best Practices

### GDPR Compliance
- **Data Minimization**: Only collect necessary data
- **Purpose Limitation**: Clear data usage purposes
- **Consent Management**: Granular consent controls
- **Right to Erasure**: Complete data deletion
- **Data Portability**: Export user data
- **Privacy by Design**: Built-in privacy protection

### SOC2 Requirements
- **Security**: Logical and physical access controls
- **Availability**: System uptime and disaster recovery
- **Processing Integrity**: Complete and accurate processing
- **Confidentiality**: Protection of confidential information
- **Privacy**: Collection and processing of personal information

### Content Protection
- **DRM Integration**: Multi-DRM support (Widevine, PlayReady, FairPlay)
- **Watermarking**: Audio fingerprinting for piracy detection
- **Token Binding**: Device-specific content access
- **Geographic Enforcement**: Territory-based restrictions
- **Quality Gates**: Subscription-based quality limits

## 🧪 Testing Strategy

### Unit Tests
- Authentication service functionality
- Entitlement validation logic
- Token generation and verification
- Rate limiting algorithms
- Security helper functions

### Integration Tests
- Complete authentication flows
- Admin dashboard operations
- API endpoint security
- Database access patterns
- External service integrations

### Security Tests
- Penetration testing scenarios
- Input validation testing
- Authentication bypass attempts
- Authorization escalation tests
- Rate limiting effectiveness

### Performance Tests
- Concurrent authentication load
- Token generation performance
- Database query optimization
- Memory usage patterns
- Response time benchmarks

## 📊 Monitoring and Alerting

### Security Metrics
- Failed authentication attempts
- Unusual login patterns
- Token abuse detection
- Geographic anomalies
- Device fingerprint changes

### Performance Metrics
- Authentication response times
- Token generation latency
- Database connection pools
- Memory utilization
- Error rates

### Alert Conditions
- **Critical**: Multiple failed logins from same IP
- **Warning**: Unusual geographic login patterns
- **Info**: New device registrations
- **Error**: Authentication service failures

## 🚀 Deployment and Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_PLAYBACK_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-256-bit-secret
JWT_ALGORITHM=HS256

# Firebase Configuration
FIREBASE_PROJECT_ID=beatflowmedia
FIREBASE_CLIENT_EMAIL=service-account@beatflowmedia.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...

# Rate Limiting
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Security
ALLOWED_ORIGINS=https://beatflowmedia.com,https://app.beatflowmedia.com
HTTPS_ONLY=true
SECURE_COOKIES=true
```

### Production Checklist
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] Audit logging active
- [ ] Monitoring dashboards configured
- [ ] Security headers enforced
- [ ] CORS policies applied
- [ ] Database access restricted
- [ ] Backup procedures tested
- [ ] Incident response plan ready

## 🔄 Maintenance and Updates

### Regular Security Tasks
- **Weekly**: Review audit logs and security alerts
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Security assessment and penetration testing
- **Annually**: Full security architecture review

### Incident Response
1. **Detection**: Automated alerts and monitoring
2. **Assessment**: Severity and impact evaluation
3. **Containment**: Immediate threat mitigation
4. **Investigation**: Root cause analysis
5. **Recovery**: System restoration and validation
6. **Lessons Learned**: Process improvement

## 📞 Support and Contact

For security-related issues or questions:
- **Security Team**: security@beatflowmedia.com
- **Emergency**: +1-555-SECURITY (24/7)
- **Bug Bounty**: hackerone.com/beatflowmedia

---

*This document is maintained by the BeatflowMedia Security Team and is updated quarterly or as needed for security enhancements.*