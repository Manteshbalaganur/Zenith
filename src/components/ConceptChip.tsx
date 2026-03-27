import type { ConceptTerm } from "@/types/knowledge";
import { DifficultyBadge } from "./DifficultyBadge";

interface ConceptChipProps {
  concept: ConceptTerm;
  onClick: (term: string) => void;
  isExplored?: boolean;
}

export function ConceptChip({ concept, onClick, isExplored }: ConceptChipProps) {
  return (
    <button
      onClick={() => onClick(concept.term)}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-left
        ${isExplored
          ? "border-primary/30 bg-primary/5 cursor-default"
          : "border-border bg-card hover:border-primary/50 hover:bg-primary/10 hover:glow-primary cursor-pointer"
        }`}
      disabled={isExplored}
      title={concept.reason}
    >
      <span className={`text-sm font-medium ${isExplored ? "text-primary/60" : "text-foreground group-hover:text-primary"}`}>
        {concept.term}
      </span>
      <DifficultyBadge difficulty={concept.difficulty} />
      {isExplored && (
        <span className="text-[10px] text-primary/50 font-mono">explored</span>
      )}
    </button>
  );
}
