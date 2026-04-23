"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ThoughtSpace from "../components/ThoughtSpace";
import {
  createThought,
  createInitialState,
  loadAppState,
  saveAppState
} from "../lib/storage";
import {
  linkThoughtToParent,
  getThoughtById,
  randomPositionNear,
  normalizeThoughts
} from "../lib/thought-utils";

export default function HomePage() {
  const [appState, setAppState] = useState(createInitialState());
  const [input, setInput] = useState("");
  const [selectedThoughtId, setSelectedThoughtId] = useState(null);
  const [spaceLoaded, setSpaceLoaded] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    const loaded = loadAppState();
    setAppState(loaded);
    setSpaceLoaded(true);
  }, []);

  useEffect(() => {
    if (!spaceLoaded) return;
    saveAppState(appState);
  }, [appState, spaceLoaded]);

  useEffect(() => {
    function handleSpace(e) {
      if (e.code !== "Space") return;

      const target = e.target;
      const typingTarget =
        target instanceof HTMLElement &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable);

      if (typingTarget) return;

      e.preventDefault();
      setComposerOpen(true);
    }

    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  }, []);

  const selectedThought = useMemo(() => {
    return getThoughtById(appState.thoughts, selectedThoughtId);
  }, [appState.thoughts, selectedThoughtId]);

  function handleAddThought() {
    const text = input.trim();
    if (!text) return;

    const parentId = selectedThought?.id || null;
    const parent = parentId ? getThoughtById(appState.thoughts, parentId) : null;
    const position = parent
      ? randomPositionNear(parent.position)
      : {
          x: 50 + Math.round(Math.random() * 16 - 8),
          y: 50 + Math.round(Math.random() * 16 - 8)
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
    setComposerOpen(false);
  }

  function handleMoveThought(id, position) {
    setAppState((prev) => ({
      ...prev,
      thoughts: prev.thoughts.map((thought) =>
        thought.id === id ? { ...thought, position } : thought
      )
    }));
  }

  function handleResetAll() {
    const fresh = createInitialState();
    setAppState(fresh);
    setSelectedThoughtId(null);
    setInput("");
    setComposerOpen(false);
  }

  const isEmpty = appState.thoughts.length === 0;

  return (
    <main className="mot-shell mot-shell-minimal">
      <div className="mot-bg-grid" />
      <div className="mot-bg-glow mot-bg-glow-a" />
      <div className="mot-bg-glow mot-bg-glow-b" />
      <div className="mot-bg-glow mot-bg-glow-c" />

      <header className="mot-minimal-header">
        <h1 className="mot-minimal-title">Museum of Thought</h1>
        <p className="mot-minimal-copy">Drop the first thought.</p>
      </header>

      {isEmpty ? (
        <section className="mot-empty-stage">
          <button
            className="mot-orb-trigger"
            onClick={() => setComposerOpen(true)}
            aria-label="Open thought input"
          >
            <div className="mot-empty-orb" />
          </button>
        </section>
      ) : (
        <section className="mot-live-stage" onClick={() => setComposerOpen(true)}>
          <ThoughtSpace
            thoughts={appState.thoughts}
            selectedThoughtId={selectedThoughtId}
            onSelectThought={(id) => setSelectedThoughtId(id)}
            onMoveThought={handleMoveThought}
          />
        </section>
      )}

      {composerOpen ? (
        <section className="mot-composer-minimal" onClick={(e) => e.stopPropagation()}>
          <textarea
            id="thought-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mot-textarea"
            rows={3}
            autoFocus
          />

          <div className="mot-composer-actions mot-composer-actions-minimal">
            <button className="mot-btn mot-btn-primary" onClick={handleAddThought}>
              Drop
            </button>
            <button className="mot-btn mot-btn-ghost" onClick={() => setComposerOpen(false)}>
              Close
            </button>
          </div>
        </section>
      ) : null}

      {!isEmpty ? (
        <button className="mot-reset-link" onClick={handleResetAll}>
          Reset
        </button>
      ) : null}

      {!isEmpty ? (
        <footer className="mot-footer mot-footer-minimal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </footer>
      ) : null}
    </main>
  );
}
