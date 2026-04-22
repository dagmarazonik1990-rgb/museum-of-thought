"use client";

import { useEffect, useMemo, useState } from "react";
import ThoughtSpace from "../components/ThoughtSpace";
import ThoughtDetail from "../components/ThoughtDetail";
import ReflectionMode from "../components/ReflectionMode";
import {
  createThought,
  createInitialState,
  loadAppState,
  saveAppState
} from "../lib/storage";
import {
  linkThoughtToParent,
  getThoughtById,
  getChildrenOfThought,
  randomPositionNear,
  normalizeThoughts
} from "../lib/thought-utils";

const ANALYSIS_STATES = [
  "Analyzing hidden patterns...",
  "Checking emotional tension...",
  "Structuring your thought..."
];

export default function HomePage() {
  const [appState, setAppState] = useState(createInitialState());
  const [input, setInput] = useState("");
  const [selectedThoughtId, setSelectedThoughtId] = useState(null);
  const [showReflection, setShowReflection] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState("Drop a thought...");
  const [spaceLoaded, setSpaceLoaded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [analysisStep, setAnalysisStep] = useState(0);

  useEffect(() => {
    const loaded = loadAppState();
    setAppState(loaded);
    setSpaceLoaded(true);

    if (loaded.thoughts.length === 0) {
      setStatus("Start by writing what is on your mind.");
      setShowWelcome(true);
    } else {
      setStatus("Your thought space is alive.");
      setShowWelcome(false);
    }
  }, []);

  useEffect(() => {
    if (!spaceLoaded) return;
    saveAppState(appState);
  }, [appState, spaceLoaded]);

  useEffect(() => {
    if (!analyzing) {
      setAnalysisStep(0);
      return;
    }

    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev + 1) % ANALYSIS_STATES.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [analyzing]);

  const selectedThought = useMemo(() => {
    return getThoughtById(appState.thoughts, selectedThoughtId);
  }, [appState.thoughts, selectedThoughtId]);

  const children = useMemo(() => {
    if (!selectedThoughtId) return [];
    return getChildrenOfThought(appState.thoughts, selectedThoughtId);
  }, [appState.thoughts, selectedThoughtId]);

  function handleAddThought(parentId = null) {
    const text = input.trim();
    if (!text) return;

    const parent = parentId ? getThoughtById(appState.thoughts, parentId) : null;
    const position = parent
      ? randomPositionNear(parent.position)
      : {
          x: 50 + Math.round(Math.random() * 20 - 10),
          y: 50 + Math.round(Math.random() * 20 - 10)
        };

    const newThought = createThought(text, position, parentId);

    let nextThoughts = [...appState.thoughts, newThought];
    if (parentId) {
      nextThoughts = linkThoughtToParent(nextThoughts, newThought.id, parentId);
    }

    setAppState((prev) => ({
      ...prev,
      thoughts: normalizeThoughts(nextThoughts)
    }));

    setSelectedThoughtId(newThought.id);
    setInput("");
    setShowWelcome(false);
    setStatus(parentId ? "Sub-thought created." : "Thought created.");
  }

  function handleSelectThought(id) {
    setSelectedThoughtId(id);
    setStatus("Thought selected.");
  }

  function handleMoveThought(id, position) {
    setAppState((prev) => ({
      ...prev,
      thoughts: prev.thoughts.map((thought) =>
        thought.id === id ? { ...thought, position } : thought
      )
    }));
  }

  async function handleAnalyzeThought(id) {
    const thought = getThoughtById(appState.thoughts, id);
    if (!thought) return;

    setAnalyzing(true);
    setStatus(ANALYSIS_STATES[0]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: thought.text
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Analysis failed");
      }

      setAppState((prev) => ({
        ...prev,
        insights: {
          ...prev.insights,
          [id]: data
        }
      }));

      setStatus("Analysis complete.");
    } catch (error) {
      setStatus("AI unavailable. You can still build the map.");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleDeleteThought(id) {
    const thoughtToDelete = getThoughtById(appState.thoughts, id);
    if (!thoughtToDelete) return;

    const idsToDelete = new Set([id]);
    let changed = true;

    while (changed) {
      changed = false;
      for (const thought of appState.thoughts) {
        if (thought.parentId && idsToDelete.has(thought.parentId) && !idsToDelete.has(thought.id)) {
          idsToDelete.add(thought.id);
          changed = true;
        }
      }
    }

    const filteredThoughts = appState.thoughts.filter((t) => !idsToDelete.has(t.id));
    const nextInsights = { ...appState.insights };

    for (const key of Object.keys(nextInsights)) {
      if (idsToDelete.has(key)) {
        delete nextInsights[key];
      }
    }

    setAppState((prev) => ({
      ...prev,
      thoughts: filteredThoughts,
      insights: nextInsights
    }));

    if (selectedThoughtId && idsToDelete.has(selectedThoughtId)) {
      setSelectedThoughtId(null);
    }

    if (filteredThoughts.length === 0) {
      setShowWelcome(true);
      setStatus("Start by writing what is on your mind.");
    } else {
      setStatus("Thought removed.");
    }
  }

  function handleResetAll() {
    const confirmed = window.confirm("Delete the whole thought space?");
    if (!confirmed) return;

    const fresh = createInitialState();
    setAppState(fresh);
    setSelectedThoughtId(null);
    setInput("");
    setShowWelcome(true);
    setStatus("Thought space cleared.");
  }

  const heroCopy =
    appState.thoughts.length === 0
      ? "A private space for mapping thoughts, tension, desire and clarity."
      : "Turn raw thoughts into structure, reflection and insight.";

  return (
    <main className="mot-shell">
      <div className="mot-bg-grid" />
      <div className="mot-bg-glow mot-bg-glow-a" />
      <div className="mot-bg-glow mot-bg-glow-b" />
      <div className="mot-bg-glow mot-bg-glow-c" />

      <header className="mot-topbar">
        <div className="mot-hero-copy">
          <p className="mot-kicker">Museum of Thought</p>
          <h1 className="mot-title">Your thought space</h1>
          <p className="mot-subtitle">{heroCopy}</p>
          <p className="mot-statusline">
            {analyzing ? ANALYSIS_STATES[analysisStep] : status}
          </p>
        </div>

        <div className="mot-topbar-actions">
          <button
            className="mot-btn mot-btn-ghost"
            onClick={() => setShowReflection((prev) => !prev)}
          >
            {showReflection ? "Close reflection" : "Reflection"}
          </button>

          <button className="mot-btn mot-btn-danger" onClick={handleResetAll}>
            Reset
          </button>
        </div>
      </header>

      {showWelcome ? (
        <section className="mot-welcome-card">
          <div className="mot-welcome-orb" />
          <div className="mot-welcome-copy">
            <p className="mot-label">Start here</p>
            <h2 className="mot-welcome-title">Drop the first thought. Do not organize it yet.</h2>
            <p className="mot-welcome-text">
              Write one sentence. The space will begin to connect meaning, tension and direction around it.
            </p>
          </div>
        </section>
      ) : null}

      <section className="mot-composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Drop a thought..."
          className="mot-textarea"
          rows={3}
        />

        <div className="mot-composer-actions">
          <button
            className="mot-btn mot-btn-primary"
            onClick={() => handleAddThought(null)}
          >
            Create thought
          </button>

          {selectedThoughtId ? (
            <button
              className="mot-btn mot-btn-secondary"
              onClick={() => handleAddThought(selectedThoughtId)}
            >
              Add sub-thought
            </button>
          ) : null}
        </div>
      </section>

      <section className="mot-content-grid">
        <div className="mot-card mot-space-card">
          <div className="mot-card-head">
            <div>
              <p className="mot-label">Explore</p>
              <h2 className="mot-section-title">Thought space</h2>
            </div>
            <p className="mot-card-meta">
              {appState.thoughts.length} thought{appState.thoughts.length === 1 ? "" : "s"}
            </p>
          </div>

          <ThoughtSpace
            thoughts={appState.thoughts}
            selectedThoughtId={selectedThoughtId}
            onSelectThought={handleSelectThought}
            onMoveThought={handleMoveThought}
          />
        </div>

        <div className="mot-side-stack">
          <div className="mot-card">
            <div className="mot-card-head">
              <div>
                <p className="mot-label">Focus</p>
                <h2 className="mot-section-title">Thought room</h2>
              </div>
            </div>

            <ThoughtDetail
              thought={selectedThought}
              children={children}
              insight={selectedThought ? appState.insights[selectedThought.id] : null}
              analyzing={analyzing}
              onAnalyze={() => selectedThought && handleAnalyzeThought(selectedThought.id)}
              onDelete={() => selectedThought && handleDeleteThought(selectedThought.id)}
              onSelectThought={handleSelectThought}
            />
          </div>

          {showReflection ? (
            <div className="mot-card">
              <div className="mot-card-head">
                <div>
                  <p className="mot-label">Reflection</p>
                  <h2 className="mot-section-title">Slow thinking mode</h2>
                </div>
              </div>

              <ReflectionMode
                selectedThought={selectedThought}
                insight={selectedThought ? appState.insights[selectedThought.id] : null}
              />
            </div>
          ) : null}
        </div>
      </section>

      <footer className="mot-footer">
        <div className="mot-footer-left">
          <span>Museum of Thought © 2026</span>
        </div>
        <div className="mot-footer-links">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
      </footer>
    </main>
  );
}
