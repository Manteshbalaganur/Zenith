import { useMemo, useState } from "react";
import type { KnowledgeNode } from "@/types/knowledge";

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[];
  activeNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  node: KnowledgeNode;
}

export function KnowledgeGraph({ nodes, activeNodeId, onNodeClick }: KnowledgeGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const layout = useMemo(() => {
    if (nodes.length === 0) return { layoutNodes: [] as LayoutNode[], edges: [] };

    const width = 1200;
    const height = 1200;
    const centerX = width / 2;
    const centerY = height / 2;

    const layoutNodes: LayoutNode[] = [];
    const depthGroups: Map<number, KnowledgeNode[]> = new Map();
    
    const exploredTerms = new Set(nodes.map(n => n.term.toLowerCase()));
    const allRenderNodes: KnowledgeNode[] = [...nodes];
    const addedUnexplored = new Set<string>();

    nodes.forEach(n => {
      n.concepts?.forEach(concept => {
        const cTerm = concept.term.toLowerCase();
        if (!exploredTerms.has(cTerm) && !addedUnexplored.has(cTerm)) {
          addedUnexplored.add(cTerm);
          allRenderNodes.push({
            id: `unexplored-${cTerm}`,
            term: concept.term,
            explanation: "",
            concepts: [],
            status: "unexplored",
            parentId: n.id,
            depth: n.depth + 1,
            difficulty: concept.difficulty || n.difficulty,
          });
        }
      });
    });

    allRenderNodes.forEach(n => {
      const group = depthGroups.get(n.depth) || [];
      group.push(n);
      depthGroups.set(n.depth, group);
    });

    depthGroups.forEach((group, depth) => {
      // increase radius per depth
      const radius = depth === 0 ? 0 : 200 + depth * 140;
      group.forEach((node, i) => {
        const offsetAngle = depth % 2 === 0 ? 0 : Math.PI / group.length;
        const angle = depth === 0
          ? 0
          : (i / group.length) * Math.PI * 2 - Math.PI / 2 + offsetAngle;
        layoutNodes.push({
          id: node.id,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          node,
        });
      });
    });

    const nodeMap = new Map(layoutNodes.map(ln => [ln.id, ln]));
    const edges: { from: LayoutNode; to: LayoutNode }[] = [];
    layoutNodes.forEach(ln => {
      if (ln.node.parentId) {
        const parent = nodeMap.get(ln.node.parentId);
        if (parent) edges.push({ from: parent, to: ln });
      }
    });

    return { layoutNodes, edges };
  }, [nodes]);

  if (nodes.length === 0) return null;

  const statusColor = (node: KnowledgeNode) => {
    if (node.status === "understood") return { core: "#EAB308", glow: "url(#glow-gold)" }; // Gold
    if (node.status === "unexplored") return { core: "#4B5563", glow: "none" }; // Gray
    return { core: "#06B6D4", glow: "url(#glow-cyan)" }; // Cyan
  };

  return (
    <div className="w-full h-full min-h-[400px] relative overflow-hidden bg-black/40 flex items-center justify-center p-4">
      <svg viewBox="0 0 1200 1200" className="w-full h-full max-w-[800px] max-h-[800px] drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="16" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {layout.edges.map((edge, i) => {
          // Curved connections (quadratic bezier)
          const midX = (edge.from.x + edge.to.x) / 2;
          const midY = (edge.from.y + edge.to.y) / 2 - 60; // Control point offset
          const isActiveEdge = activeNodeId === edge.from.id || activeNodeId === edge.to.id;

          return (
            <path
              key={i}
              d={`M ${edge.from.x} ${edge.from.y} Q ${midX} ${midY} ${edge.to.x} ${edge.to.y}`}
              fill="none"
              stroke={isActiveEdge ? "rgba(6,182,212,0.8)" : "rgba(255,255,255,0.2)"}
              strokeWidth={isActiveEdge ? 6 : 3}
              className="transition-all duration-700 ease-in-out"
              strokeDasharray={isActiveEdge ? "10 5" : "none"}
            />
          );
        })}

        {/* Nodes */}
        {layout.layoutNodes.map((ln) => {
          const colors = statusColor(ln.node);
          const isActive = ln.id === activeNodeId;
          const isHovered = ln.id === hoveredNode;
          const r = isActive ? 48 : isHovered ? 40 : 32;
          const filterId = isActive || isHovered ? colors.glow : undefined;

          return (
            <g
              key={ln.id}
              onClick={() => onNodeClick(ln.id)}
              onMouseEnter={() => setHoveredNode(ln.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer transition-all duration-300"
            >
              {/* Outer Glow Circle */}
              {(isActive || isHovered) && (
                <circle 
                  cx={ln.x} cy={ln.y} 
                  r={r + 15} 
                  fill={colors.core} 
                  opacity={0.3}
                  filter={colors.glow}
                  className="animate-pulse"
                />
              )}

              {/* Core Circle */}
              <circle 
                cx={ln.x} cy={ln.y} 
                r={r} 
                fill={colors.core} 
                opacity={isActive ? 1 : 0.9}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={3}
                className="transition-all duration-300"
              />
              
              <text
                x={ln.x} y={ln.y + r + 30}
                textAnchor="middle"
                fill="rgba(255,255,255,0.95)"
                fontSize={isActive ? 20 : 18}
                fontWeight={isActive ? "bold" : "normal"}
                className="pointer-events-none drop-shadow-lg transition-all duration-300"
              >
                {ln.node.term.length > 20 ? ln.node.term.slice(0, 18) + "…" : ln.node.term}
              </text>

              {ln.node.status === "understood" && (
                <text x={ln.x} y={ln.y + 8} textAnchor="middle" fill="#000" fontSize={24} fontWeight="bold" className="pointer-events-none drop-shadow-sm">
                  ✓
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
