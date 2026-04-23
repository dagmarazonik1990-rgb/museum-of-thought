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
  clusteredPositionNear,
  getChildrenOfThought,
  normalizeThoughts
} from "../lib/thought-utils";

const SUBMIT_ANIMATION_MS = 520;

export default function HomePage() {
  const [appState, setAppState] = useState(createInitialState());
  const [input, setInput] = useState("");
  const [selectedThoughtId, setSelectedThoughtId] = useState(null);
  const [spaceLoaded, setSpaceLoaded] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [submittingText, setSubmittingText] = useState("");

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
      setIsComposing(true);
    }

    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  }, []);

  const selectedThought = useMemo(() => {
    return getThoughtById(appState.thoughts, selectedThoughtId);
  }, [appState.thoughts, selectedThoughtId]);

  function commitThought(text) {
    const parentId = selectedThought?.id || null;
    const parent = parentId ? getThoughtById(appState.thoughts, parentId) : null;
    const siblingCount = parentId ? getChildrenOfThought(appState.thoughts, parentId).length : 0;
    const position = parent
      ? clusteredPositionNear(parent.position, siblingCount)
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
  }

  function handleAddThought() {
    const text = input.trim();
    if (!text) return;

    setSubmittingText(text);

    window.setTimeout(() => {
      commitThought(text);
      setSubmittingText("");
      setInput("");
      setIsComposing(false);
    }, SUBMIT_ANIMATION_MS);
  }

  function handleComposerKeyDown(e) {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;

    e.preventDefault();
    handleAddThought();
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
    setIsComposing(false);
    setSubmittingText("");
  }

  const hasThoughts = appState.thoughts.length > 0;
  const orbClasses = [
    "mot-empty-orb",
    isComposing ? "mot-empty-orb-composing" : "",
    input.trim() ? "mot-empty-orb-typing" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="mot-shell mot-shell-minimal">
      <div className="mot-bg-grid" />
      <div className="mot-bg-glow mot-bg-glow-a" />
      <div className="mot-bg-glow mot-bg-glow-b" />
      {isComposing ? <div className="mot-compose-overlay" /> : null}

      <header className="mot-minimal-header">
        <h1 className="mot-minimal-title">Museum of Thought</h1>
        <p className="mot-minimal-copy">Drop the first thought.</p>
      </header>

      {hasThoughts ? (
        <section className="mot-live-stage">
          <ThoughtSpace
            thoughts={appState.thoughts}
            selectedThoughtId={selectedThoughtId}
            onSelectThought={(id) => setSelectedThoughtId(id)}
            onMoveThought={handleMoveThought}
          />

          {submittingText ? (
            <p className="mot-submitting-thought" aria-hidden>
              {submittingText}
            </p>
          ) : null}

          <button
            className={`mot-orb-trigger mot-live-orb-trigger ${isComposing ? "is-composing" : ""}`}
            onClick={() => setIsComposing(true)}
            aria-label="Open thought input"
          >
            <div className={orbClasses} />
          </button>
        </section>
      ) : (
        <section className="mot-empty-stage">
          <button
            className={`mot-orb-trigger ${isComposing ? "is-composing" : ""}`}
            onClick={() => setIsComposing(true)}
            aria-label="Open thought input"
          >
            <div className={orbClasses} />
          </button>

          {submittingText ? (
            <p className="mot-submitting-thought" aria-hidden>
              {submittingText}
            </p>
          ) : null}
        </section>
      )}

      {isComposing ? (
        <section className="mot-composer-ritual" onClick={(e) => e.stopPropagation()}>
          <textarea
            id="thought-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleComposerKeyDown}
            className="mot-textarea mot-textarea-ritual"
            rows={3}
            autoFocus
            placeholder="Write one honest thought."
          />
        </section>
      ) : null}

      {hasThoughts ? (
        <button className="mot-reset-link" onClick={handleResetAll}>
          Reset
        </button>
      ) : null}

      {hasThoughts ? (
        <footer className="mot-footer mot-footer-minimal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </footer>
      ) : null}
    </main>
  );
}
