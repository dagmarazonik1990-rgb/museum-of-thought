"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import OrbSpace from "../components/OrbSpace";
import {
  createThought,
  createInitialState,
  loadAppState,
  saveAppState
} from "../lib/storage";
import { normalizeThoughts, randomPositionNear } from "../lib/thought-utils";

export default function HomePage() {
  const [appState, setAppState] = useState(createInitialState());
  const [input, setInput] = useState("");
  const [selectedThoughtId, setSelectedThoughtId] = useState(null);
  const [spaceLoaded, setSpaceLoaded] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const inputRef = useRef(null);

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
    setComposerOpen(false);
  }

  const promptText = useMemo(() => {
    if (appState.thoughts.length === 0) return "Drop the first thought.";
    return "Tap space. Add thought. Watch it find its room.";
  }, [appState.thoughts.length]);

  return (
    <main className="mot-cosmos-root">
      <div className="mot-cosmos-stars" />

      <OrbSpace
        thoughts={appState.thoughts}
        selectedThoughtId={selectedThoughtId}
        onSelectThought={setSelectedThoughtId}
        onActivateComposer={() => setComposerOpen(true)}
      />

      <div className="mot-first-prompt">{promptText}</div>

      {composerOpen ? (
        <form
          className="mot-thought-overlay"
          onSubmit={(event) => {
            event.preventDefault();
            handleAddThought(selectedThoughtId);
          }}
        >
          <label htmlFor="thought-input" className="mot-overlay-label">
            Drop thought into space
          </label>
          <textarea
            id="thought-input"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Let one thought surface..."
            rows={3}
            className="mot-overlay-input"
          />
          <div className="mot-overlay-actions">
            <button type="submit" className="mot-overlay-btn mot-overlay-btn-primary">
              Release orb
            </button>
            <button
              type="button"
              className="mot-overlay-btn"
              onClick={() => setComposerOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </main>
  );
}
