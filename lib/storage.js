const STORAGE_KEY = "museum_of_thought_v1";

export function createInitialState() {
  return {
    thoughts: [],
    insights: {}
  };
}

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `thought_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

export function createThought(text, position, parentId = null) {
  return {
    id: uid(),
    text,
    type: parentId ? "sub-thought" : "thought",
    createdAt: new Date().toISOString(),
    parentId,
    position
  };
}

export function saveAppState(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadAppState() {
  if (typeof window === "undefined") return createInitialState();

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();

  try {
    const parsed = JSON.parse(raw);
    return {
      thoughts: Array.isArray(parsed.thoughts) ? parsed.thoughts : [],
      insights: parsed.insights && typeof parsed.insights === "object" ? parsed.insights : {}
    };
  } catch {
    return createInitialState();
  }
}
