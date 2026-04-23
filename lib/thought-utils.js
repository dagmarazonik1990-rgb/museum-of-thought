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

export function clusteredPositionNear(position, siblingCount = 0) {
  const ring = 7 + Math.min(siblingCount, 6) * 1.8;
  const angle = (siblingCount % 8) * (Math.PI / 4) + randomBetween(-0.25, 0.25);

  return {
    x: clamp(position.x + Math.cos(angle) * ring + randomBetween(-2.8, 2.8), 8, 92),
    y: clamp(position.y + Math.sin(angle) * ring + randomBetween(-2.8, 2.8), 10, 90)
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
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
