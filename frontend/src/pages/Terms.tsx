import { SEOHead, pageSEO } from '../components/Common/SEOHead';

export const Terms = () => {
  return (
    <>
      <SEOHead {...pageSEO.terms} />
      <div className="min-h-screen pt-24 px-4 pb-12 page-transition">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-orbitron mb-4 neon-glow-cyan">
            Terms of Service
          </h1>
          <p className="text-text-muted">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">1. Acceptance of Terms</h2>
            <p className="text-text-muted leading-relaxed">
              By accessing and using GambleCodez, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">2. Use License</h2>
            <p className="text-text-muted leading-relaxed mb-2">
              Permission is granted to temporarily access GambleCodez for personal, non-commercial transitory viewing only.
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
              <li>You must be 18+ or of legal gambling age in your jurisdiction</li>
              <li>You are responsible for your own gambling decisions</li>
              <li>GambleCodez is for informational purposes only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">3. Disclaimer</h2>
            <p className="text-text-muted leading-relaxed">
              The materials on GambleCodez are provided on an 'as is' basis. GambleCodez makes no warranties, expressed or implied,
              and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions
              of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">4. Limitations</h2>
            <p className="text-text-muted leading-relaxed">
              In no event shall GambleCodez or its suppliers be liable for any damages (including, without limitation, damages for loss
              of data or profit, or due to business interruption) arising out of the use or inability to use the materials on GambleCodez.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">5. Responsible Gambling</h2>
            <p className="text-text-muted leading-relaxed">
              GambleCodez promotes responsible gambling. If you feel you have a gambling problem, please seek help from professional
              organizations such as Gamblers Anonymous or your local support services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">6. Contact Information</h2>
            <p className="text-text-muted leading-relaxed">
              For questions about these Terms, please contact us at{' '}
              <a href="mailto:GambleCodez@gmail.com" className="text-neon-cyan hover:underline">
                GambleCodez@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
    </>
  );
};
