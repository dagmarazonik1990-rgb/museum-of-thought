"use client";

const defaultQuestions = [
  "What here is observable, not imagined?",
  "What are you trying to protect in this situation?",
  "Which part of this thought feels most true right now?",
  "What would a clear next step look like?",
  "What keeps repeating across this map?",
  "What important sentence have you not written yet?"
];

export default function ReflectionMode({ selectedThought, insight }) {
  const questions = buildQuestions(selectedThought, insight);

  return (
    <div className="mot-reflection">
      {selectedThought ? (
        <div className="mot-reflection-anchor">
          <p className="mot-detail-label">Current focus</p>
          <h3 className="mot-reflection-title">{selectedThought.text}</h3>
        </div>
      ) : (
        <div className="mot-reflection-anchor">
          <p className="mot-muted">Select a thought to make reflection more precise.</p>
        </div>
      )}

      <div className="mot-question-stack">
        {questions.map((question, index) => (
          <div key={`${question}-${index}`} className="mot-question-card">
            <span className="mot-question-index">{String(index + 1).padStart(2, "0")}</span>
            <p className="mot-question-text">{question}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildQuestions(selectedThought, insight) {
  const dynamicQuestions = [];

  if (insight?.conflicts?.length) {
    dynamicQuestions.push(`Which conflict needs the most attention right now: "${insight.conflicts[0]}"?`);
  }

  if (insight?.patterns?.length) {
    dynamicQuestions.push(`What changes if you stop reinforcing this pattern: "${insight.patterns[0]}"?`);
  }

  if (selectedThought?.text) {
    dynamicQuestions.push("If this thought were fully true, what action would become obvious?");
  }

  return [...dynamicQuestions, ...defaultQuestions].slice(0, 6);
}
