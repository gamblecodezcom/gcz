import { Link } from 'react-router-dom';
import { SEOHead, pageSEO } from '../components/Common/SEOHead';

export const Home = () => {
  return (
    <>
      <SEOHead {...pageSEO.home} />
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-neon-cyan/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-pink/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headline + CTAs */}
            <div className="hero-fade-in">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-orbitron mb-6 leading-tight">
                <span className="neon-glow-cyan block mb-2">Redeem Today,</span>
                <span className="neon-glow-pink block">Flex Tomorrow</span>
              </h1>
              <p className="text-xl md:text-2xl text-text-secondary mb-10 leading-relaxed">
                Track casino drops, enter raffles, and redeem Cwallet-ready rewards.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/drops"
                  className="btn-neon px-8 py-4 bg-neon-cyan text-bg-dark font-bold rounded-xl hover:shadow-glow-cyan transition-all relative overflow-hidden text-lg"
                >
                  <span className="relative z-10">View Drops</span>
                </Link>
                <Link
                  to="/raffles"
                  className="btn-neon px-8 py-4 bg-neon-pink text-white font-bold rounded-xl hover:shadow-glow-pink transition-all relative overflow-hidden text-lg"
                >
                  <span className="relative z-10">Enter Raffles</span>
                </Link>
                <Link
                  to="/wheel"
                  className="btn-neon px-8 py-4 bg-neon-yellow text-bg-dark font-bold rounded-xl hover:shadow-glow-yellow transition-all relative overflow-hidden text-lg"
                >
                  <span className="relative z-10">Spin Wheel</span>
                </Link>
                <Link
                  to="/affiliates"
                  className="btn-neon px-8 py-4 bg-neon-green text-bg-dark font-bold rounded-xl hover:shadow-glow-green transition-all relative overflow-hidden text-lg"
                >
                  <span className="relative z-10">Site Listings</span>
                </Link>
              </div>
            </div>

            {/* Right: Hero Cards */}
            <div className="space-y-6 hero-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-bg-card border-2 border-neon-cyan/40 rounded-2xl p-8 card-hover relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-neon-cyan mb-3 neon-glow-cyan">🎁 Daily Drops</h3>
                  <p className="text-text-secondary text-lg">Fresh promo codes and links updated daily</p>
                </div>
              </div>
              <div className="bg-bg-card border-2 border-neon-pink/40 rounded-2xl p-8 card-hover relative overflow-hidden group" style={{ animationDelay: '0.4s' }}>
                <div className="absolute inset-0 bg-gradient-neon-pink opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-neon-pink mb-3 neon-glow-pink">🎰 Raffles</h3>
                  <p className="text-text-secondary text-lg">Win crypto, Cwallet tips, and platform rewards</p>
                </div>
              </div>
              <div className="bg-bg-card border-2 border-neon-yellow/40 rounded-2xl p-8 card-hover relative overflow-hidden group" style={{ animationDelay: '0.6s' }}>
                <div className="absolute inset-0 bg-gradient-neon-yellow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-neon-yellow mb-3 neon-glow-yellow">🎲 Degen Wheel</h3>
                  <p className="text-text-secondary text-lg">Spin daily for instant rewards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/3 to-transparent" />
        <div className="container mx-auto relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-center mb-16 neon-glow-cyan font-orbitron">
            Why GambleCodez?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-bg-card border-2 border-neon-cyan/40 rounded-2xl p-8 text-center card-hover group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">⚡</div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-neon-cyan transition-colors neon-glow-cyan group-hover:neon-glow-cyan">Instant Updates</h3>
              <p className="text-text-secondary text-lg">Get notified the moment new drops and raffles go live</p>
            </div>
            <div className="bg-bg-card border-2 border-neon-pink/40 rounded-2xl p-8 text-center card-hover group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🔒</div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-neon-pink transition-colors neon-glow-pink group-hover:neon-glow-pink">Safety First</h3>
              <p className="text-text-secondary text-lg">Blacklist protection and verified sites only</p>
            </div>
            <div className="bg-bg-card border-2 border-neon-green/40 rounded-2xl p-8 text-center card-hover group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">💰</div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-neon-green transition-colors neon-glow-green group-hover:neon-glow-green">Cwallet Ready</h3>
              <p className="text-text-secondary text-lg">Direct integration with Cwallet for seamless rewards</p>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};
