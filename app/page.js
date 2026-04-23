"use client";

import Link from "next/link";
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
  "Reading emotional texture...",
  "Tracing hidden patterns...",
  "Composing structured insight..."
];

export default function HomePage() {
  const [appState, setAppState] = useState(createInitialState());
  const [input, setInput] = useState("");
  const [selectedThoughtId, setSelectedThoughtId] = useState(null);
  const [showReflection, setShowReflection] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState("Drop the first thought.");
  const [spaceLoaded, setSpaceLoaded] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const loaded = loadAppState();
    setAppState(loaded);
    setSpaceLoaded(true);

    if (loaded.thoughts.length === 0) {
      setStatus("Drop the first thought. Do not organize it yet.");
      setShowWelcome(true);
    } else {
      setStatus("Your map is active.");
      setShowWelcome(false);
    }
  }, []);

  useEffect(() => {
    if (!spaceLoaded) return;
    saveAppState(appState);
  }, [appState, spaceLoaded]);

  useEffect(() => {
    if (!composerOpen) return;
    inputRef.current?.focus();
  }, [composerOpen]);

  function handleAddThought(parentId = null) {
    const text = input.trim();
    if (!text) return;

    const parent = appState.thoughts.find((thought) => thought.id === parentId);
    const position = parent
      ? randomPositionNear(parent.position)
      : {
          x: 50 + Math.round(Math.random() * 28 - 14),
          y: 50 + Math.round(Math.random() * 28 - 14)
        };

    const newThought = createThought(text, position, parentId);

    setAppState((prev) => ({
      ...prev,
      thoughts: normalizeThoughts([...prev.thoughts, newThought])
    }));

    setSelectedThoughtId(newThought.id);
    setInput("");
    setShowWelcome(false);
    setStatus(parentId ? "Sub-thought added." : "Thought added.");
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

      setStatus("Insight ready.");
    } catch (error) {
      setStatus("AI is unavailable right now. Mapping still works.");
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
      setStatus("Drop the first thought. Do not organize it yet.");
    } else {
      setStatus("Thought removed.");
    }
  }

  function handleResetAll() {
    const confirmed = window.confirm("Delete the entire thought map?");
    if (!confirmed) return;

    const fresh = createInitialState();
    setAppState(fresh);
    setSelectedThoughtId(null);
    setInput("");
    setShowWelcome(true);
    setStatus("Thought map cleared.");
  }

  const heroCopy =
    appState.thoughts.length === 0
      ? "A private cognitive canvas for mapping thoughts, relationships, tension, and clarity."
      : "Shape raw thoughts into connected structure, reflection, and perspective.";

  return (
    <main className="mot-shell">
      <div className="mot-bg-grid" />
      <div className="mot-bg-glow mot-bg-glow-a" />
      <div className="mot-bg-glow mot-bg-glow-b" />
      <div className="mot-bg-glow mot-bg-glow-c" />

      <header className="mot-topbar">
        <div className="mot-hero-copy">
          <p className="mot-kicker">Museum of Thought</p>
          <h1 className="mot-title">Map what your mind is holding.</h1>
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
            {showReflection ? "Close reflection" : "Open reflection"}
          </button>

          <button className="mot-btn mot-btn-danger" onClick={handleResetAll}>
            Reset map
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
              Write one honest sentence. Connections can emerge afterward.
            </p>
          </div>
        </section>
      ) : null}

      <section className="mot-composer">
        <label className="mot-label" htmlFor="thought-input">Thought input</label>
        <textarea
          id="thought-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Example: I keep postponing an important decision because I want certainty."
          className="mot-textarea"
          rows={3}
        />
        <p className="mot-input-hint">Example thought: “I want progress, but I keep waiting for perfect timing.”</p>

        <div className="mot-composer-actions">
          <button
            className="mot-btn mot-btn-primary"
            onClick={() => handleAddThought(null)}
          >
            Create thought
          </button>

          {selectedThoughtId ? (
            <button
              type="button"
              className="mot-overlay-btn"
              onClick={() => setComposerOpen(false)}
            >
              Cancel
            </button>
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
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </main>
  );
}
