import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mot-shell mot-legal-shell">
      <div className="mot-bg-grid" />
      <div className="mot-bg-glow mot-bg-glow-a" />
      <div className="mot-bg-glow mot-bg-glow-b" />

      <article className="mot-card mot-legal-card">
        <p className="mot-kicker">Museum of Thought</p>
        <h1 className="mot-title mot-legal-title">Privacy Policy</h1>
        <p className="mot-statusline">Last updated: April 22, 2026</p>

        <section className="mot-legal-section">
          <h2>What this app stores</h2>
          <p>
            Museum of Thought stores your thought map in your browser using localStorage for MVP functionality.
          </p>
        </section>

        <section className="mot-legal-section">
          <h2>AI analysis data</h2>
          <p>
            If you use AI insight, the selected thought text is sent to the configured OpenAI API endpoint through /api/analyze.
          </p>
        </section>

        <section className="mot-legal-section">
          <h2>Medical disclaimer</h2>
          <p>
            Museum of Thought is a reflection and thought-structuring tool. It does not provide medical advice, diagnosis, or therapy.
          </p>
        </section>

        <section className="mot-legal-section">
          <h2>Your control</h2>
          <p>
            You can clear local data at any time using the reset action in the app or by clearing browser storage.
          </p>
        </section>

        <div className="mot-legal-actions">
          <Link className="mot-btn mot-btn-secondary" href="/">Back to app</Link>
        </div>
      </article>
    </main>
  );
}
