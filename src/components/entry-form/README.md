# Entry Form Component

The wallet entry form for the Labitconf 2025 Giveaway.

## Features

### ✅ Implemented (UI Only)

- **Wallet Address Input**: Single input field with real-time validation
- **Debounced Validation**: Validates 500ms after user stops typing (no spam checking)
- **Visual Feedback**: Shows loading spinner, checkmark (valid), or X (invalid)
- **Format Validation**: Checks for 42 characters and "0x" prefix
- **Hex Validation**: Ensures valid hexadecimal characters
- **Smart Button State**: Submit button only enabled when address is valid
- **Success Modal**: Shows confirmation with referral link and sharing options
- **Referral Link**: Generates and displays user's unique referral link
- **Copy to Clipboard**: One-click copy of referral link
- **Social Sharing**: Pre-populated tweet for X (Twitter)
- **Responsive Design**: Works on mobile and desktop
- **Accessibility**: ARIA labels, keyboard navigation, focus states
- **Bilingual Support**: English and Spanish translations

### 🚧 Pending Backend Integration

See `docs/backend-integration-todos.md` for detailed TODO list.

Key integrations needed:

1. Wallet verification against Mezo system
2. Save entry to database
3. Referral code generation and tracking
4. Leaderboard position retrieval
5. Credit referrer and new user bonuses
6. Social sharing tracking

## Usage

```tsx
import { EntryFormSection } from "@/components/entry-form";
import { getDictionary } from "@/lib/dictionaries";

export default async function Page() {
  const dict = await getDictionary("es");

  return <EntryFormSection dict={dict} lang="es" />;
}
```

## Props

| Prop   | Type         | Description                          |
| ------ | ------------ | ------------------------------------ |
| `dict` | `Dictionary` | Translation dictionary object        |
| `lang` | `string`     | Current language code ("en" or "es") |

## Validation Rules

The component validates wallet addresses according to:

1. **Length**: Must be exactly 42 characters
2. **Prefix**: Must start with "0x"
3. **Format**: Must contain only valid hexadecimal characters (0-9, a-f, A-F)

Example valid address: `0x1234567890abcdef1234567890abcdef12345678`

## Component Structure

```
entry-form/
├── entry-form-section.tsx  # Main component with form and modal
├── index.ts                # Barrel export
└── README.md              # This file
```

## State Management

The component manages the following state:

- `walletAddress`: User input for wallet address
- `error`: Validation or submission error message
- `validationState`: Current validation state ("idle" | "validating" | "valid" | "invalid")
- `isSubmitting`: Loading state during submission
- `isSuccessOpen`: Success modal visibility
- `formData`: Entry data (wallet, referral code, position, entries)
- `isCopied`: Temporary state for copy confirmation

## Real-Time Validation

The component uses a debounced validation strategy with subtle, cohesive visual feedback:

1. **User starts typing** → `validationState` = "validating" (shows muted spinner)
2. **User pauses for 500ms** → Validation runs
3. **Valid address** → `validationState` = "valid" (shows gold checkmark + subtle glow, enables submit)
4. **Invalid address** → `validationState` = "invalid" (shows muted X, displays error)

This provides immediate feedback without spamming validation on every keystroke.

### Design Philosophy Integration

The validation follows a **minimalistic, cohesive** approach:

- **Gold/Bitcoin color palette** - No jarring greens or reds
- **Subtle indicators** - Low opacity icons (40-60%)
- **Elegant glow effect** - Gold shadow on valid state
- **Muted error states** - Error text uses foreground color at 70% opacity
- **Smooth transitions** - 300ms duration for state changes

## Mock Data

Currently uses mock data for:

- **Referral Code**: Generated from wallet address (temporary)
- **Position**: Fixed at #247 (replace with API call)
- **Total Entries**: Fixed at 1 (replace with API call)

## Referral Code Generation

Temporary mock function (`generateMockReferralCode`):

- Takes first 8 characters of wallet address (after "0x")
- Converts to uppercase
- Replaces digits with letters
- Prefixes with "MEZ"

**Example**: `0x1a2b3c4d...` → `MEZABCDEF`

⚠️ This should be replaced with backend generation for:

- Guaranteed uniqueness
- Consistency across sessions
- Security

## Social Sharing

Generates a pre-populated tweet with:

- Participation announcement
- Hashtags: `#MezoLATAM` `#Labitconf2025`
- User's referral link
- Mention of `@MezoNetwork`

Currently trust-based (no verification). See backend todos for verification option.

## Accessibility Features

- Semantic HTML elements
- ARIA labels on all interactive elements
- Error messages with `role="alert"`
- Keyboard navigation support
- Focus visible states
- Screen reader friendly

## Styling

Uses Tailwind CSS following the minimalistic design philosophy:

- **Gold Gradient** (`text-gradient-gold-cosmic`): Headings and key numbers
- **Subtle Borders**: `border-yellow-500/20` for cohesive look
- **Glow Effects**: `shadow-[0_0_20px_rgba(234,179,8,0.1)]` for valid state
- **Backdrop Blur**: `bg-background/50 backdrop-blur-sm` for depth
- **Generous Spacing**: `space-y-8`, `py-4`, `p-6` for breathing room
- **Smooth Transitions**: `transition-all duration-300` on interactive elements
- **Low Opacity Icons**: `text-muted-foreground/40` for subtle indicators
- **Consistent Palette**: Yellow-500 to Orange-500 gradient throughout
- Shadcn UI components with custom styling
- Responsive breakpoints for mobile optimization

## Testing

To test the form:

1. Start dev server: `bun run dev`
2. Navigate to entry form section
3. Enter a test wallet: `0x1234567890123456789012345678901234567890`
4. Submit form
5. Verify success modal appears
6. Test copy link functionality
7. Test social sharing button

## Future Enhancements

- [ ] Real-time wallet verification
- [ ] Live leaderboard position updates
- [ ] Social share verification
- [ ] Progress bar for entry multipliers
- [ ] Confetti animation on successful entry
- [ ] QR code for referral link
- [ ] Email notification option
- [ ] Share analytics tracking
