# DRM Implementation Guide

## Overview

This guide provides comprehensive documentation for implementing Digital Rights Management (DRM) in the music license application using Encrypted Media Extensions (EME) with multi-DRM support.

## Architecture Overview

### Core Components

1. **DrmEngine** (`src/engine/DrmEngine.js`)
   - Main DRM management class
   - Handles license acquisition and key management
   - Supports Widevine, PlayReady, and FairPlay

2. **EnhancedMseEngine** (`src/engine/EnhancedMseEngine.js`)
   - Extended MSE engine with DRM capabilities
   - Maintains backward compatibility with unencrypted content
   - Integrates seamlessly with existing PlayerContext

3. **DrmProviders** (`src/engine/DrmProviders.js`)
   - Multi-provider support for different license servers
   - Built-in support for BuyDRM, Irdeto, Verimatrix
   - Custom provider extensibility

4. **DrmCompatibility** (`src/engine/DrmCompatibility.js`)
   - Browser compatibility detection
   - Fallback strategy management
   - User-friendly error messaging

## Browser Compatibility Matrix

| Browser | Widevine | PlayReady | FairPlay | Notes |
|---------|----------|-----------|----------|-------|
| Chrome 35+ | ✅ | ❌ | ❌ | Hardware decoding, persistent licenses |
| Firefox 47+ | ✅ | ❌ | ❌ | Software only, user consent required |
| Safari 9+ | ❌ | ❌ | ✅ | HLS only, certificate required |
| Edge (Legacy) | ❌ | ✅ | ❌ | Full PlayReady support |
| Edge (Chromium) | ✅ | ⚠️ | ❌ | Widevine preferred |

### Security Levels

- **Widevine L1**: Hardware-backed security (Android devices)
- **Widevine L3**: Software security (fallback)
- **PlayReady SL3000**: Highest security level
- **FairPlay**: Hardware security on Apple devices

## Implementation Steps

### 1. Basic DRM Setup

```javascript
import { DrmPlayerManager } from './src/engine/DrmIntegrationExample';

// Create player instance
const audioElement = document.getElementById('audio-player');
const player = new DrmPlayerManager(audioElement, {
  debug: true,
  enableFallback: true
});

// Configure DRM providers
const drmConfig = {
  providers: [
    {
      type: 'buydrm',
      config: {
        licenseServerUrl: 'https://license.buydrm.com/widevine',
        customerId: 'your-customer-id',
        authToken: 'your-auth-token'
      }
    }
  ]
};

// Initialize
await player.initialize(drmConfig);
```

### 2. Loading Protected Content

```javascript
const protectedTrack = {
  id: 'track-123',
  title: 'Protected Song',
  encrypted: true,
  streamUrl: '/protected/track-123.encrypted',
  fallbackUrl: '/clear/track-123.clear',
  drmInfo: {
    supportedSystems: ['com.widevine.alpha'],
    contentId: 'track-123',
    licenseServerUrl: 'https://license.example.com/widevine'
  }
};

const strategy = await player.loadTrack(protectedTrack);
console.log('Playback strategy:', strategy);
```

### 3. Integration with PlayerContext

Update `PlayerContext.js` to use the enhanced engine:

```javascript
// In PlayerContext.js
import DrmPlayerManager from '../engine/DrmIntegrationExample';

// Replace engine initialization
const drmManager = new DrmPlayerManager(audioRef.current, {
  debug: process.env.NODE_ENV === 'development',
  enableFallback: true,
  onError: handlePlaybackError,
  onDrmError: handleDrmError
});

// Initialize with DRM configuration
useEffect(() => {
  if (drmConfig) {
    drmManager.initialize(drmConfig);
  }
}, [drmConfig]);
```

## Content Preparation

### 1. Encryption Formats

#### For Widevine/PlayReady (DASH/CENC)
```bash
# Package content with Shaka Packager
packager \
  in=input.mp4,stream=audio,output=encrypted_audio.mp4 \
  --enable_widevine_encryption \
  --key_server_url=https://license.widevine.com \
  --content_id=track-123 \
  --signer=widevine_test \
  --aes_signing_key=your-aes-key \
  --aes_signing_iv=your-aes-iv
```

