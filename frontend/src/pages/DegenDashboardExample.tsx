import { DegenProfileDashboard } from '../components/DegenProfile';
import { SEOHead } from '../components/Common/SEOHead';

/**
 * Example usage of the DegenProfileDashboard component
 *
 * This is a demonstration page showing how to integrate the
 * DegenProfileDashboard with sample data. Replace with real
 * API calls in production.
 */
export const DegenDashboardExample = () => {
  // Example data - replace with actual API calls
  const mockData = {
    username: 'DeGenName',
    telegramHandle: 'username',
    jurisdiction: 'US',
    stats: {
      raffleEntries: 120,
      wheelSpins: 10,
      maxWheelSpins: 10,
      giveaways: 5,
      linkedCasinos: 8,
    },
    linkedCasinos: [
      { name: 'Runewager', status: 'AVAILABLE' as const },
      { name: 'Stake', status: 'CRYPTO S' as const },
      { name: 'Stake', status: 'LINKED' as const },
      { name: 'shuffle', status: 'LINKED' as const },
      { name: 'SHUFFLE', status: 'LINKED' as const },
      { name: 'GOATED', status: 'LINKED' as const },
    ],
    recentReward: {
      casino: 'Runewager',
      reward: '5C Tip',
      username: 'degen_user',
      loggedBy: 'Admin',
      email: 'example@email.com',
      rewardDate: 'CAUSTAT =',
    },
    recentActivities: [
      {
        id: '1',
        type: 'casino_link',
        description: 'Linked Winna account',
        timestamp: new Date().toISOString(),
        metadata: { casino: 'Winna' },
      },
      {
        id: '2',
        type: 'raffle_entry',
        description: 'Entered raffle',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        metadata: { entries: 10 },
      },
    ],
    confirmedCode: '2022-SC',
  };

  const handleUpdateUsername = () => {
    console.log('Update username clicked');
    // TODO: Implement username update logic
    alert('Username update feature - connect to your API');
  };

  const handleSubmitSecretCode = async (code: string) => {
    console.log('Secret code submitted:', code);
    // TODO: Implement secret code submission logic
    alert(`Secret code submitted: ${code}`);

    // Example: Make API call
    // const response = await fetch('/api/secret-codes', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ code }),
    // });
    // const data = await response.json();
    // Handle response...
  };

  return (
    <>
      <SEOHead
        title="Degen Profile Dashboard"
        description="Your complete degen profile dashboard with stats, linked casinos, and activity feed."
        noindex={true}
      />
      <div className="min-h-screen pt-24 px-4 pb-12 bg-gradient-dark">
        <div className="container mx-auto max-w-6xl">
          {/* Hero Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neon-cyan mb-4 bg-neon-cyan/10">
              Degen Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-orbitron mb-3 bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-yellow bg-clip-text text-transparent">
              Your Degen Command Center
            </h1>
            <p className="text-text-muted max-w-2xl mx-auto">
              Track your raffles, manage casino links, and unlock secret rewards all in one place.
            </p>
          </div>

          {/* Main Dashboard Component */}
          <DegenProfileDashboard
            username={mockData.username}
            telegramHandle={mockData.telegramHandle}
            jurisdiction={mockData.jurisdiction}
            stats={mockData.stats}
            linkedCasinos={mockData.linkedCasinos}
            recentReward={mockData.recentReward}
            recentActivities={mockData.recentActivities}
            onUpdateUsername={handleUpdateUsername}
            onSubmitSecretCode={handleSubmitSecretCode}
            confirmedCode={mockData.confirmedCode}
          />

          {/* Integration Notes */}
          <div className="mt-12 p-6 border border-neon-cyan/30 rounded-2xl bg-bg-dark-2">
            <h3 className="text-neon-cyan font-bold mb-3 flex items-center gap-2">
              <span>💡</span>
              Integration Guide
            </h3>
            <div className="space-y-2 text-sm text-text-muted">
              <p>• Replace mock data with actual API calls to your backend</p>
              <p>• Implement <code className="text-neon-pink">onUpdateUsername</code> handler to update user profile</p>
              <p>• Implement <code className="text-neon-pink">onSubmitSecretCode</code> handler to submit secret codes</p>
              <p>• All components are null-safe and will render with defaults if data is missing</p>
              <p>• Components use your existing Tailwind neon color scheme</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
