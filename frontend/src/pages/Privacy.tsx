export const Privacy = () => {
  return (
    <div className="min-h-screen pt-24 px-4 pb-12 page-transition">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-orbitron mb-4 neon-glow-cyan">
            Privacy Policy
          </h1>
          <p className="text-text-muted">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">1. Information We Collect</h2>
            <p className="text-text-muted leading-relaxed mb-2">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
              <li>Username and profile information</li>
              <li>Cwallet ID (if provided)</li>
              <li>Raffle PIN (encrypted)</li>
              <li>Newsletter subscription preferences</li>
              <li>Contact form submissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">2. How We Use Your Information</h2>
            <p className="text-text-muted leading-relaxed mb-2">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process raffle entries and manage rewards</li>
              <li>Send you notifications and updates</li>
              <li>Respond to your inquiries</li>
              <li>Detect and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">3. Data Security</h2>
            <p className="text-text-muted leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information.
              Your PIN is encrypted and cannot be recovered if lost. We do not store plaintext passwords.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">4. Cookies and Tracking</h2>
            <p className="text-text-muted leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information.
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">5. Third-Party Services</h2>
            <p className="text-text-muted leading-relaxed">
              Our service may contain links to third-party websites or services. We are not responsible for the privacy
              practices of these third parties. We encourage you to read their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">6. Your Rights</h2>
            <p className="text-text-muted leading-relaxed mb-2">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">7. Contact Us</h2>
            <p className="text-text-muted leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:GambleCodez@gmail.com" className="text-neon-cyan hover:underline">
                GambleCodez@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
