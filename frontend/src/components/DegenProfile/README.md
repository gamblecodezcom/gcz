# DegenProfileDashboard Component

A complete, modular dashboard component for displaying user profile information, casino links, stats, and activity with a neon/degen aesthetic.

## Features

- **Responsive Design**: Mobile-first layout that scales beautifully
- **Neon Aesthetic**: Uses your existing Tailwind neon color scheme
- **Modular Components**: Fully composable subcomponents
- **Null-Safe**: All fields render with safe defaults
- **No AI Dependency**: Pure React/TypeScript with no external AI requirements

## Components

### Main Component

- `<DegenProfileDashboard>` - Main container component

### Subcomponents

- `<StatCard>` - Displays individual stat with neon styling
- `<CasinoList>` - List of linked casino accounts
- `<CasinoBadge>` - Status badge for casino links
- `<CodeEntryBox>` - Secret code input with validation
- `<RewardCard>` - Giveaway reward display card
- `<ActivityFeed>` - Recent activity timeline

## Usage

```tsx
import { DegenProfileDashboard } from '../components/DegenProfile';

export const MyPage = () => {
  return (
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
      recentReward={{
        casino: 'Runewager',
        reward: '5C Tip',
        username: 'degen_user',
        loggedBy: 'Admin',
        email: 'example@email.com',
        rewardDate: '2024-01-09',
      }}
      recentActivities={[
        {
          id: '1',
          type: 'casino_link',
          description: 'Linked Winna account',
          timestamp: new Date().toISOString(),
        },
      ]}
      onUpdateUsername={() => console.log('Update username')}
      onSubmitSecretCode={(code) => console.log('Code:', code)}
      confirmedCode="2022-SC"
    />
  );
};
```

## Props

### DegenProfileDashboard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `username` | `string \| null` | `null` | User's display name |
| `telegramHandle` | `string \| null` | `null` | Telegram username |
| `jurisdiction` | `string \| null` | `'US'` | User's jurisdiction badge |
| `stats` | `object` | `{}` | Stats object with raffleEntries, wheelSpins, etc. |
| `linkedCasinos` | `array` | `[]` | Array of linked casino objects |
| `recentReward` | `object \| null` | `null` | Most recent giveaway reward |
| `recentActivities` | `array` | `[]` | Array of recent activity objects |
| `onUpdateUsername` | `function` | `undefined` | Handler for username update |
| `onSubmitSecretCode` | `function` | `undefined` | Handler for secret code submission |
| `confirmedCode` | `string \| null` | `null` | Last confirmed secret code |

### LinkedCasino Object

```typescript
{
  name: string;
  status: 'AVAILABLE' | 'LINKED' | 'CRYPTO S' | string;
}
```

### Activity Object

```typescript
{
  id: string;
  type: string; // 'casino_link', 'raffle_entry', 'wheel_spin', etc.
  description: string;
  timestamp: string; // ISO 8601 format
  metadata?: {
    entries?: number;
    casino?: string;
  };
}
```

## Styling

All components use Tailwind CSS with your existing neon color scheme:

- `neon-cyan` - Primary accent
- `neon-pink` - Secondary accent
- `neon-yellow` - Rewards/highlights
- `neon-green` - Success states
- `bg-dark`, `bg-dark-2`, `bg-dark-3` - Dark backgrounds

## Customization

### Individual Components

You can use subcomponents individually:

```tsx
import { StatCard, CasinoList, ActivityFeed } from '../components/DegenProfile';

// Use individual components
<StatCard label="RAFFLE ENTRIES" value={120} variant="cyan" />
<CasinoList casinos={casinos} />
<ActivityFeed activities={activities} />
```

### Variants

StatCard supports color variants:
- `cyan` (default)
- `pink`
- `yellow`
- `green`

## Integration Guide

1. **Fetch User Data**: Replace mock data with API calls to your backend
2. **Implement Handlers**: Add logic for `onUpdateUsername` and `onSubmitSecretCode`
3. **Type Safety**: All components are fully typed with TypeScript
4. **Error Handling**: Components gracefully handle missing or null data

## Example Integration

See `/frontend/src/pages/DegenDashboardExample.tsx` for a complete example with:
- Mock data structure
- Handler implementations
- API integration patterns
- Error handling examples

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Mobile responsive (320px+)
- Tested on Chrome, Firefox, Safari, Edge

## Dependencies

- React 18+
- TypeScript 4.5+
- Tailwind CSS 3+

No additional dependencies required!