#### For FairPlay (HLS)
```bash
# Package content for FairPlay
packager \
  in=input.mp4,stream=audio,output=fairplay_audio.m4a \
  --enable_fairplay_encryption \
  --fairplay_key_uri=skd://your-key-uri \
  --fairplay_key_id=your-key-id \
  --fairplay_key=your-content-key \
  --fairplay_iv=your-iv
```

### 2. Segment Structure

Encrypted content should follow this structure:
```
/protected/
  ├── track-123.encrypted.init          # Initialization segment
  ├── track-123.encrypted.0.m4s         # Media segment 0
  ├── track-123.encrypted.1.m4s         # Media segment 1
  └── ...
```

## License Server Integration

### 1. BuyDRM KeyOS

```javascript
const buyDrmConfig = {
  type: 'buydrm',
  config: {
    licenseServerUrl: 'https://license.buydrm.com/widevine',
    customerId: 'your-customer-id',
    merchantId: 'your-merchant-id',
    authToken: 'your-auth-token'
  }
};
```

### 2. Irdeto Control

```javascript
const irdetoConfig = {
  type: 'irdeto',
  config: {
    licenseServerUrl: 'https://license.irdeto.com/v1/license',
    accountId: 'your-account-id',
    sessionToken: 'your-session-token'
  }
};
```

### 3. Custom License Server

```javascript
const customConfig = {
  type: 'custom',
  config: {
    name: 'My Custom DRM',
    licenseServerUrl: 'https://my-license-server.com/license',
    authToken: 'custom-token',
    requestFormatter: (request, drmSystem, metadata, provider) => ({
      url: provider.licenseServerUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.authToken}`
      },
      body: JSON.stringify({
        license_request: Array.from(new Uint8Array(request)),
        content_id: metadata.contentId,
        user_id: metadata.userId
      })
    }),
    responseProcessor: (response, drmSystem) => {
      const data = JSON.parse(response);
      return new Uint8Array(data.license).buffer;
    }
  }
};
```

## Error Handling

### Common DRM Errors

1. **License Request Failed**
   ```javascript
   {
     code: 'LICENSE_REQUEST_FAILED',
     message: 'Failed to acquire license from server',
     details: { httpStatus: 403, serverMessage: 'Unauthorized' }
   }
   ```

2. **Key Status Error**
   ```javascript
   {
     code: 'KEY_STATUS_ERROR',
     message: 'DRM keys expired or invalid',
     keyStatus: 'expired'
   }
   ```

3. **Unsupported DRM System**
   ```javascript
   {
     code: 'DRM_NOT_SUPPORTED',
     message: 'No compatible DRM system found',
     supportedSystems: []
   }
   ```

### Fallback Strategies

1. **Graceful Degradation**: Fallback to unencrypted content
2. **Browser Upgrade**: Prompt user to upgrade browser
3. **Alternative DRM**: Try different DRM system
4. **Server-side Protection**: Use token-based access control

## Security Considerations

### 1. Content Protection Best Practices

- Use highest available security level (Widevine L1, PlayReady SL3000)
- Implement certificate pinning for license servers
- Rotate encryption keys regularly
- Monitor for license abuse and implement rate limiting

### 2. Key Management

- Store keys securely in hardware security modules
- Implement key expiration and renewal
- Use unique keys per content item
- Audit key access and usage

### 3. License Server Security

- Implement robust authentication and authorization
- Use HTTPS with certificate validation
- Implement request signing and verification
- Monitor for suspicious license requests

## Testing

### 1. Browser Compatibility Testing

```javascript
import { DrmCompatibilityChecker } from './src/engine/DrmCompatibility';

const checker = new DrmCompatibilityChecker();
const report = checker.getCompatibilityReport();

