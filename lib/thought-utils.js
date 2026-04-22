export function getThoughtById(thoughts, id) {
  return thoughts.find((thought) => thought.id === id) || null;
}

export function getChildrenOfThought(thoughts, parentId) {
  return thoughts.filter((thought) => thought.parentId === parentId);
}

export function randomPositionNear(position) {
  return {
    x: clamp(position.x + randomBetween(-14, 14), 8, 92),
    y: clamp(position.y + randomBetween(-14, 14), 10, 90)
  };
}

export function normalizeThoughts(thoughts) {
  return thoughts.map((thought) => ({
    ...thought,
    position: {
      x: clamp(thought.position?.x ?? 50, 8, 92),
      y: clamp(thought.position?.y ?? 50, 10, 90)
    }
  }));
}

export function linkThoughtToParent(thoughts, childId, parentId) {
  return thoughts.map((thought) =>
    thought.id === childId ? { ...thought, parentId } : thought
  );
}

function randomBetween(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
