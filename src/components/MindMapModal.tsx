import { X, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import type { KnowledgeNode } from "@/types/knowledge";

interface MindMapModalProps {
  nodes: KnowledgeNode[];
  activeNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onClose: () => void;
}

export function MindMapModal({ nodes, activeNodeId, onNodeClick, onClose }: MindMapModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0 bg-background/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <Network className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Knowledge Graph
            </h2>
            <p className="text-xs text-muted-foreground font-mono tracking-wider">
              Recursive Concept Map
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-full bg-card/50 border border-border/50 text-xs font-mono">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span> Understood</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span> Explored</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-500"></span> Unexplored</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>
      <div className="flex-1 w-full min-h-0 relative overflow-hidden bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        {/* We reuse the KnowledgeGraph component and ensure it spans fully */}
        <div className="absolute inset-0 flex items-center justify-center">
            <KnowledgeGraph nodes={nodes} activeNodeId={activeNodeId} onNodeClick={(id) => {
              if (id.startsWith('unexplored-')) {
                // To allow jumping to unexplored concepts directly, we'd need to extract the term.
                // For now, if they click unexplored, we just pass the term back or handle it in the parent.
                // We'll pass it up and let the parent handle the explore.
                onNodeClick(id);
              } else {
                onNodeClick(id);
              }
            }} />
        </div>
      </div>
    </div>
  );
}
