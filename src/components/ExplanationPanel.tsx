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
  isTesting: boolean;
  onTestingStateChange: (isTesting: boolean) => void;
}

export function ExplanationPanel({
  node, nodes, onExplore, onBack, onSocraticCheck, onMarkUnderstood, isLoading, breadcrumbs, isTesting, onTestingStateChange
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
          <Button onClick={onBack} variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors pdf-ignore rounded-full">
            <ArrowLeft className="w-5 h-5" />
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
            className="shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all pdf-ignore rounded-full px-4">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> I understand
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className={`prose prose-invert max-w-none text-foreground/90 prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-p:leading-loose transition-all duration-500 ${isTesting ? "blur-md opacity-40 select-none pointer-events-none" : ""}`}>
          <ReactMarkdown>{node.explanation}</ReactMarkdown>
        </div>

        {/* Resources */}
        {node.resources && node.resources.length > 0 && (
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              Further Reading & Resources
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {node.resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm hover:scale-[1.02] hover:bg-primary/5 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] transition-all duration-300 group"
                >
                  <h4 className="font-medium text-sm text-foreground group-hover:text-primary mb-1 line-clamp-1">
                    {resource.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {resource.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Concepts to explore */}
        {node.concepts.length > 0 && (
          <div className="pdf-ignore">
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
        <div className="pdf-ignore">
          <SocraticMode term={node.term} onCheck={onSocraticCheck} isLoading={isLoading} onTestingStateChange={onTestingStateChange} />
        </div>
      </div>
    </div>
  );
}
