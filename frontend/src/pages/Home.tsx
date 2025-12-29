import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headline + CTAs */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold font-orbitron mb-6">
                <span className="neon-glow-cyan">Redeem Today,</span>
                <br />
                <span className="neon-glow-pink">Flex Tomorrow</span>
              </h1>
              <p className="text-xl text-text-muted mb-8">
                Track casino drops, enter raffles, and redeem Cwallet-ready rewards.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/drops"
                  className="btn-neon px-6 py-3 bg-neon-cyan text-bg-dark font-bold rounded-xl hover:shadow-neon-cyan transition-all relative overflow-hidden"
                >
                  <span className="relative z-10">View Drops</span>
                </Link>
                <Link
                  to="/raffles"
                  className="btn-neon px-6 py-3 bg-neon-pink text-white font-bold rounded-xl hover:shadow-neon-pink transition-all relative overflow-hidden"
                >
                  <span className="relative z-10">Enter Raffles</span>
                </Link>
                <Link
                  to="/wheel"
                  className="btn-neon px-6 py-3 bg-neon-yellow text-bg-dark font-bold rounded-xl hover:shadow-neon-yellow transition-all relative overflow-hidden"
                >
                  <span className="relative z-10">Spin Wheel</span>
                </Link>
              </div>
            </div>

            {/* Right: Hero Cards */}
            <div className="space-y-4">
              <div className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-xl p-6 card-hover relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <h3 className="text-2xl font-bold text-neon-cyan mb-2 relative z-10">🎁 Daily Drops</h3>
                <p className="text-text-muted relative z-10">Fresh promo codes and links updated daily</p>
              </div>
              <div className="bg-bg-dark-2 border-2 border-neon-pink/30 rounded-xl p-6 card-hover relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <h3 className="text-2xl font-bold text-neon-pink mb-2 relative z-10">🎰 Raffles</h3>
                <p className="text-text-muted relative z-10">Win crypto, Cwallet tips, and platform rewards</p>
              </div>
              <div className="bg-bg-dark-2 border-2 border-neon-yellow/30 rounded-xl p-6 card-hover relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-yellow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <h3 className="text-2xl font-bold text-neon-yellow mb-2 relative z-10">🎲 Degen Wheel</h3>
                <p className="text-text-muted relative z-10">Spin daily for instant rewards</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 neon-glow-cyan">Why GambleCodez?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-xl p-6 text-center card-hover group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-neon-cyan transition-colors">Instant Updates</h3>
              <p className="text-text-muted">Get notified the moment new drops and raffles go live</p>
            </div>
            <div className="bg-bg-dark-2 border-2 border-neon-pink/30 rounded-xl p-6 text-center card-hover group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🔒</div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-neon-pink transition-colors">Safety First</h3>
              <p className="text-text-muted">Blacklist protection and verified sites only</p>
            </div>
            <div className="bg-bg-dark-2 border-2 border-neon-green/30 rounded-xl p-6 text-center card-hover group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">💰</div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-neon-green transition-colors">Cwallet Ready</h3>
              <p className="text-text-muted">Direct integration with Cwallet for seamless rewards</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
