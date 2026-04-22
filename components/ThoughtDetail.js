"use client";

export default function ThoughtDetail({
  thought,
  children,
  insight,
  analyzing,
  onAnalyze,
  onDelete,
  onSelectThought
}) {
  if (!thought) {
    return (
      <div className="mot-empty-panel">
        <p className="mot-empty-title">No thought selected</p>
        <p className="mot-empty-copy">
          Select an orb to open its thought room, review links, and generate insight.
        </p>
      </div>
    );
  }

  return (
    <div className="mot-detail">
      <div className="mot-thought-hero">
        <p className="mot-detail-label">Current thought</p>
        <h3 className="mot-thought-text">{thought.text}</h3>

        <div className="mot-pill-row">
          <span className="mot-pill">
            {thought.parentId ? "Sub-thought" : "Root thought"}
          </span>
          <span className="mot-pill">{thought.type}</span>
        </div>
      </div>

      <div className="mot-detail-actions">
        <button className="mot-btn mot-btn-primary" onClick={onAnalyze} disabled={analyzing}>
          {analyzing ? "Analyzing..." : "Generate insight"}
        </button>

        <button className="mot-btn mot-btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>

      <div className="mot-detail-section">
        <p className="mot-detail-label">Connected sub-thoughts</p>

        {children.length === 0 ? (
          <p className="mot-muted">No sub-thoughts yet. Add one to expand this thread.</p>
        ) : (
          <div className="mot-chip-list">
            {children.map((child) => (
              <button
                key={child.id}
                className="mot-chip"
                onClick={() => onSelectThought(child.id)}
              >
                {child.text}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mot-detail-section">
        <p className="mot-detail-label">AI insight</p>

        {!insight ? (
          <p className="mot-muted">
            No insight yet. Run analysis to reveal summary, emotional tone, friction points, patterns, and next-step prompts.
          </p>
        ) : (
          <div className="mot-insight-card">
            <div className="mot-insight-summary-wrap">
              <p className="mot-detail-label">Summary</p>
              <p className="mot-insight-summary">{insight.summary}</p>
            </div>

            <div className="mot-metadata-grid">
              <div className="mot-meta-box">
                <span className="mot-meta-title">Type</span>
                <strong>{insight.type}</strong>
              </div>

              <div className="mot-meta-box">
                <span className="mot-meta-title">Emotion</span>
                <strong>{insight.emotion}</strong>
              </div>
            </div>

            <InsightList title="Conflicts" items={insight.conflicts} />
            <InsightList title="Patterns" items={insight.patterns} />
            <InsightList title="Suggestions" items={insight.suggestions} />
          </div>
        )}
      </div>
    </div>
  );
}

function InsightList({ title, items }) {
  return (
    <div className="mot-insight-block">
      <p className="mot-detail-label">{title}</p>
      {items?.length ? (
        <ul className="mot-list">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mot-muted">No items yet.</p>
      )}
    </div>
  );
}
