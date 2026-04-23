import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="mot-shell mot-legal-shell">
      <div className="mot-bg-grid" />
      <div className="mot-bg-glow mot-bg-glow-b" />
      <div className="mot-bg-glow mot-bg-glow-c" />

      <article className="mot-card mot-legal-card">
        <p className="mot-kicker">Museum of Thought</p>
        <h1 className="mot-title mot-legal-title">Contact</h1>
        <p className="mot-subtitle">
          For support, feedback, or early-access conversations, reach out directly.
        </p>

        <section className="mot-legal-section">
          <h2>Email</h2>
          <p>
            <a className="mot-contact-link" href="mailto:stanai@wp.pl">stanai@wp.pl</a>
          </p>
        </section>

        <section className="mot-legal-section">
          <h2>Scope</h2>
          <p>
            Museum of Thought is a reflection and thought-structuring product, not a medical or therapeutic service.
          </p>
        </section>

        <div className="mot-legal-actions">
          <Link className="mot-btn mot-btn-secondary" href="/">Back to app</Link>
        </div>
      </article>
    </main>
  );
}
