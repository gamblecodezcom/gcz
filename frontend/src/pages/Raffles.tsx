import { useState, useEffect } from 'react';
import { getRaffles } from '../utils/api';
import { RaffleJoinModal } from '../components/Raffles/RaffleJoinModal';
import { SEOHead, pageSEO } from '../components/Common/SEOHead';
import { InlineHelper } from '../components/Common/Tooltip';
import type { Raffle, Profile } from '../types';

export const Raffles = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [profile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchRaffles = async () => {
      setLoading(true);
      try {
        const rafflesData = await getRaffles();
        setRaffles(rafflesData);
      } catch (error) {
        console.error('Failed to fetch raffles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRaffles();
  }, []);

  const handleJoin = async (data: { cwalletId: string; pin: string; newsletterAgreed: boolean }) => {
    // TODO: Implement API call to join raffle system
    console.log('Joining raffle system:', data);
  };

  return (
    <>
      <SEOHead {...pageSEO.raffles} />
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-10 mb-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neon-pink mb-4">
                Vault Raffles
              </div>
              <h1 className="text-4xl md:text-5xl font-orbitron mb-4">
                Sweepstakes raffles
                <span className="text-neon-yellow"> with real energy.</span>
              </h1>
              <p className="text-text-muted max-w-2xl">
                Claim tickets, follow drops, and score bonus giveaways. We keep it fair, fast, and
                transparent.
              </p>
              <InlineHelper text="Raffles may require newsletter subscription or account linking. Winners are chosen randomly from valid entries. Draws occur at scheduled times." />
            </div>
            {(!profile || !profile.user.hasRaffleAccess) && (
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn-neon px-6 py-3 bg-neon-pink text-white font-semibold rounded-2xl shadow-glow-pink"
              >
                Join Raffles
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
            </div>
          ) : raffles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted text-lg">No active raffles at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {raffles.map((raffle) => (
                <div
                  key={raffle.id}
                  className="bg-bg-dark-2 border border-white/10 rounded-2xl p-6 card-hover relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-neon-pink">{raffle.title}</h3>
                    {raffle.isSecret && (
                      <span className="px-2 py-1 bg-neon-cyan/15 border border-neon-cyan/40 rounded text-xs text-neon-cyan">
                        Secret
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted mb-4">{raffle.description}</p>
                  <div className="mb-4">
                    <div className="text-sm text-text-muted mb-1">Prize:</div>
                    <div className="text-lg font-semibold text-neon-yellow">{raffle.prize}</div>
                  </div>
                  {raffle.secretCode && (
                    <div className="mb-4 p-3 bg-bg-dark rounded-xl border border-white/10">
                      <div className="text-xs text-text-muted mb-1">Secret Code:</div>
                      <div className="font-mono text-neon-cyan">{raffle.secretCode}</div>
                    </div>
                  )}
                  <div className="text-sm text-text-muted mb-2">
                    Winners: {raffle.winners.length} / {raffle.maxWinners}
                  </div>
                  <div className="text-xs text-text-muted">
                    Ends: {new Date(raffle.endsAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 p-6 bg-bg-dark-2 border border-white/10 rounded-2xl text-sm text-text-muted">
            <p>
              <strong>Disclaimer:</strong> GambleCodez tracks entries and rewards only. Raffles are promotional,
              not real-money gambling. Your PIN and Cwallet ID are your responsibility.
            </p>
          </div>
        </div>

      <RaffleJoinModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoin}
        hasCwallet={!!profile?.user.cwallet_id}
      />
    </div>
    </>
  );
};
