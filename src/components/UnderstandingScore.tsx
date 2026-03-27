import { Progress } from "@/components/ui/progress";
import { Brain, Layers, Target, Zap } from "lucide-react";

interface UnderstandingScoreProps {
  stats: {
    total: number;
    explored: number;
    understood: number;
    score: number;
    maxDepth: number;
  };
}

export function UnderstandingScore({ stats }: UnderstandingScoreProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Understanding</span>
        <span className="text-lg font-bold text-primary font-mono">{stats.score}%</span>
      </div>
      <Progress value={stats.score} className="h-2 bg-secondary" />

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="w-3 h-3 text-primary" />
          <span>{stats.explored} explored</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Brain className="w-3 h-3 text-accent" />
          <span>{stats.understood} understood</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="w-3 h-3 text-primary" />
          <span>Depth: {stats.maxDepth}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-3 h-3 text-accent" />
          <span>{stats.total} total</span>
        </div>
      </div>
    </div>
  );
}
