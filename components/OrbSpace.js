"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CLUSTER_COLORS = [
  "rgba(112, 221, 255, 0.24)",
  "rgba(161, 130, 255, 0.22)",
  "rgba(255, 132, 198, 0.2)",
  "rgba(133, 243, 193, 0.2)",
  "rgba(255, 201, 123, 0.2)"
];

export default function OrbSpace({ thoughts, selectedThoughtId, onSelectThought, onActivateComposer }) {
  const spaceRef = useRef(null);
  const physicsRef = useRef(new Map());
  const [frame, setFrame] = useState(0);

  const clusters = useMemo(() => buildClusters(thoughts), [thoughts]);
  const links = useMemo(() => buildSparseLinks(thoughts, clusters), [thoughts, clusters]);

  useEffect(() => {
    const map = physicsRef.current;

    thoughts.forEach((thought, index) => {
      if (!map.has(thought.id)) {
        const angle = (Math.PI * 2 * index) / Math.max(1, thoughts.length);
        map.set(thought.id, {
          x: thought.position?.x ?? 50 + Math.cos(angle) * 18,
          y: thought.position?.y ?? 50 + Math.sin(angle) * 18,
          vx: (Math.random() - 0.5) * 0.025,
          vy: (Math.random() - 0.5) * 0.025
        });
      }
    });

    Array.from(map.keys()).forEach((id) => {
      if (!thoughts.some((t) => t.id === id)) {
        map.delete(id);
      }
    });
  }, [thoughts]);

  useEffect(() => {
    let raf = null;

    function tick() {
      const map = physicsRef.current;
      const ids = thoughts.map((t) => t.id);
      const clusterByThought = new Map();
      clusters.forEach((cluster) => {
        cluster.members.forEach((memberId) => {
          clusterByThought.set(memberId, cluster);
        });
      });

      for (let i = 0; i < ids.length; i += 1) {
        const a = map.get(ids[i]);
        if (!a) continue;

        for (let j = i + 1; j < ids.length; j += 1) {
          const b = map.get(ids[j]);
          if (!b) continue;

          let dx = a.x - b.x;
          let dy = a.y - b.y;
          const distance = Math.max(0.001, Math.hypot(dx, dy));
          if (distance < 9.5) {
            const force = (9.5 - distance) * 0.0012;
            dx /= distance;
            dy /= distance;
            a.vx += dx * force;
            a.vy += dy * force;
            b.vx -= dx * force;
            b.vy -= dy * force;
          }
        }
      }

      ids.forEach((id) => {
        const node = map.get(id);
        if (!node) return;

        const cluster = clusterByThought.get(id);
        if (cluster) {
          node.vx += (cluster.center.x - node.x) * 0.00035;
          node.vy += (cluster.center.y - node.y) * 0.00035;
        }

        const centerDx = node.x - 50;
        const centerDy = node.y - 50;
        const centerDistance = Math.max(0.001, Math.hypot(centerDx, centerDy));
        if (centerDistance < 9.5) {
          const centerPush = (9.5 - centerDistance) * 0.0009;
          node.vx += (centerDx / centerDistance) * centerPush;
          node.vy += (centerDy / centerDistance) * centerPush;
        }

        node.vx += (Math.random() - 0.5) * 0.00045;
        node.vy += (Math.random() - 0.5) * 0.00045;
        node.vx *= 0.988;
        node.vy *= 0.988;
        node.x = clamp(node.x + node.vx, 7, 93);
        node.y = clamp(node.y + node.vy, 9, 91);
      });

      setFrame((prev) => prev + 1);
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [thoughts, clusters]);

  const points = useMemo(() => {
    const map = physicsRef.current;
    const data = new Map();
    thoughts.forEach((thought) => {
      const node = map.get(thought.id);
      if (node) {
        data.set(thought.id, { x: node.x, y: node.y });
      }
    });
    return data;
  }, [thoughts, frame]);

  return (
    <div
      ref={spaceRef}
      className="mot-orb-space"
      onClick={onActivateComposer}
      role="presentation"
    >
      <svg className="mot-link-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
        {links.map((link) => {
          const from = points.get(link.from);
          const to = points.get(link.to);
          if (!from || !to) return null;

          return (
            <line
              key={link.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              style={{ opacity: 0.03 + Math.min(0.06, link.strength * 0.09) }}
              className="mot-orb-link"
            />
          );
        })}
      </svg>

      {clusters.map((cluster, index) => (
        <div
          key={cluster.id}
          className="mot-cluster-glow"
          style={{
            left: `${cluster.center.x}%`,
            top: `${cluster.center.y}%`,
            width: `${cluster.radius * 2}%`,
            height: `${cluster.radius * 2}%`,
            background: `radial-gradient(circle, ${CLUSTER_COLORS[index % CLUSTER_COLORS.length]}, transparent 74%)`
          }}
        />
      ))}

      <button
        className="mot-brain-orb"
        onClick={(event) => {
          event.stopPropagation();
          onActivateComposer();
        }}
      >
        <span className="mot-brain-core" />
        <span className="mot-brain-ring" />
      </button>

      {thoughts.map((thought) => {
        const point = points.get(thought.id);
        if (!point) return null;
        const selected = thought.id === selectedThoughtId;

        return (
          <button
            key={thought.id}
            className={`mot-orb ${selected ? "mot-orb-selected" : ""}`}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            onClick={(event) => {
              event.stopPropagation();
              onSelectThought(thought.id);
            }}
            title={thought.text}
          >
            <span className="mot-orb-core" />
            <span className="mot-orb-ring" />
          </button>
        );
      })}
    </div>
  );
}

function buildSparseLinks(thoughts, clusters) {
  const clusterByThought = new Map();
  clusters.forEach((cluster) => {
    cluster.members.forEach((id) => {
      clusterByThought.set(id, cluster.id);
    });
  });

  const desiredLinks = [];
  thoughts.forEach((thought) => {
    const candidates = thoughts
      .filter((target) => target.id !== thought.id && clusterByThought.get(target.id) === clusterByThought.get(thought.id))
      .map((target) => ({
        id: target.id,
        score: textSimilarity(thought.text, target.text)
      }))
      .filter((item) => item.score > 0.12)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    candidates.forEach((candidate) => {
      const edge = [thought.id, candidate.id].sort().join("-");
      desiredLinks.push({ edge, from: thought.id, to: candidate.id, strength: candidate.score });
    });
  });

  const degree = new Map(thoughts.map((thought) => [thought.id, 0]));
  const unique = new Map();

  desiredLinks
    .sort((a, b) => b.strength - a.strength)
    .forEach((link) => {
      if (unique.has(link.edge)) return;
      if ((degree.get(link.from) ?? 0) >= 3 || (degree.get(link.to) ?? 0) >= 3) return;

      unique.set(link.edge, {
        id: link.edge,
        from: link.from,
        to: link.to,
        strength: link.strength
      });

      degree.set(link.from, (degree.get(link.from) ?? 0) + 1);
      degree.set(link.to, (degree.get(link.to) ?? 0) + 1);
    });

  return Array.from(unique.values());
}

function textSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  let overlap = 0;
  setA.forEach((token) => {
    if (setB.has(token)) overlap += 1;
  });

  return overlap / Math.sqrt(setA.size * setB.size);
}

function buildClusters(thoughts) {
  const clusters = [];

  thoughts.forEach((thought, index) => {
    let bestCluster = null;
    let bestScore = 0;

    clusters.forEach((cluster) => {
      const score = textSimilarity(thought.text, cluster.anchor);
      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    });

    if (!bestCluster || bestScore < 0.24) {
      clusters.push({
        id: `cluster-${index}`,
        anchor: thought.text,
        members: [thought.id],
        center: { ...thought.position },
        radius: 16
      });
      return;
    }

    bestCluster.members.push(thought.id);
  });

  const thoughtMap = new Map(thoughts.map((thought) => [thought.id, thought]));

  clusters.forEach((cluster) => {
    const positions = cluster.members
      .map((id) => thoughtMap.get(id)?.position)
      .filter(Boolean);

    const center = positions.reduce(
      (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
      { x: 0, y: 0 }
    );

    cluster.center = {
      x: center.x / Math.max(1, positions.length),
      y: center.y / Math.max(1, positions.length)
    };

    cluster.radius = clamp(12 + Math.sqrt(cluster.members.length) * 4.1, 12, 28);
  });

  return clusters;
}

function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && token.length > 2);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
