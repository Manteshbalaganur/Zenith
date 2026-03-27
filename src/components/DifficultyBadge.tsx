import type { Difficulty } from "@/types/knowledge";
import { Badge } from "@/components/ui/badge";

const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
  beginner: { label: "Beginner", className: "bg-success/15 text-success border-success/30" },
  intermediate: { label: "Intermediate", className: "bg-primary/15 text-primary border-primary/30" },
  advanced: { label: "Advanced", className: "bg-accent/15 text-accent border-accent/30" },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = difficultyConfig[difficulty];
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono uppercase tracking-wider ${config.className}`}>
      {config.label}
    </Badge>
  );
}
