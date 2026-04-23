"use client";

import { useMemo, useRef, useState } from "react";

export default function ThoughtSpace({
  thoughts,
  selectedThoughtId,
  onSelectThought,
  onMoveThought
}) {
  const containerRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  const links = useMemo(() => {
    const map = new Map(thoughts.map((t) => [t.id, t]));
    const allLinks = thoughts
      .filter((thought) => thought.parentId && map.has(thought.parentId))
      .map((thought, index) => {
        const parent = map.get(thought.parentId);
        const selectedRelated =
          selectedThoughtId && (thought.id === selectedThoughtId || parent.id === selectedThoughtId);

        return {
          id: `${parent.id}-${thought.id}`,
          from: parent.position,
          to: thought.position,
          visible: selectedRelated || index % 2 === 0,
          selectedRelated
        };
      });

    return allLinks.filter((link) => link.visible);
  }, [thoughts, selectedThoughtId]);

  function toPercentPosition(clientX, clientY) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    return {
      x: Math.max(8, Math.min(92, Number(x.toFixed(2)))),
      y: Math.max(10, Math.min(90, Number(y.toFixed(2))))
    };
  }

  function handlePointerDown(e, thoughtId) {
    e.preventDefault();
    e.stopPropagation();
    setDragState({ thoughtId });
  }

  function handlePointerMove(e) {
    if (!dragState) return;
    const position = toPercentPosition(e.clientX, e.clientY);
    if (!position) return;
    onMoveThought(dragState.thoughtId, position);
  }

  function handlePointerUp() {
    setDragState(null);
  }

  return (
    <div
      ref={containerRef}
      className="mot-space"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg className="mot-space-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {links.map((link) => (
          <line
            key={link.id}
            x1={link.from.x}
            y1={link.from.y}
            x2={link.to.x}
            y2={link.to.y}
            className={`mot-link-line ${link.selectedRelated ? "mot-link-line-focus" : ""}`}
          />
        ))}
      </svg>

      {thoughts.length === 0 ? (
        <div className="mot-empty-space">
          <div className="mot-empty-orb" />
          <p className="mot-empty-space-title">The canvas is waiting.</p>
          <p className="mot-empty-space-copy">
            Add one thought and let relationships form over time.
          </p>
        </div>
      ) : null}

      {thoughts.map((thought) => {
        const selected = thought.id === selectedThoughtId;

        return (
          <button
            key={thought.id}
            className={`mot-orb ${selected ? "mot-orb-selected" : ""}`}
            style={{
              left: `${thought.position.x}%`,
              top: `${thought.position.y}%`
            }}
            onClick={() => onSelectThought(thought.id)}
            onPointerDown={(e) => handlePointerDown(e, thought.id)}
            title={thought.text}
          >
            <span className="mot-orb-core" />
            <span className="mot-orb-ring" />
            <span className="mot-orb-text">
              {thought.text.length > 24 ? `${thought.text.slice(0, 24)}…` : thought.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
