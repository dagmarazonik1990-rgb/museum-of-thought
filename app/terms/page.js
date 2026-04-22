import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mot-shell mot-legal-shell">
      <div className="mot-bg-grid" />
      <div className="mot-bg-glow mot-bg-glow-a" />
      <div className="mot-bg-glow mot-bg-glow-c" />

      <article className="mot-card mot-legal-card">
        <p className="mot-kicker">Museum of Thought</p>
        <h1 className="mot-title mot-legal-title">Terms of Use</h1>
        <p className="mot-statusline">Last updated: April 22, 2026</p>

        <section className="mot-legal-section">
          <h2>Purpose</h2>
          <p>
            Museum of Thought is provided as a personal thought-mapping and reflection experience for organizing ideas and perspectives.
          </p>
        </section>

        <section className="mot-legal-section">
          <h2>Responsible use</h2>
          <p>
            You are responsible for the content you enter and your decisions based on generated insights.
          </p>
        </section>

        <section className="mot-legal-section">
          <h2>No medical services</h2>
          <p>
            The app is not a medical or therapeutic service and should not be treated as professional medical advice.
          </p>
        </section>

        <section className="mot-legal-section">
          <h2>Availability</h2>
          <p>
            Features may change over time as the product evolves. The service is provided on an "as is" basis during MVP stage.
          </p>
        </section>

        <div className="mot-legal-actions">
          <Link className="mot-btn mot-btn-secondary" href="/">Back to app</Link>
        </div>
      </article>
    </main>
  );
}
