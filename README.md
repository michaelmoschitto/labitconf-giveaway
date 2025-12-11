# LabitConf Giveaway

A Bitcoin banking kickstarter giveaway platform built for Mezo's LaBitConf 2025 campaign. Users can enter to win BTC deposit matches on Mezo by connecting their wallet, referring friends, and climbing the leaderboard.

**Live Site:** [labitconf.mezo.org](https://labitconf.mezo.org)

## Tech Stack

- **Framework:** Next.js 15.5.4 (App Router)
- **Language:** TypeScript 5.x
- **Runtime:** Bun (package manager & runtime)
- **Database:** Supabase (Postgres)
- **ORM:** Drizzle ORM 0.44.6
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Deployment:** Netlify

## Prerequisites

- **Bun:** v1.3+ ([install](https://bun.sh))
- **Supabase CLI:** ([install](https://supabase.com/docs/guides/cli/getting-started))
- **Node.js:** v20+ (for compatibility with some tooling)

## Getting Started

### 1. Clone and Install

```bash
git clone git@github.com:mezo-org/labitconf-giveaway.git
cd labitconf-giveaway
bun install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your local Supabase credentials (see [Environment Variables](#environment-variables) section).

### 3. Start Local Supabase

```bash
bun run supabase:start
```

This will:

- Start a local Supabase instance (Docker required)
- Run all migrations in `supabase/migrations/`
- Seed the database with `supabase/seed.sql`
- Print connection details and credentials

**Note:** Production database is down. All development uses local Supabase only.

### 4. Update Environment Variables

After Supabase starts, run:

```bash
bun run supabase:status
```

Copy the displayed values to your `.env.local`:

- `API URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`
- `DB URL` → `DATABASE_URL`

### 5. Run Development Server

```bash
bun dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Supabase Local Development

### Core Commands

```bash
# Start local Supabase (Docker required)
bun run supabase:start

# Stop local Supabase
bun run supabase:stop

# Check status and get credentials
bun run supabase:status

# Open Supabase Studio (database UI)
bun run supabase:studio
# Opens http://127.0.0.1:54323

# Reset database (re-runs all migrations and seeds)
bun run supabase:reset
```

### Migrations

```bash
# Create a new migration
bun run supabase:migration <migration_name>
# This creates a new SQL file in supabase/migrations/

# Apply migrations locally (includes db:pull)
bun run db:migrate:local
# This runs: supabase migration up && bun run db:pull

# Push migrations to remote (when prod is available)
bun run db:migrate
```

### Type Generation

After making schema changes, regenerate types:

```bash
# Pull Drizzle schema from database (auto-generates src/lib/db/schema.ts)
bun run db:pull

# Generate TypeScript types from Supabase schema (generates src/lib/db/types.ts)
bun run supabase:types
```

**Note:** `db:migrate:local` automatically runs `db:pull` for you.

### Local Ports

- **API Server:** http://127.0.0.1:54321
- **Database:** postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Studio:** http://127.0.0.1:54323

## Database & Type System

### Architecture Overview

This project uses **Drizzle ORM** as the primary ORM with Supabase as the database backend. We maintain two parallel type systems:

1. **Supabase SQL Migrations** (source of truth) - `supabase/migrations/*.sql`
2. **Drizzle Schema** (auto-generated) - `src/lib/db/schema.ts`
3. **Supabase Types** (generated) - `src/lib/db/types.ts`

### Drizzle ORM

**Why Drizzle?**

- Type-safe queries with TypeScript inference
- Better developer experience than Supabase client for complex queries
- Direct SQL control when needed
- Auto-generates schema from existing database

**Schema Definition:**

The Drizzle schema in `src/lib/db/schema.ts` is **auto-generated** by running `bun run db:pull`, which introspects your Supabase database and creates the TypeScript schema definition:

```typescript
// src/lib/db/schema.ts (auto-generated via db:pull)
export const giveawayEntries = pgTable("giveaway_entries", {
  id: uuid().defaultRandom().primaryKey(),
  walletAddress: varchar("wallet_address", { length: 66 }).notNull(),
  // ... more fields
});
```

**Never manually edit this file** - always make changes via SQL migrations and regenerate.

**Type Inference:**

```typescript
// Automatically infer types from schema
export type GiveawayEntry = typeof giveawayEntries.$inferSelect;
export type NewGiveawayEntry = typeof giveawayEntries.$inferInsert;
```

### Repository Pattern

All database operations are encapsulated in repository modules:

```typescript
// src/lib/db/repositories/entries.ts
export const getByWallet = async (walletAddress: string): Promise<GiveawayEntry | null>
export const create = async (...params): Promise<GiveawayEntry>
export const getTotalCount = async (): Promise<number>
```

**Key Repositories:**

- `entries.ts` - User giveaway entries
- `leaderboard.ts` - Leaderboard queries
- `referrals.ts` - Referral system logic

### Database Clients

Three clients are available, each for different use cases:

```typescript
// src/lib/db/client.ts

// 1. Drizzle (primary) - Type-safe queries
import { db } from "@/lib/db/client";
const entries = await db.select().from(giveawayEntries);

// 2. Supabase Admin - Bypasses RLS (server-only)
import { supabaseAdmin } from "@/lib/db/client";
const { data } = await supabaseAdmin.from("giveaway_entries").select();

// 3. Supabase Public - Respects RLS policies
import { supabasePublic } from "@/lib/db/client";
```

**When to use each:**

- **Drizzle (`db`):** Most queries, especially complex joins
- **Admin (`supabaseAdmin`):** Operations that need to bypass RLS
- **Public (`supabasePublic`):** Client-facing queries respecting RLS

### Schema Management Workflow

**Important:** Supabase SQL migrations are the source of truth. Drizzle schema is auto-generated.

1. **Create Supabase migration**: `bun run supabase:migration <name>`
2. **Write SQL migration** in `supabase/migrations/`
   ```sql
   -- Example: supabase/migrations/20240101000000_add_new_field.sql
   ALTER TABLE giveaway_entries ADD COLUMN new_field VARCHAR(255);
   ```
3. **Apply locally**: `bun run supabase:reset`
4. **Generate Drizzle schema** (auto-generates `src/lib/db/schema.ts`):
   ```bash
   bun run db:pull
   ```
5. **Generate Supabase types**: `bun run supabase:types`
6. **Update repositories** if needed for new queries

### Row Level Security (RLS)

RLS policies are defined in migrations:

- **Select:** Public read access to all entries
- **Insert:** Public can insert with validation constraints
- **Update:** Denied (use service role for updates)
- **Delete:** Denied (no deletions allowed)

View policies: `src/lib/db/__tests__/rls-policies.test.ts`

## Frontend Architecture

### Next.js App Router

This project uses Next.js 15 with the App Router (`src/app/`):

```
src/app/
├── [lang]/              # Internationalized routes
│   ├── layout.tsx       # Root layout with i18n
│   └── page.tsx         # Main landing page
├── api/                 # API routes
│   ├── entries/
│   ├── leaderboard/
│   └── mezo/
├── globals.css          # Global styles & design tokens
└── layout.tsx           # Root HTML layout
```

### Component Structure

```
src/components/
├── hero/                # Hero section
├── entry-form/          # Form with mobile/desktop variants
│   ├── entry-form-section.tsx
│   ├── entry-form-mobile.tsx
│   ├── entry-form-desktop.tsx
│   └── use-entry-form.ts (shared hook)
├── leaderboard/         # Leaderboard display
├── prize-section/       # Prize tiers
├── how-it-works/        # Steps explanation
└── ui/                  # shadcn/ui components
```

### Component Patterns

#### 1. Server vs Client Components

```typescript
// Server Component (default)
export default async function Page() {
  const dict = await getDictionary("es");
  return <HeroSection dict={dict} />;
}

// Client Component (use "use client")
"use client";
export const EntryForm = () => {
  const [state, setState] = useState();
  // ...
};
```

#### 2. Dictionary Props Pattern

All components receive dictionary props for i18n:

```typescript
interface ComponentProps {
  dict: Dictionary;
  lang: "en" | "es";
}

export const Component = ({ dict, lang }: ComponentProps) => {
  return <h1>{dict.hero.headline}</h1>;
};
```

#### 3. Custom Hooks

Shared business logic lives in hooks:

```typescript
// src/components/entry-form/use-entry-form.ts
export const useEntryForm = (dict, lang) => {
  // Form state, validation, submission logic
  return {
    walletAddress,
    error,
    handleSubmit,
    // ...
  };
};
```

### State Management

- **Local State:** React `useState` for component-specific state
- **Form State:** Custom hooks with validation logic
- **Global State:** None (no Redux/Zustand needed)
- **Server State:** Fetched in Server Components, passed as props

## Backend Architecture

### API Routes

All routes follow RESTful conventions:

```
/api/entries
  POST   - Create entry
  GET    - Check if wallet exists

/api/entries/check?wallet=0x...
  GET    - Check wallet duplicate

/api/leaderboard
  GET    - Get top entries

/api/leaderboard/position?wallet=0x...
  GET    - Get user's rank

/api/mezo/validate?wallet=0x...
  GET    - Validate wallet on Mezo network

/api/social-share
  POST   - Record social share
```

### Security Layers

#### 1. Rate Limiting

In-memory rate limiting by IP address:

```typescript
// src/lib/rate-limit.ts
export const RateLimits = {
  ENTRIES: { windowMs: 3600000, maxRequests: 50 },
  SOCIAL_SHARE: { windowMs: 60000, maxRequests: 10 },
  LEADERBOARD: { windowMs: 60000, maxRequests: 200 },
};
```

**Note:** Suitable for serverless. For high traffic, migrate to Redis.

#### 2. CORS Protection

```typescript
// src/lib/api-security.ts
const getAllowedOrigins = () => {
  // Development: localhost
  // Production: ALLOWED_ORIGINS env var
};
```

#### 3. Address Validation

Supports both Bitcoin and Ethereum addresses:

```typescript
// src/lib/address-utils.ts
export const validateAddress = (address: string): boolean;
export const detectAddressType = (address: string): "ethereum" | "bitcoin" | null;
export const normalizeAddress = (address: string): string;
```

Uses `multicoin-address-validator` for validation.

#### 4. Input Sanitization

- Email format validation
- Wallet address checksum verification
- Referral code format validation
- SQL injection prevention (via Drizzle parameterized queries)

### Response Patterns

All API routes use secure response helpers:

```typescript
// Success response
return secureJsonResponse({ success: true, data }, request, { status: 200 });

// Error response
return secureErrorResponse(
  { message: "Error", code: "ERROR_CODE", status: 400 },
  request,
);

// Rate limit response
return rateLimitResponse(request, resetAt);
```

These automatically add:

- CORS headers
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Content-Type headers

## Internationalization (i18n)

### System Overview

Server-side dictionary system with two locales:

- **Spanish (es)** - Default
- **English (en)**

### URL Structure

```
/{lang}/           # Localized routes
/en/              # English
/es/              # Spanish (default)
```

### Middleware

Handles locale detection and redirection:

```typescript
// middleware.ts
- Detects user language from Accept-Language header
- Redirects to appropriate /{lang}/ route
- Special handling for /labtc2025 → /?ref=labtc2025
- Manages referral code cookies
```

### Dictionary System

**Location:** `dictionaries/en.json`, `dictionaries/es.json`

**Structure:**

```json
{
  "hero": {
    "headline": "Win $15,000 in Bitcoin",
    "subheadline": "Get up to $25 in BTC on Mezo"
  },
  "form": {
    "walletAddress": "Your Mezo wallet address",
    "emailLabel": "Email Address"
  }
}
```

**Usage:**

```typescript
// Server Component
import { getDictionary } from "@/lib/dictionaries";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "en" | "es");

  return <Component dict={dict} lang={lang} />;
}
```

**Type Safety:**

```typescript
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
export type Locale = "en" | "es";
```

### Adding New Translations

1. Add key to both `dictionaries/en.json` and `dictionaries/es.json`
2. TypeScript will enforce the key exists in both files
3. Use in components: `dict.section.key`

## Responsive Design

### Mobile vs Desktop Pattern

This app uses a **block/hide pattern** with separate components for complex UIs:

```tsx
export const EntryFormSection = ({ dict, lang }) => {
  return (
    <>
      {/* Mobile: Show below lg breakpoint */}
      <div className="block lg:hidden">
        <EntryFormMobile dict={dict} lang={lang} />
      </div>

      {/* Desktop: Show at lg breakpoint and above */}
      <div className="hidden lg:block">
        <EntryFormDesktop dict={dict} lang={lang} />
      </div>
    </>
  );
};
```

### Breakpoint Strategy

- **Primary breakpoint:** `lg` (1024px)
- **Mobile-first:** Design for mobile, enhance for desktop
- **Shared logic:** Use hooks (`use-entry-form.ts`) for business logic
- **Separate UI:** Different layouts in separate files when complexity warrants

### When to Split Components

**Split into mobile/desktop:**

- Complex forms with different layouts
- Multi-step flows that differ significantly
- Heavy visual changes between sizes

**Keep as one responsive component:**

- Simple content displays
- Cards that just stack differently
- Navigation and footers

### Responsive Utilities

```tsx
// Tailwind responsive classes
className = "text-2xl lg:text-4xl"; // Scale text
className = "px-4 lg:px-8"; // Spacing
className = "flex-col lg:flex-row"; // Layout direction
className = "grid-cols-1 lg:grid-cols-3"; // Grid columns
```

## Styling System

### Design Philosophy

**Minimalistic, Typography-Focused, Elegant**

See `docs/design-philosophy.md` for comprehensive guidelines.

Key principles:

- Large, bold typography (7xl-9xl for headlines)
- Generous whitespace and padding
- Subtle animations (slow, organic)
- Low-opacity decorative elements
- Mezo brand colors (pink-red gradient)

### Tailwind CSS v4

Using latest Tailwind with `@theme inline` directive:

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";
@import "./fonts.css";

@theme inline {
  --color-foreground: var(--foreground);
  --font-sans: var(--font-riforma);
}
```

### Semantic Color Tokens

**Light Mode:**

```css
--background: oklch(1 0 0); /* White */
--foreground: oklch(0.03 0 0); /* Near black */
--primary: oklch(0.608 0.235 10.5); /* Mezo pink */
--mezo-red: #ff004d; /* Mezo brand red */
```

**Dark Mode:**

```css
.dark {
  --background: oklch(0.03 0 0); /* Near black */
  --foreground: oklch(1 0 0); /* White */
}
```

### Custom Animations

**Float Animation (Decorative Elements):**

```css
@keyframes float-slow {
  0%,
  100% {
    transform: translateY(0px) translateX(0px);
  }
  33% {
    transform: translateY(-30px) translateX(15px);
  }
  66% {
    transform: translateY(-15px) translateX(-15px);
  }
}

.animate-float-slow {
  animation: float-slow 20s ease-in-out infinite;
}
```

**Scroll Reveal (Content Entrance):**

```css
.scroll-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.6s ease-out,
    transform 0.6s ease-out;
}

.scroll-reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
```

### Gradient Text Utilities

```css
/* Mezo brand gradient */
.text-gradient-mezo-pink {
  background: linear-gradient(135deg, #d32e58 0%, #eb3352 100%);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Use in components */
<h1 className="text-gradient-mezo-pink">Headline</h1>
```

### Component Styling Patterns

**1. Use `cn()` utility for conditional classes:**

```typescript
import { cn } from "@/lib/utils";

className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "primary" && "variant-classes"
)}
```

**2. Semantic CSS variables:**

```css
.input-background {
  background-color: var(--background);
  color: var(--foreground);
}
```

**3. Accessibility:**

```tsx
// Always include focus states
className="focus:ring-2 focus:ring-primary"

// Respect reduced motion
@media (prefers-reduced-motion: reduce) {
  .animate-float { animation: none; }
}
```

### shadcn/ui Components

Pre-built accessible components in `src/components/ui/`:

- `button.tsx` - Button variants
- `dialog.tsx` - Modal dialogs
- `input.tsx` - Form inputs
- `label.tsx` - Form labels
- `card.tsx` - Content cards
- `table.tsx` - Data tables

Customize via Tailwind classes and CSS variables.

## Testing

### Run Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/lib/__tests__/address-utils.test.ts

# Run with coverage (if configured)
bun test --coverage
```

### Test Structure

```
src/
├── lib/__tests__/
│   ├── address-utils.test.ts
│   ├── api-security.test.ts
│   ├── rate-limit.test.ts
│   └── referral.test.ts
├── app/api/entries/__tests__/
│   ├── route.test.ts
│   └── route.security.test.ts
└── middleware.test.ts
```

### Test Setup

Configuration in `test-setup.ts`:

```typescript
// Sets up test environment
process.env.IS_LOCAL = "true";
// Mocks Supabase client
// Configures test database
```

## Deployment

### Netlify Configuration

**File:** `netlify.toml`

```toml
[build]
  command = "bun run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Build Commands

```bash
# Development build
bun run build

# Production build (on Netlify)
# Automatically uses: bun run build

# Start production server locally
bun start
```

### Environment Variables in Netlify

Set in Netlify Dashboard under Site settings > Environment variables:

**Required:**

- `DATABASE_URL` - Production Supabase connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `ALLOWED_ORIGINS` - Production domain(s)

**Auto-provided by Netlify:**

- `URL` - Your site URL (used as fallback for `NEXT_PUBLIC_BASE_URL`)

### Deployment Workflow

1. **Push to main branch** (or configured branch)
2. **Netlify auto-deploys** via GitHub integration
3. **Build runs:** `bun run build`
4. **Functions deployed** to Netlify Edge Functions
5. **Site goes live** at configured domain

### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

## Development Workflow

### Common Tasks

**Start developing:**

```bash
bun run supabase:start
bun dev
```

**Make database changes:**

```bash
# 1. Create migration
bun run supabase:migration add_new_field

# 2. Edit migration SQL in supabase/migrations/

# 3. Apply locally
bun run supabase:reset

# 4. Generate Drizzle schema from database
bun run db:pull

# 5. Generate Supabase types
bun run supabase:types
```

**Add new UI component:**

```bash
# Use shadcn CLI
bunx shadcn@latest add <component-name>
```

**Lint and format:**

```bash
bun run lint          # Check for errors
bun run lint:fix      # Auto-fix errors
bun run format        # Format code
```

### Code Quality Scripts

```bash
# ESLint
bun run lint
bun run lint:fix

# Prettier
bun run format
bun run format:check

# Fix import order
bun run fix-imports
```

### Git Workflow

```bash
# Current branch
git branch
# Should show: revert-wallet-optional

# Untracked file
# LabitConfGiveaway.postman_collection.json

# Standard workflow
git add .
git commit -m "Description"
git push
```

## Environment Variables

See `.env.example` for complete list and descriptions.

**Quick reference:**

| Variable                        | Required | Description                |
| ------------------------------- | -------- | -------------------------- |
| `DATABASE_URL`                  | Yes      | Postgres connection string |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon key          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Supabase service role key  |
| `ALLOWED_ORIGINS`               | No       | CORS allowed origins       |
| `NEXT_PUBLIC_BASE_URL`          | No       | Base URL override          |

## Troubleshooting

### Supabase won't start

```bash
# Reset Docker containers
docker compose down
bun run supabase:start
```

### Database connection errors

```bash
# Check Supabase is running
bun run supabase:status

# Verify DATABASE_URL matches output
echo $DATABASE_URL
```

### Type errors after schema changes

```bash
# Regenerate types
bun run supabase:types
bun run db:pull
```

### Build errors

```bash
# Clear Next.js cache
rm -rf .next
bun run build
```

### Rate limit errors in development

Rate limits are in-memory. Restart dev server to reset:

```bash
# Ctrl+C then
bun dev
```

## Project Structure

```
labitconf-giveaway/
├── dictionaries/           # i18n translation files
│   ├── en.json
│   └── es.json
├── docs/                   # Design specs and documentation
├── public/                 # Static assets (images, fonts)
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── [lang]/        # Internationalized routes
│   │   ├── api/           # API routes
│   │   ├── globals.css    # Global styles
│   │   └── layout.tsx     # Root layout
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── */            # Feature components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   │   ├── db/           # Database client and schema
│   │   │   ├── repositories/  # Data access layer
│   │   │   ├── schema.ts      # Drizzle schema
│   │   │   └── types.ts       # Generated Supabase types
│   │   ├── address-utils.ts
│   │   ├── api-security.ts
│   │   ├── rate-limit.ts
│   │   └── referral.ts
│   └── constants.ts       # App constants
├── supabase/
│   ├── config.toml        # Supabase local config
│   ├── migrations/        # Database migrations
│   └── seed.sql          # Seed data
├── .env.example          # Environment variables template
├── netlify.toml          # Netlify configuration
├── drizzle.config.ts     # Drizzle ORM configuration
├── middleware.ts         # Next.js middleware (i18n, referrals)
└── package.json          # Dependencies and scripts
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Bun Documentation](https://bun.sh/docs)
