"use client";

const defaultQuestions = [
  "What here is a fact, not a fear?",
  "What are you trying to protect?",
  "Which part feels most true?",
  "What would clarity look like here?",
  "What keeps repeating in this thought?",
  "What are you not saying directly?"
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
            <span className="mot-question-index">0{index + 1}</span>
            <p>{question}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildQuestions(selectedThought, insight) {
  const dynamicQuestions = [];

  if (insight?.conflicts?.length) {
    dynamicQuestions.push(`Which conflict matters most right now: "${insight.conflicts[0]}"?`);
  }

  if (insight?.patterns?.length) {
    dynamicQuestions.push(`What happens if you stop obeying this pattern: "${insight.patterns[0]}"?`);
  }

  if (selectedThought?.text) {
    dynamicQuestions.push("What would change if this thought were completely true?");
  }

  return [...dynamicQuestions, ...defaultQuestions].slice(0, 6);
}
