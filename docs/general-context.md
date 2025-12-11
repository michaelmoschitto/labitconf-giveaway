# Labitconf Giveaway - General Context

## Project Overview

Spanish landing page for Mezo's $15,000 BTC giveaway at Labitconf 2025. Single-page application at `mezo.org/latam`.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Bun package manager

## Key Requirements

- **Language**: All content in Spanish
- **Responsive**: Mobile-first design
- **Styling**: Use shadcn components, theme will change later
- **Stubbing**: OK to stub handlers and use hardcoded data for now

## Shared Types

```typescript
// src/types/giveaway.ts
export interface GiveawayEntry {
  walletAddress: string;
  referralCode: string;
  totalEntries: number;
  referredBy?: string;
  socialShared: boolean;
  createdAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalEntries: number;
  badges: {
    referrals: number;
    socialShare: boolean;
  };
}
```

## Component Structure

```
src/
├── components/
│   ├── hero/
│   ├── entry-form/
│   ├── leaderboard/
│   ├── how-it-works/
│   ├── prize-structure/
│   └── layout/
└── app/
    └── latam/
        └── page.tsx
```

## Design Guidelines

- Use shadcn/ui components as base
- Keep styling flexible for future theming
- Use Tailwind classes with cn() utility
- Implement basic responsiveness

## Stubbed Functionality

- Wallet validation: Basic format check only
- Referral system: Generate codes but don't track
- Social sharing: Open tweet window, no verification
- Leaderboard: Use hardcoded data (10 entries)
- Countdown: Static date

## Spanish Content

All user-facing text must be in Spanish. Use these translations:

- "Win $15,000 in Bitcoin" → "Gana $15,000 en Bitcoin"
- "Confirm Your Entry" → "Confirma Tu Participación"
- "Leaderboard" → "Tabla de Posiciones"
- "How It Works" → "Cómo Funciona"
