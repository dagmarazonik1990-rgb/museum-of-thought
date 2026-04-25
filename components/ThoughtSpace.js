"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const INTERACTION_HINT_KEY = "mot-orb-interaction-hint-dismissed-v1";

export default function ThoughtSpace({
  thoughts,
  selectedThoughtId,
  onSelectThought,
  onMoveThought,
  birthPhase,
  birthThoughtId
}) {
  const containerRef = useRef(null);
  const rippleTimeoutRef = useRef(null);
  const [dragState, setDragState] = useState(null);
  const [visibleTextThoughtId, setVisibleTextThoughtId] = useState(null);
  const [showInteractionHint, setShowInteractionHint] = useState(false);
  const [rippleThoughtId, setRippleThoughtId] = useState(null);

  const getThoughtDisplayPosition = (thought) => {
    const isFirstThought = thoughts.length > 0 && thought.id === thoughts[0].id;
    if (!isFirstThought) return thought.position;

    return {
      x: 50,
      y: Math.max(34, thought.position?.y ?? 38, 38)
    };
  };

  const getOrbRadius = (thought) => (thought.parentId ? 26 : 28);

  const getDynamicSpacing = () => {
    if (typeof window === "undefined") return 16;
    if (window.innerWidth < 480) return 20;
    if (window.innerWidth < 768) return 16;
    return 12;
  };

  const getTextPillStyle = (thought) => {
    const displayPosition = getThoughtDisplayPosition(thought);
    const orbRadius = getOrbRadius(thought);
    const dynamicSpacing = getDynamicSpacing();
    const minDistanceGuard = orbRadius + 14;
    const pillOffset = Math.max(orbRadius + dynamicSpacing, minDistanceGuard);

    return {
      left: `clamp(12px, ${displayPosition.x}%, calc(100% - 12px))`,
      top: `${displayPosition.y}%`,
      "--mot-pill-offset": `${pillOffset}px`
    };
  };

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
          from: getThoughtDisplayPosition(parent),
          to: getThoughtDisplayPosition(thought),
          visible: selectedRelated || index % 2 === 0,
          selectedRelated
        };
      });

    return allLinks.filter((link) => link.visible);
  }, [thoughts, selectedThoughtId]);

  const birthLinkStyle = useMemo(() => {
    if (!birthThoughtId || (birthPhase !== "spawn" && birthPhase !== "connected")) return null;
    const childThought = thoughts.find((thought) => thought.id === birthThoughtId);
    if (!childThought) return null;

    const childPosition = getThoughtDisplayPosition(childThought);
    const anchorX = 50;
    const anchorY = 92;
    const dx = childPosition.x - anchorX;
    const dy = childPosition.y - anchorY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return {
      left: `${anchorX}%`,
      top: `${anchorY}%`,
      width: `${length}%`,
      transform: `rotate(${angle}deg)`
    };
  }, [birthPhase, birthThoughtId, thoughts]);

  useEffect(() => {
    function handleOutsidePointer(event) {
      const target = event.target;
      if (target instanceof Element && target.closest(".mot-orb")) return;
      setVisibleTextThoughtId(null);
    }

    window.addEventListener("pointerdown", handleOutsidePointer);
    return () => window.removeEventListener("pointerdown", handleOutsidePointer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeenHint = window.localStorage.getItem(INTERACTION_HINT_KEY) === "1";
    setShowInteractionHint(!hasSeenHint);
  }, []);

  useEffect(() => {
    return () => {
      if (rippleTimeoutRef.current) {
        window.clearTimeout(rippleTimeoutRef.current);
      }
    };
  }, []);

  function triggerRipple(thoughtId) {
    setRippleThoughtId(thoughtId);
    if (rippleTimeoutRef.current) {
      window.clearTimeout(rippleTimeoutRef.current);
    }
    rippleTimeoutRef.current = window.setTimeout(() => {
      setRippleThoughtId(null);
    }, 540);
  }

  function dismissInteractionHint() {
    if (!showInteractionHint || typeof window === "undefined") return;
    window.localStorage.setItem(INTERACTION_HINT_KEY, "1");
    setShowInteractionHint(false);
  }

  function revealThought(thoughtId) {
    onSelectThought(thoughtId);
    setVisibleTextThoughtId(thoughtId);
    dismissInteractionHint();
  }

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
    setDragState({ thoughtId, startX: e.clientX, startY: e.clientY, hasMoved: false });
  }

  function handlePointerMove(e) {
    if (!dragState) return;
    const dx = Math.abs(e.clientX - dragState.startX);
    const dy = Math.abs(e.clientY - dragState.startY);
    const movedEnough = dx + dy > 6;
    if (!dragState.hasMoved && movedEnough) {
      setDragState((prev) => (prev ? { ...prev, hasMoved: true } : prev));
    }
    if (!dragState.hasMoved && !movedEnough) {
      return;
    }
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
      onPointerDown={(event) => {
        if (event.target === containerRef.current) {
          setVisibleTextThoughtId(null);
        }
      }}
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

      {birthLinkStyle ? <span className="mot-birth-line" style={birthLinkStyle} aria-hidden /> : null}

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
        const showText = visibleTextThoughtId === thought.id;
        const isBirthThought = thought.id === birthThoughtId;
        const isRootThought = !thought.parentId;
        const isChildThought = Boolean(thought.parentId);
        const displayPosition = getThoughtDisplayPosition(thought);

        return (
          <button
            key={thought.id}
            className={`mot-orb mot-thought-orb ${selected ? "mot-orb-selected" : ""} ${isChildThought ? "mot-orb-child" : ""} ${isRootThought ? "mot-orb-root" : ""} ${isBirthThought && (birthPhase === "spawn" || birthPhase === "connected") ? "mot-orb-born" : ""}`}
            style={{
              left: `${displayPosition.x}%`,
              top: `${displayPosition.y}%`
            }}
            onClick={() => {
              revealThought(thought.id);
            }}
            onPointerUp={() => {
              if (!selectedThoughtId || visibleTextThoughtId !== thought.id) {
                revealThought(thought.id);
              }
            }}
            onPointerDown={(e) => {
              handlePointerDown(e, thought.id);
              triggerRipple(thought.id);
            }}
            title={thought.text}
          >
            <span className="mot-orb-core" />
            <span className="mot-orb-ring" />
            <span
              className={`mot-orb-ripple ${rippleThoughtId === thought.id ? "mot-orb-ripple-active" : ""}`}
              aria-hidden
            />
          </button>
        );
      })}

      {showInteractionHint && thoughts.length > 0 ? (
        <span className="mot-interaction-hint" aria-live="polite">
          Tap to reveal
        </span>
      ) : null}

      {thoughts.map((thought) => {
        if (visibleTextThoughtId !== thought.id) return null;

        return (
          <span
            key={`${thought.id}-text`}
            className="mot-orb-text"
            style={getTextPillStyle(thought)}
          >
            {thought.text}
          </span>
        );
      })}
    </div>
  );
}
