```markdown
# External Contractor Requirements

## Executive Summary

Mezo is launching a $15,000 BTC giveaway at Labitconf 2025 to expand into Latin America. You will build a  
Spanish landing page where users confirm their giveaway entry and can increase their chances through referrals  
and social sharing. A leaderboard provides gamification to drive engagement.

## What You're Building

A single-page Spanish website with:

- Hero section with prize information
- Wallet address entry form
- Success modal with referral/social tools
- Live leaderboard showing top participants
- Backend to store entries and track multipliers

## Core User Flow

### First-Time Visitor

- Lands on `mezo.org/latam` (may include `?ref=ABC123`)
- Views prize info and leaderboard
- Creates Mezo account (external link/process)
- Returns and enters wallet address in form on the page (v0 or next.js thing you mentioned)
- Success modal appears with:
  - Confirmation
  - Personal referral link tied to their wallet: `mezo.org/latam?ref=ABC123`
  - Social sharing button
- User copies referral link or posts on X
- Can check their position on leaderboard

Note: We built a very complete referral system for the early depositor program on Mezo. So we should have a lot of that code  
off the shelf ready to use, at least for

- leaderboard components - both database tracking and UI integration
- connecting ref code to address
- verifying new addresses signed up with ref code and giving bonus points

### New Visitor (via referral)

- Lands on `mezo.org/latam?ref=ABC123`
- Cookie stores the referral code
- Creates Mezo account
- Enters wallet address

Potential on Mezo end for 100% verification: enter latam referal code field

System credits both referrer (+5 entries) and new user (+2 bonus entries)

---

## Page Structure

`mezo.org/latam`
```

├── Hero Section
│ ├── Headline: "Win $15,000 in Bitcoin"
│ ├── Subheadline: "Official Labitconf 2025 Giveaway"
│ ├── Prize breakdown visualization
│ └── Countdown timer
│
├── Entry Form
│ ├── Heading: "Confirm Your Entry"
│ ├── Input: "Your Mezo wallet address (0x...)"
│ ├── Button: "Confirm Entry"
│ └── Link: "Don't have an account? Create one here"
│
├── Leaderboard Section
│ ├── Heading: "Leaderboard"
│ ├── Search bar: "Search your address"
│ ├── Top 100 entries displayed
│ ├── Columns: Rank | Wallet | Total Entries | Badges
│ └── User's position highlighted (if entered)
│
├── How It Works
│ ├── Step 1: Create Mezo account
│ ├── Step 2: Confirm your entry here
│ ├── Step 3: Invite friends (5 extra entries each)
│ └── Step 4: Share on social media (3 extra entries)
│
├── Prize Structure
│ ├── Grand Prize: $1,500 (1 winner)
│ ├── Secondary: $250 × 6 ($1,500)
│ ├── Mid-Tier: $40 × 50 ($2,000)
│ └── Base: $20 × 500 ($10,000)
│
└── Footer
├── Terms and conditions
└── Mezo social links

````

---

## Key Features

### 1. Wallet Address Entry Form
**Form Fields:**
- Single input: Wallet address (0x format)
- Validation: 42 characters, starts with "0x"

**Validation Flow:**
1. Check format (0x... and 42 chars)
2. Verify wallet exists in Mezo system (we should have an API to ping here, or some sort of live database you grab from)
3. Store entry with generated referral code
4. Show success modal

```javascript
// example validation
1. Check format (0x... and 42 chars)
3. Verify wallet exists in Mezo system
4. Store entry with generated referral code
5. Show success modal
````

---

### 2. Referral System

Again, we probably have most of these components already built for you.

**Referral Code Generation:**

```javascript
// Generate unique code from wallet address
function generateReferralCode(walletAddress) {
  // Create short hash from wallet
  // Example: 0xabcd...1234 -> "MEZ7X9K"
  return shortHash(walletAddress);
}
```

**Referral Link Format:**
`mezo.org/latam?ref=MEZ7X9K`

**Tracking Logic:**
(this would be for if we don’t have them input the ref code on the Mezo app. which, this would be sufficient)

1. Visitor arrives with `?ref=MEZ7X9K`
2. Store ref code in cookie (30-day expiry)
3. When visitor enters wallet address:
   - Credit referrer: +5 entries
   - Credit new user: +2 entries (`referred_by_code = MEZ7X9K`)

4. Update both entries in database

**Referral Rules:**

- Each referral = +5 entries for referrer
- Referred user gets +2 bonus entries
- Maximum 20 successful referrals per user (100 bonus entries cap)
- Self-referrals detected by IP/device fingerprint

---

### 3. Social Sharing System

**Tweet Template:**

```
🚀 Participando en el sorteo de $15,000 en Bitcoin de @MezoNetwork

Mi Mezo ID: @{mezo_id}

#MezoLATAM #Labitconf2025

Únete aquí 👉 mezo.org/latam?ref={referral_code}
```

**Social Verification Flow:**

1. User clicks "Compartir en X"
2. Pre-populated tweet opens in new window
3. After posting, user pastes tweet URL in modal
4. System checks:
   - Tweet exists
   - Contains #MezoLATAM
   - Contains their Mezo ID (optional validation)

5. Award +3 entries
6. Mark `social_shared = TRUE`

**Alternative (Simpler):**
Trust-based system: User clicks share button

- Auto-award +3 entries without URL verification
- Spot-check samples manually for quality control

---

### 4. Success Modal

**Modal Appears After Entry Confirmation:**

```
┌─────────────────────────────────────┐
│  ✅ ¡Estás Participando!            │
│                                     │
│  Tu entrada ha sido confirmada.    │
│  Posición actual: #247             │
│  Total de entradas: 1              │
│                                     │
│  🎯 Multiplica tus oportunidades:  │
│                                     │
│  Invita Amigos (+5 por cada uno)   │
│  ┌─────────────────────────────┐  │
│  │ mezo.org/latam?ref=MEZ7X9K │  │
│  └─────────────────────────────┘  │
│  [📋 Copiar Link]                  │
│                                     │
│  Comparte en X (+3 entradas)       │
│  [🐦 Compartir en X]               │
│                                     │
│  [Ver Tabla de Posiciones]         │
└─────────────────────────────────────┘
```

---

### 5. Leaderboard

**Display Requirements:**

- Shows top 100 participants
- Updates every 60 seconds (auto-refresh)
- Anonymizes wallet addresses: `0x1a2b...3c4d`
- Highlights user's own entry (if entered)
- Search function to find specific wallets

**Leaderboard Format:**

```
Rango | Dirección      | Entradas | Bonificación
------|----------------|----------|------------------
  1   | 0x1a...3b4c   |   106    | 👥×20 🐦
  2   | 0x2b...4d5e   |    51    | 👥×10
  3   | 0x3c...5e6f   |    23    | 👥×4 🐦
  4   | 0x4d...6g7h   |     8    | 👥×1 🐦
 ...
 247  | 0xtu...dire   |     1    | -
```

```

```
