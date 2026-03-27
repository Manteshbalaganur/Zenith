import { useMemo } from "react";
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
  const layout = useMemo(() => {
    if (nodes.length === 0) return { layoutNodes: [] as LayoutNode[], edges: [] as { from: LayoutNode; to: LayoutNode }[] };

    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    const layoutNodes: LayoutNode[] = [];

    if (nodes.length === 1) {
      layoutNodes.push({ id: nodes[0].id, x: centerX, y: centerY, node: nodes[0] });
    } else {
      // Place root at center, children in concentric rings by depth
      const maxDepth = Math.max(...nodes.map(n => n.depth));
      const depthGroups: Map<number, KnowledgeNode[]> = new Map();
      nodes.forEach(n => {
        const group = depthGroups.get(n.depth) || [];
        group.push(n);
        depthGroups.set(n.depth, group);
      });

      depthGroups.forEach((group, depth) => {
        const radius = depth === 0 ? 0 : Math.min(60 + depth * 70, Math.min(width, height) / 2 - 40);
        group.forEach((node, i) => {
          const angle = depth === 0
            ? 0
            : (i / group.length) * Math.PI * 2 - Math.PI / 2;
          layoutNodes.push({
            id: node.id,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            node,
          });
        });
      });
    }

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

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-border flex items-center justify-center">
            <span className="text-2xl">🧠</span>
          </div>
          <p className="text-sm font-mono">Your knowledge graph will appear here</p>
        </div>
      </div>
    );
  }

  const statusColor = (node: KnowledgeNode) => {
    if (node.status === "understood") return { fill: "hsl(35, 90%, 55%)", stroke: "hsl(35, 90%, 65%)" };
    if (node.status === "explored") return { fill: "hsl(175, 70%, 50%)", stroke: "hsl(175, 70%, 60%)" };
    return { fill: "hsl(220, 15%, 30%)", stroke: "hsl(220, 15%, 40%)" };
  };

  return (
    <svg viewBox="0 0 600 400" className="w-full h-full" style={{ minHeight: 300 }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {layout.edges.map((edge, i) => (
        <line
          key={i}
          x1={edge.from.x} y1={edge.from.y}
          x2={edge.to.x} y2={edge.to.y}
          stroke="hsl(220, 15%, 25%)"
          strokeWidth={1.5}
          className="animate-draw-line"
        />
      ))}

      {/* Nodes */}
      {layout.layoutNodes.map((ln) => {
        const colors = statusColor(ln.node);
        const isActive = ln.id === activeNodeId;
        const r = isActive ? 22 : 16;

        return (
          <g
            key={ln.id}
            onClick={() => onNodeClick(ln.id)}
            className="cursor-pointer animate-float-in"
            style={{ animationDelay: `${ln.node.depth * 100}ms` }}
          >
            {/* Glow for active */}
            {isActive && (
              <circle cx={ln.x} cy={ln.y} r={r + 6} fill={colors.fill} opacity={0.15} filter="url(#glow)" />
            )}
            <circle cx={ln.x} cy={ln.y} r={r} fill={colors.fill} stroke={colors.stroke}
              strokeWidth={isActive ? 2.5 : 1.5} opacity={isActive ? 1 : 0.8} />

            {/* Label */}
            <text
              x={ln.x} y={ln.y + r + 14}
              textAnchor="middle"
              fill="hsl(210, 20%, 80%)"
              fontSize={10}
              fontFamily="Inter, sans-serif"
              className="pointer-events-none"
            >
              {ln.node.term.length > 18 ? ln.node.term.slice(0, 16) + "…" : ln.node.term}
            </text>

            {/* Understood check */}
            {ln.node.status === "understood" && (
              <text x={ln.x} y={ln.y + 4} textAnchor="middle" fontSize={12} className="pointer-events-none">
                ✓
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
