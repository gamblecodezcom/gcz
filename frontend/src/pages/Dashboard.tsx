import { useState, useEffect } from 'react';
import { getProfile, getDashboardStats } from '../utils/api';
import { PlayerIdentityHeader } from '../components/Dashboard/PlayerIdentityHeader';
import { LinkedCasinoAccountsGrid } from '../components/Dashboard/LinkedCasinoAccountsGrid';
import { GiveawayRewardsPanel } from '../components/Dashboard/GiveawayRewardsPanel';
import { RafflesPanel } from '../components/Dashboard/RafflesPanel';
import { DegenWheelPanel } from '../components/Dashboard/DegenWheelPanel';
import { ActivityLog } from '../components/Dashboard/ActivityLog';
import { SettingsPanel } from '../components/Dashboard/SettingsPanel';
import { PinUnlockModal } from '../components/Dashboard/PinUnlockModal';
import { XPLevelPanel } from '../components/Dashboard/XPLevelPanel';
import { AchievementsPanel } from '../components/Dashboard/AchievementsPanel';
import { MissionsPanel } from '../components/Dashboard/MissionsPanel';
import { useRealtime } from '../hooks/useRealtime';
import { SEOHead, pageSEO } from '../components/Common/SEOHead';
import type { User, DashboardStats as DashboardStatsType } from '../types';

export const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPinUnlocked, setIsPinUnlocked] = useState(() => {
    return sessionStorage.getItem('pin_unlocked') === 'true';
  });
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, statsData] = await Promise.all([
          getProfile(),
          getDashboardStats().catch(() => ({
            raffleEntries: 0,
            raffleEntriesToday: 0,
            wheelSpinsRemaining: 0,
            giveawaysReceived: 0,
            linkedCasinos: 0,
          })),
        ]);
        setUser(profileData.user);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Real-time updates
  useRealtime({
    userId: user?.id,
    eventTypes: ['wheel:spin', 'giveaway:entry', 'raffle:entry', 'reward:received'],
    onEvent: (event) => {
      console.log('Real-time event received:', event);
      // Refresh dashboard data on relevant events
      if (['wheel:spin', 'giveaway:entry', 'raffle:entry', 'reward:received'].includes(event.type)) {
        handleUpdate();
      }
    },
  });

  const handlePinSuccess = () => {
    setIsPinUnlocked(true);
    sessionStorage.setItem('pin_unlocked', 'true');
  };

  const handlePinRequired = () => {
    setShowPinModal(true);
  };

  const handleUpdate = async () => {
    try {
      const profileData = await getProfile();
      setUser(profileData.user);
      const statsData = await getDashboardStats().catch(() => ({
        raffleEntries: 0,
        raffleEntriesToday: 0,
        wheelSpinsRemaining: 0,
        giveawaysReceived: 0,
        linkedCasinos: 0,
      }));
      setStats(statsData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  if (!user || !stats) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-text-muted">Failed to load dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead {...pageSEO.dashboard} />
      <div className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="container mx-auto max-w-7xl">
          {/* Player Identity Header */}
          <div className="mb-6 sm:mb-8">
            <PlayerIdentityHeader
              user={user}
              stats={stats}
              onUpdate={handleUpdate}
            />
          </div>

          {/* Main Content Grid - Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Main Features */}
            <div className="lg:col-span-2 space-y-6">
              {/* Linked Casino Accounts Grid */}
              <LinkedCasinoAccountsGrid
                isPinUnlocked={isPinUnlocked}
                onPinRequired={handlePinRequired}
                onLinkSuccess={handleUpdate}
              />

              {/* Giveaway & Rewards Panel */}
              <GiveawayRewardsPanel
                user={user}
                isPinUnlocked={isPinUnlocked}
                onPinRequired={handlePinRequired}
              />

              {/* Raffles Panel */}
              <RafflesPanel onEntryAdded={handleUpdate} />

              {/* Degen Wheel Panel */}
              <DegenWheelPanel
                spinsRemaining={stats.wheelSpinsRemaining}
                onSpinComplete={handleUpdate}
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Gamification Panels */}
              <XPLevelPanel />
              <MissionsPanel />
              <AchievementsPanel />
            </div>
          </div>

          {/* Full Width Sections */}
          <div className="space-y-6">
            {/* Activity Log */}
            <ActivityLog limit={50} />

            {/* Settings Panel */}
            <SettingsPanel user={user} onUpdate={handleUpdate} />
          </div>
        </div>

        {/* PIN Modal for required actions */}
        <PinUnlockModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={handlePinSuccess}
        />
      </div>
    </>
  );
};
