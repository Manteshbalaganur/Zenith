import ReactMarkdown from "react-markdown";
import type { KnowledgeNode } from "@/types/knowledge";
import { ConceptChip } from "./ConceptChip";
import { SocraticMode } from "./SocraticMode";
import { DifficultyBadge } from "./DifficultyBadge";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SocraticResponse } from "@/types/knowledge";

interface ExplanationPanelProps {
  node: KnowledgeNode;
  nodes: KnowledgeNode[];
  onExplore: (term: string) => void;
  onBack: () => void;
  onSocraticCheck: (answer: string) => Promise<SocraticResponse | null>;
  onMarkUnderstood: () => void;
  isLoading: boolean;
  breadcrumbs: KnowledgeNode[];
}

export function ExplanationPanel({
  node, nodes, onExplore, onBack, onSocraticCheck, onMarkUnderstood, isLoading, breadcrumbs,
}: ExplanationPanelProps) {
  const exploredTerms = new Set(nodes.map(n => n.term.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto">
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.id} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <span className={`text-xs font-mono ${i === breadcrumbs.length - 1 ? "text-primary" : "text-muted-foreground"}`}>
                {crumb.term}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        {breadcrumbs.length > 1 && (
          <Button onClick={onBack} variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">{node.term}</h2>
          <div className="flex items-center gap-2 mt-1">
            <DifficultyBadge difficulty={node.difficulty} />
            {node.status === "understood" && (
              <span className="flex items-center gap-1 text-xs text-success">
                <CheckCircle2 className="w-3 h-3" /> Understood
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">depth: {node.depth}</span>
          </div>
        </div>
        {node.status !== "understood" && (
          <Button onClick={onMarkUnderstood} variant="outline" size="sm"
            className="shrink-0 text-success border-success/30 hover:bg-success/10">
            <CheckCircle2 className="w-3 h-3 mr-1" /> I understand
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="prose-neural text-sm leading-relaxed">
          <ReactMarkdown>{node.explanation}</ReactMarkdown>
        </div>

        {/* Concepts to explore */}
        {node.concepts.length > 0 && (
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
              Key Concepts to Explore
            </h3>
            <div className="flex flex-wrap gap-2">
              {node.concepts.map((concept) => (
                <ConceptChip
                  key={concept.term}
                  concept={concept}
                  onClick={onExplore}
                  isExplored={exploredTerms.has(concept.term.toLowerCase())}
                />
              ))}
            </div>
          </div>
        )}

        {/* Socratic mode */}
        <SocraticMode term={node.term} onCheck={onSocraticCheck} isLoading={isLoading} />
      </div>
    </div>
  );
}