console.log('Browser:', report.browser);
console.log('EME Support:', report.eme.supported);
console.log('DRM Systems:', report.drmSystems);
console.log('Recommendations:', report.recommendations);
```

### 2. License Server Testing

```javascript
// Test license acquisition
const testTrack = {
  encrypted: true,
  drmInfo: {
    contentId: 'test-content',
    licenseServerUrl: 'https://license.example.com/test'
  }
};

try {
  const strategy = await player.loadTrack(testTrack);
  console.log('License test passed:', strategy);
} catch (error) {
  console.error('License test failed:', error);
}
```

### 3. Fallback Testing

```javascript
// Test fallback behavior
const player = new DrmPlayerManager(audioElement, {
  enableFallback: true,
  onFallback: (event) => {
    console.log('Fallback triggered:', event.type);
  }
});

// Load protected content that will trigger fallback
await player.loadTrack(problematicTrack);
```

## Production Deployment

### 1. Environment Configuration

```javascript
// Production DRM configuration
const productionDrmConfig = {
  providers: [
    {
      type: 'buydrm',
      config: {
        licenseServerUrl: process.env.REACT_APP_BUYDRM_LICENSE_URL,
        customerId: process.env.REACT_APP_BUYDRM_CUSTOMER_ID,
        authToken: process.env.REACT_APP_BUYDRM_AUTH_TOKEN
      }
    }
  ]
};
```

### 2. Content Delivery Network (CDN)

- Use CDN with DRM support (AWS CloudFront, Akamai)
- Configure proper CORS headers for license requests
- Implement geographic restrictions if required
- Monitor CDN performance and DRM license success rates

### 3. Monitoring and Analytics

```javascript
// Track DRM events
const drmAnalytics = {
  trackLicenseRequest: (contentId, drmSystem) => {
    analytics.track('drm_license_request', {
      content_id: contentId,
      drm_system: drmSystem,
      timestamp: Date.now()
    });
  },

  trackPlaybackStart: (contentId, strategy) => {
    analytics.track('drm_playback_start', {
      content_id: contentId,
      strategy: strategy.type,
      drm_system: strategy.drmSystem
    });
  },

  trackError: (error, contentId) => {
    analytics.track('drm_error', {
      error_code: error.code,
      error_message: error.message,
      content_id: contentId
    });
  }
};
```

## Troubleshooting

### Common Issues

1. **"EME not supported"**
   - Check browser version and EME support
   - Verify HTTPS is being used
   - Check for browser extensions blocking DRM

2. **License request fails**
   - Verify license server URL and credentials
   - Check CORS configuration
   - Validate request format and headers

3. **Playback starts but stops immediately**
   - Check key status and expiration
   - Verify content encryption matches license
   - Check for HDCP compliance issues

4. **FairPlay not working in Safari**
   - Ensure content is delivered via HLS
   - Verify server certificate is properly set
   - Check FairPlay specific license format

### Debug Tools

```javascript
// Enable debug logging
const debugPlayer = new DrmPlayerManager(audioElement, {
  debug: true,
  onError: console.error,
  onDrmError: console.error
});

// Get detailed status
console.log('Player Status:', debugPlayer.getStatus());

// Check DRM capabilities
const capabilities = await DrmEngine.getBrowserCapabilities();
console.log('DRM Capabilities:', capabilities);
```

## Performance Optimization

### 1. License Caching

- Cache licenses for offline playback
- Implement license pre-fetching for smooth playback
- Use persistent sessions where supported

### 2. Content Optimization

- Use appropriate bitrates for different security levels
- Implement adaptive streaming with DRM
- Optimize segment sizes for mobile networks

### 3. Network Optimization

- Implement license request retries with exponential backoff
- Use CDN edge locations for license servers
- Minimize license request round trips

## Conclusion

This DRM implementation provides production-grade content protection while maintaining compatibility across modern browsers. The modular design allows for easy extension and customization while providing robust fallback mechanisms for unsupported environments.

For additional support or questions, refer to the individual component documentation or contact the development team.