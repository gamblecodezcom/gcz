export const Leaderboard = () => {
  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-orbitron mb-4 neon-glow-yellow">
            Leaderboard
          </h1>
          <p className="text-text-muted">
            Top performers and raffle winners
          </p>
        </div>

        <div className="bg-bg-dark-2 border-2 border-neon-yellow/30 rounded-xl p-8 text-center card-hover">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-text-muted text-lg">Leaderboard coming soon...</p>
          <p className="text-text-muted text-sm mt-2">Track top performers and raffle winners</p>
        </div>
      </div>
    </div>
  );
};
