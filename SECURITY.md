# Security Policy

## Supported Versions

We actively support the following versions of HopeNest with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in HopeNest, please follow these steps:

### 🔒 Private Disclosure

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please:

1. **Email**: Send details to [security@hopenest.org] (replace with actual email)
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (if available)

### 📋 What to Include

When reporting a security issue, please provide:

- **Type of issue** (e.g., SQL injection, XSS, etc.)
- **Full paths** of source files related to the issue
- **Location** of the affected source code (tag/branch/commit or direct URL)
- **Configuration** required to reproduce the issue
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact** of the issue, including how an attacker might exploit it

### ⏱️ Response Timeline

- **Initial Response**: Within 48 hours
- **Detailed Response**: Within 7 days
- **Fix Timeline**: Depends on severity (1-30 days)

### 🛡️ Security Measures

Our application implements several security measures:

#### Authentication & Authorization
- JWT tokens with secure expiration
- Password hashing with bcrypt (10+ rounds)
- Role-based access control
- Session management

#### API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection
- Security headers (Helmet.js)
- File upload restrictions

#### Data Protection
- MongoDB injection prevention
- XSS protection
- Parameter pollution prevention
- Secure file handling

#### Infrastructure Security
- Docker containerization
- Non-root user execution
- Environment variable protection
- Secure defaults

### 🏆 Recognition

We appreciate security researchers who help keep HopeNest secure. Upon confirmation of a valid vulnerability:

1. **Acknowledgment** in our security advisories
2. **Credit** in release notes (if desired)
3. **Response** within agreed timeline

### 📜 Responsible Disclosure

We ask that you:

- Allow reasonable time for us to fix the issue before public disclosure
- Avoid privacy violations, destruction of data, or service disruption
- Contact us before engaging in research that could affect multiple users

Thank you for helping keep HopeNest and our users safe!