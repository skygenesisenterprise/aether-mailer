import { BlogPost } from "./types";

export const blogPosts: BlogPost[] = [
  {
    slug: "introducing-aether-identity-2-0",
    title: "Introducing Aether Identity 2.0: A New Era of Self-Hosted IAM",
    excerpt:
      "Today we announce Aether Identity 2.0, featuring a completely redesigned authorization engine, native support for fine-grained permissions, and enhanced federation capabilities.",
    content: `
Today marks a significant milestone for Aether Identity. After eighteen months of development and collaboration with our enterprise customers, we're releasing Aether Identity 2.0.

## What's New

### Redesigned Authorization Engine

The core authorization engine has been rebuilt from the ground up. We've moved from a traditional RBAC model to a hybrid system that combines role-based access control with relationship-based authorization, similar to Google Zanzibar.

\`\`\`typescript
// Define relationships
await aether.fga.define({
  type: "document",
  relations: {
    owner: { type: "user" },
    editor: { type: "user" },
    viewer: { type: "user", union: ["editor", "owner"] }
  }
});

// Check permissions
const canView = await aether.fga.check({
  user: "user:alice",
  relation: "viewer",
  object: "document:report-2024"
});
\`\`\`

### Native Passkey Support

WebAuthn and passkeys are now first-class citizens. Users can register passkeys during enrollment and use them as primary or secondary authentication factors.

### Enhanced Federation

Connect to any SAML 2.0 or OIDC provider with our new visual connection builder. No more manual metadata parsing or certificate juggling.

## Migration Path

Existing Aether Identity 1.x deployments can upgrade in-place. Our migration tool handles schema updates and configuration changes automatically.

## What's Next

We're already working on Aether Identity 2.1, which will include:

- AI-powered anomaly detection for suspicious login attempts
- Extended audit log retention with advanced search
- Native Kubernetes operator for simplified deployments

Thank you to everyone who contributed feedback during the beta period. Your input has been invaluable in shaping this release.
    `.trim(),
    publishedAt: "2026-04-10",
    author: {
      name: "Marcus Chen",
      role: "Co-founder & CTO",
    },
    category: "Product",
    tags: ["release", "product-update", "authorization", "passkeys"],
    readingTime: 6,
    featured: true,
  },
  {
    slug: "zero-trust-architecture-identity-layer",
    title: "Building a Zero Trust Architecture: The Identity Layer",
    excerpt:
      "Zero Trust isn't just a buzzword—it's a fundamental shift in security thinking. Learn how Aether Identity serves as the foundation for your Zero Trust implementation.",
    content: `
The traditional security perimeter is dead. In a world of remote work, cloud services, and sophisticated threats, the castle-and-moat approach no longer works. Zero Trust Architecture (ZTA) offers a path forward, and identity is at its core.

## The Principle: Never Trust, Always Verify

Zero Trust operates on a simple premise: no user, device, or network should be inherently trusted. Every access request must be verified, regardless of where it originates.

This sounds straightforward, but implementation is complex. Let's break down how identity systems enable Zero Trust.

## Identity as the Control Plane

In a Zero Trust model, identity becomes the primary security perimeter. Every request—whether from a user, service, or device—must present verifiable credentials.

### Continuous Authentication

Traditional authentication happens once at login. Zero Trust requires continuous verification:

\`\`\`typescript
// Configure continuous authentication
const session = await aether.createSession({
  user: authenticatedUser,
  policies: {
    reauthentication: {
      interval: "30m",
      triggers: ["sensitive-action", "location-change"],
      methods: ["passkey", "push-notification"]
    },
    contextValidation: {
      checkDevicePosture: true,
      checkNetworkReputation: true,
      checkBehavioralAnomaly: true
    }
  }
});
\`\`\`

### Device Trust

Zero Trust extends beyond users to devices. Aether Identity integrates with MDM solutions to verify device compliance before granting access.

### Micro-segmentation

Fine-grained permissions ensure users only access what they need. Our relationship-based authorization model makes this practical at scale.

## Implementing Zero Trust with Aether Identity

Here's a practical roadmap for implementing Zero Trust identity:

1. **Inventory your applications** – Catalog all applications and their authentication requirements
2. **Implement strong authentication** – Deploy MFA with phishing-resistant factors like passkeys
3. **Establish device trust** – Integrate device posture checking into authentication flows
4. **Define fine-grained policies** – Move from broad roles to specific, context-aware permissions
5. **Enable continuous monitoring** – Deploy real-time logging and anomaly detection

## Conclusion

Zero Trust isn't a product you buy—it's an architecture you build. Identity is the foundation of that architecture. With Aether Identity's self-hosted approach, you maintain complete control over this critical layer while implementing modern Zero Trust principles.
    `.trim(),
    publishedAt: "2026-04-05",
    author: {
      name: "Sarah Okonkwo",
      role: "Head of Security",
    },
    category: "Security",
    tags: ["zero-trust", "security", "architecture", "best-practices"],
    readingTime: 8,
    featured: true,
  },
  {
    slug: "oauth-pkce-implementation-guide",
    title: "Implementing OAuth 2.0 with PKCE: A Complete Guide",
    excerpt:
      "PKCE is essential for securing OAuth flows in public clients. This tutorial walks through implementing PKCE-protected authorization with Aether Identity.",
    content: `
OAuth 2.0 with PKCE (Proof Key for Code Exchange) is now the recommended approach for all OAuth clients, not just mobile and single-page applications. Let's implement it properly.

## Why PKCE?

Traditional OAuth flows use a client secret to exchange authorization codes for tokens. But public clients—like mobile apps and SPAs—can't securely store secrets. PKCE solves this by creating a dynamic, one-time secret for each authorization request.

## The PKCE Flow

1. Client generates a random \`code_verifier\`
2. Client creates a \`code_challenge\` from the verifier
3. Client includes the challenge in the authorization request
4. After authentication, client exchanges code + verifier for tokens
5. Server verifies the verifier matches the original challenge

## Implementation

### Step 1: Generate Code Verifier and Challenge

\`\`\`typescript
import crypto from 'crypto';

function generateCodeVerifier(): string {
  return crypto.randomBytes(32)
    .toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);
\`\`\`

### Step 2: Initiate Authorization

\`\`\`typescript
const authUrl = new URL('https://auth.example.com/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('state', generateState());

// Store verifier for later (securely!)
sessionStorage.setItem('pkce_verifier', codeVerifier);

// Redirect user
window.location.href = authUrl.toString();
\`\`\`

### Step 3: Exchange Code for Tokens

\`\`\`typescript
async function exchangeCode(code: string): Promise<TokenResponse> {
  const verifier = sessionStorage.getItem('pkce_verifier');
  sessionStorage.removeItem('pkce_verifier');

  const response = await fetch('https://auth.example.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier
    })
  });

  return response.json();
}
\`\`\`

## Using the Aether Identity SDK

Our SDK handles all of this automatically:

\`\`\`typescript
import { AetherClient } from '@aether-identity/browser';

const aether = new AetherClient({
  domain: 'auth.yourcompany.com',
  clientId: 'your-client-id',
  redirectUri: 'https://app.yourcompany.com/callback'
});

// Start login (PKCE handled automatically)
await aether.loginWithRedirect();

// In your callback handler
const { user, tokens } = await aether.handleRedirectCallback();
\`\`\`

## Common Pitfalls

1. **Weak verifier generation** – Always use cryptographically secure random bytes
2. **Storing verifier insecurely** – Use sessionStorage, never localStorage
3. **Missing state parameter** – Always include state to prevent CSRF
4. **Not clearing stored values** – Remove verifier after use

PKCE is straightforward when you understand the flow. Use our SDK to handle the complexity, but understanding the underlying mechanism helps with debugging and security reviews.
    `.trim(),
    publishedAt: "2026-03-28",
    author: {
      name: "David Park",
      role: "Senior Engineer",
    },
    category: "Tutorials",
    tags: ["oauth", "pkce", "tutorial", "security", "authentication"],
    readingTime: 7,
  },
  {
    slug: "scaling-authentication-million-users",
    title: "Scaling Authentication to 10 Million Users",
    excerpt:
      "How we architected Aether Identity to handle enterprise-scale authentication workloads while maintaining sub-20ms response times.",
    content: `
When we started building Aether Identity, we knew scalability would be critical. Enterprise customers don't just need authentication—they need authentication that works flawlessly at scale. Here's how we achieved it.

## The Challenge

Authentication systems face unique scaling challenges:

- **Extreme read/write ratio** – Token validation happens orders of magnitude more often than logins
- **Latency sensitivity** – Every request to a protected resource depends on auth
- **Availability requirements** – Auth downtime means total application downtime
- **Session state** – Distributed session management adds complexity

## Our Architecture

### Stateless Token Validation

We use JWTs for access tokens, enabling stateless validation at the edge:

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│  Edge Node  │───▶│ Application │
└─────────────┘    └─────────────┘    └─────────────┘
                         │
                    JWT Validation
                   (No DB required)
\`\`\`

This architecture means token validation happens in microseconds without network calls.

### Distributed Session Store

For session state, we use a distributed cache layer:

- **Primary**: Redis Cluster with read replicas
- **Fallback**: PostgreSQL with connection pooling
- **Local cache**: In-memory LRU for hot sessions

### Connection Pooling

Database connections are precious. We use PgBouncer in transaction mode with carefully tuned pool sizes based on query patterns.

## Performance Results

After optimization:

| Metric | Before | After |
|--------|--------|-------|
| Token validation P99 | 45ms | 3ms |
| Login P99 | 180ms | 85ms |
| Sessions supported | 500K | 10M+ |
| Database connections | 500 | 50 |

## Lessons Learned

1. **Cache aggressively** – But invalidate carefully
2. **Measure everything** – You can't optimize what you don't measure
3. **Design for failure** – Every component will fail eventually
4. **Test at scale** – Load testing isn't optional

Scaling authentication is hard, but it's solvable with the right architecture. If you're building for enterprise scale, start with these patterns.
    `.trim(),
    publishedAt: "2026-03-20",
    author: {
      name: "Marcus Chen",
      role: "Co-founder & CTO",
    },
    category: "Engineering",
    tags: ["scaling", "performance", "architecture", "engineering"],
    readingTime: 6,
  },
  {
    slug: "gdpr-compliance-identity-management",
    title: "GDPR Compliance in Identity Management: A Practical Guide",
    excerpt:
      "Navigating GDPR requirements for identity and access management. From data minimization to the right to erasure, here's what you need to know.",
    content: `
GDPR has fundamentally changed how organizations handle personal data. Identity management systems are at the center of this, processing names, emails, authentication logs, and more. Let's break down the requirements.

## Core GDPR Principles for IAM

### 1. Lawful Basis for Processing

You need a legal basis for processing identity data. For authentication, this is typically:

- **Contract performance** – Users need accounts to use your service
- **Legitimate interest** – Security logging to protect your systems
- **Consent** – For optional features like marketing preferences

### 2. Data Minimization

Only collect what you need. Aether Identity supports configurable user schemas:

\`\`\`yaml
# Minimal schema for authentication
user_schema:
  required:
    - email
  optional:
    - display_name
  prohibited:
    - date_of_birth  # Don't collect if not needed
    - address
\`\`\`

### 3. Right to Erasure

Users can request deletion of their data. Implement this carefully:

\`\`\`typescript
async function handleDeletionRequest(userId: string) {
  // 1. Verify the request is legitimate
  await verifyDeletionRequest(userId);
  
  // 2. Delete from primary store
  await aether.users.delete(userId);
  
  // 3. Anonymize audit logs (retain for security)
  await aether.auditLogs.anonymize(userId);
  
  // 4. Propagate to connected systems
  await notifyDownstreamSystems(userId);
  
  // 5. Generate compliance record
  await createDeletionRecord(userId);
}
\`\`\`

### 4. Data Portability

Users can request their data in a portable format:

\`\`\`typescript
const userData = await aether.users.export(userId, {
  format: 'json',
  include: ['profile', 'consents', 'login_history']
});
\`\`\`

## Self-Hosting and GDPR

Self-hosted identity systems offer advantages for GDPR compliance:

- **Data residency** – Keep data in your jurisdiction
- **Full control** – No third-party data processing agreements needed
- **Audit capability** – Complete visibility into data handling

## Practical Checklist

- [ ] Document your lawful basis for identity data processing
- [ ] Implement data minimization in user registration
- [ ] Build automated data export functionality
- [ ] Create deletion workflows that cover all systems
- [ ] Retain security logs while anonymizing personal data
- [ ] Regular privacy impact assessments

GDPR compliance isn't a one-time project—it's an ongoing commitment. Build compliance into your identity architecture from the start.
    `.trim(),
    publishedAt: "2026-03-15",
    author: {
      name: "Elena Vasquez",
      role: "Compliance Lead",
    },
    category: "Industry",
    tags: ["gdpr", "compliance", "privacy", "data-protection"],
    readingTime: 7,
  },
  {
    slug: "passkeys-future-authentication",
    title: "Passkeys: The Future of Authentication is Here",
    excerpt:
      "Passwords are dying. Passkeys offer a more secure, more usable alternative. Here's how to implement them with Aether Identity.",
    content: `
We've been promising the death of passwords for years. With passkeys reaching mainstream adoption, that future is finally here.

## What Are Passkeys?

Passkeys are cryptographic credentials stored on your devices. They use public-key cryptography—the same technology that secures the web—for authentication.

Key benefits:
- **Phishing-resistant** – Credentials are bound to specific domains
- **No shared secrets** – Nothing to steal from servers
- **Better UX** – Biometric authentication instead of typing
- **Cross-device** – Sync across your devices via platform providers

## How Passkeys Work

1. **Registration**: Device generates a key pair, sends public key to server
2. **Authentication**: Server sends a challenge, device signs it with private key
3. **Verification**: Server verifies signature using stored public key

The private key never leaves the device.

## Implementing Passkeys

### Registration Flow

\`\`\`typescript
// Client-side: Create passkey
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: serverChallenge,
    rp: { name: "Your App", id: "yourapp.com" },
    user: {
      id: userId,
      name: userEmail,
      displayName: userName
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" },   // ES256
      { alg: -257, type: "public-key" }  // RS256
    ],
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required"
    }
  }
});

// Send credential to server for storage
await registerPasskey(credential);
\`\`\`

### Authentication Flow

\`\`\`typescript
// Client-side: Use passkey
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: serverChallenge,
    rpId: "yourapp.com",
    userVerification: "required"
  }
});

// Send assertion to server for verification
const { user, session } = await authenticateWithPasskey(assertion);
\`\`\`

## With Aether Identity SDK

We handle the complexity:

\`\`\`typescript
import { AetherClient } from '@aether-identity/browser';

const aether = new AetherClient({ /* config */ });

// Register a passkey for current user
await aether.passkeys.register();

// Authenticate with passkey
const { user } = await aether.loginWithPasskey();
\`\`\`

## Migration Strategy

Don't force users off passwords overnight:

1. **Enable passkeys alongside passwords** – Let users choose
2. **Prompt for passkey registration** – After successful password login
3. **Gradually deprecate passwords** – For users with registered passkeys
4. **Keep recovery options** – Passkey-only isn't practical yet

## Current Limitations

- **Platform support varies** – Older devices may not support passkeys
- **Recovery is complex** – Lost all devices? Recovery is harder than password reset
- **Enterprise adoption** – MDM and policy controls are still maturing

Despite limitations, passkeys represent the biggest authentication improvement in decades. Start your migration now.
    `.trim(),
    publishedAt: "2026-03-08",
    author: {
      name: "David Park",
      role: "Senior Engineer",
    },
    category: "Security",
    tags: ["passkeys", "webauthn", "authentication", "security", "passwordless"],
    readingTime: 6,
    featured: true,
  },
];

export function getBlogPosts(): BlogPost[] {
  return blogPosts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((post) => post.featured);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getBlogPosts().filter((post) => post.category === category);
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getBlogPosts().filter((post) => post.tags.includes(tag));
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const current = getBlogPost(currentSlug);
  if (!current) return [];

  return getBlogPosts()
    .filter((post) => post.slug !== currentSlug)
    .filter(
      (post) =>
        post.category === current.category ||
        post.tags.some((tag) => current.tags.includes(tag))
    )
    .slice(0, limit);
}
