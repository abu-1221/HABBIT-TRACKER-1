# Privacy Policy for AI-POS

**Last Updated: January 16, 2026**

## Introduction

AI-POS ("we", "our", or "the app") is committed to protecting your privacy. This Privacy Policy explains how we handle your information when you use our productivity tracking application.

## Data Collection and Storage

### What We Collect

- **Email Address**: Used only for account creation and login authentication
- **Password**: Stored as a cryptographic hash, never in plain text
- **Usage Data**: Habits, tasks, focus sessions, and analytics you create within the app

### Where Data is Stored

- **100% Local Storage**: All your data is stored exclusively on YOUR device using browser LocalStorage
- **No Cloud Storage**: We do NOT upload, transmit, or store any of your data on external servers
- **No Third-Party Access**: Your data never leaves your device

## How We Use Your Information

### Account Management

- Email and password are used solely for authentication
- Passwords are hashed using SHA-256 with salt for security
- Session tokens are stored locally for 7-day auto-login

### Productivity Tracking

- Habits, tasks, and analytics are stored locally to provide app functionality
- AI recommendations are generated locally on your device
- No data is analyzed by external services

## Data Security

### Security Measures

- **Password Hashing**: Passwords are never stored in plain text
- **Input Sanitization**: All user inputs are sanitized to prevent XSS attacks
- **Rate Limiting**: Login attempts are limited to prevent brute force attacks
- **Session Management**: Secure session handling with automatic expiration

### User Control

- You have full control over your data
- Delete your account at any time from Settings
- Export your data as JSON for backup
- Clear all data with one click

## Third-Party Services

### No Third-Party Integration

- We do NOT use analytics services (Google Analytics, etc.)
- We do NOT use advertising networks
- We do NOT share data with third parties
- We do NOT track your activity across other websites

### PWA Features

- Service Worker caches app files locally for offline use
- Push notifications are handled by your browser (Google/Apple/Microsoft)
- No data is sent through notification services

## Children's Privacy

AI-POS does not knowingly collect information from children under 13. The app is designed for general audiences interested in productivity tracking.

## Data Retention

- **Account Data**: Stored until you delete your account
- **Session Data**: Expires after 7 days of inactivity
- **Usage Data**: Stored indefinitely on your device until you clear it

## Your Rights

You have the right to:

- **Access**: View all your data within the app
- **Export**: Download your data as JSON
- **Delete**: Remove your account and all associated data
- **Control**: Manage what data you create and maintain

## Changes to Privacy Policy

We may update this Privacy Policy from time to time. We will notify users of significant changes by:

- Updating the "Last Updated" date
- Displaying a notice in the app
- Requiring re-acceptance for major changes

## Contact Us

For privacy-related questions or concerns:

- **Email**: [Your Email Address]
- **GitHub**: [Your GitHub Repository URL]

## Compliance

### GDPR Compliance (EU Users)

- Right to access: ✓ (View in app)
- Right to erasure: ✓ (Delete account)
- Right to data portability: ✓ (Export JSON)
- Right to be forgotten: ✓ (Local storage)

### CCPA Compliance (California Users)

- Right to know: ✓ (This policy)
- Right to delete: ✓ (Delete account)
- Right to opt-out: ✓ (No data collection)

## Technical Details

### Data Format

```javascript
User Data Structure:
{
  "email": "user@example.com",
  "password_hash": "SHA-256 hash",
  "habits": [...],
  "tasks": [...],
  "settings": {...}
}
```

### Storage Location

- Browser: LocalStorage API
- Encryption: Client-side only
- Backup: User-initiated export only

---

**By using AI-POS, you agree to this Privacy Policy.**

**Your privacy is our priority. Your data stays on your device, always.** 🔒
