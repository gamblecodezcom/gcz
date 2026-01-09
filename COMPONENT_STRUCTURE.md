# DegenProfileDashboard Component Structure

## Component Hierarchy

```
<DegenProfileDashboard>
│
├── TOP SECTION (Neon Cyan Border)
│   ├── User Info
│   │   ├── Jurisdiction Badge (US)
│   │   ├── Username (@DeGenName)
│   │   └── Telegram Handle (@username)
│   ├── UPDATE USERNAME Button
│   └── Stats Row (Grid 2x2 → 4x1)
│       ├── <StatCard> - Raffle Entries (cyan)
│       ├── <StatCard> - Wheel Spins (pink)
│       ├── <StatCard> - Giveaways (yellow)
│       └── <StatCard> - Linked Casinos (green)
│
├── LINKED CASINO ACCOUNTS (Neon Pink Header)
│   └── <CasinoList>
│       └── Casino Items (map)
│           ├── Casino Icon & Name
│           └── <CasinoBadge> (AVAILABLE/LINKED/CRYPTO S)
│
├── SECRET CODE ENTRY (Neon Pink Border)
│   └── <CodeEntryBox>
│       ├── Input Field
│       ├── SUBMIT Button
│       └── Confirmation Message (if confirmedCode)
│
├── GIVEAWAY REWARDS (Neon Yellow Header) [conditional]
│   └── <RewardCard>
│       ├── Casino Info
│       ├── Reward Amount (large display)
│       └── Details Grid (2x2)
│           ├── Username
│           ├── Logged By
│           ├── Email (col-span-2)
│           └── Reward Date (col-span-2)
│
└── RECENT ACTIVITY (Neon Green Header)
    └── <ActivityFeed>
        └── Activity Items (map)
            ├── Activity Icon
            ├── Description
            ├── Metadata (entries, casino)
            └── Timestamp (relative)
```

## Component Files

```
frontend/src/components/DegenProfile/
├── index.ts                          # Barrel export
├── types.ts                          # TypeScript type definitions
├── README.md                         # Documentation
├── DegenProfileDashboard.tsx         # Main container (380 lines)
├── StatCard.tsx                      # Stat display card (35 lines)
├── CasinoList.tsx                    # Casino list with items (45 lines)
├── CasinoBadge.tsx                   # Status badge (50 lines)
├── CodeEntryBox.tsx                  # Secret code input (75 lines)
├── RewardCard.tsx                    # Giveaway reward card (95 lines)
└── ActivityFeed.tsx                  # Activity timeline (95 lines)
```

## Example Page

```
frontend/src/pages/
└── DegenDashboardExample.tsx         # Full integration example
```

## Color Scheme

| Element | Primary Color | Secondary Color | Border |
|---------|--------------|-----------------|--------|
| Top Section | neon-cyan | neon-pink | neon-cyan/30 |
| Casino Accounts | neon-pink | - | white/10 |
| Secret Code | neon-pink | neon-purple | neon-pink/30 |
| Rewards | neon-yellow | neon-orange | neon-yellow/30 |
| Activity | neon-green | neon-cyan | white/10 |

## Responsive Breakpoints

- **Mobile** (< 768px): 2-column stat grid, stacked layout
- **Tablet** (768px - 1024px): 4-column stat grid, some side-by-side
- **Desktop** (> 1024px): Full grid layout, optimal spacing

## Key Features

✅ **Null-Safe**: All props have safe defaults
✅ **Modular**: Use components independently
✅ **Responsive**: Mobile-first design
✅ **Typed**: Full TypeScript support
✅ **Accessible**: Semantic HTML, ARIA labels
✅ **Animated**: Smooth transitions and hover effects
✅ **Neon Theme**: Consistent with existing design system

## Integration Checklist

- [ ] Import component: `import { DegenProfileDashboard } from '../components/DegenProfile'`
- [ ] Fetch user data from API
- [ ] Pass data as props to component
- [ ] Implement `onUpdateUsername` handler
- [ ] Implement `onSubmitSecretCode` handler
- [ ] Test with null/missing data
- [ ] Test on mobile devices
- [ ] Verify neon styling matches site theme

## API Data Requirements

```typescript
// Minimum data structure needed
{
  username: string | null,
  telegramHandle: string | null,
  jurisdiction: string | null,
  stats: {
    raffleEntries: number,
    wheelSpins: number,
    maxWheelSpins: number,
    giveaways: number,
    linkedCasinos: number
  },
  linkedCasinos: Array<{ name: string, status: string }>,
  recentReward: {
    casino: string,
    reward: string,
    username: string,
    loggedBy: string,
    email: string,
    rewardDate: string
  } | null,
  recentActivities: Array<{
    id: string,
    type: string,
    description: string,
    timestamp: string,
    metadata?: { entries?: number, casino?: string }
  }>
}
```

## Usage Example

```tsx
<DegenProfileDashboard
  username="DeGenName"
  telegramHandle="username"
  jurisdiction="US"
  stats={{
    raffleEntries: 120,
    wheelSpins: 10,
    maxWheelSpins: 10,
    giveaways: 5,
    linkedCasinos: 8,
  }}
  linkedCasinos={[
    { name: 'Runewager', status: 'AVAILABLE' },
    { name: 'Stake', status: 'LINKED' },
  ]}
  onUpdateUsername={handleUpdate}
  onSubmitSecretCode={handleCode}
/>
```
