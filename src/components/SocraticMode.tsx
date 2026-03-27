import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, CheckCircle2, XCircle, MessageSquareText } from "lucide-react";
import type { SocraticResponse } from "@/types/knowledge";

interface SocraticModeProps {
  term: string;
  onCheck: (answer: string) => Promise<SocraticResponse | null>;
  isLoading: boolean;
}

export function SocraticMode({ term, onCheck, isLoading }: SocraticModeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<SocraticResponse | null>(null);

  const handleCheck = async () => {
    if (!answer.trim()) return;
    const res = await onCheck(answer);
    if (res) setResult(res);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-3"
      >
        <Brain className="w-4 h-4" />
        <span>Test my understanding</span>
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-lg border border-border bg-secondary/30 animate-float-in">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquareText className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          Can you explain "{term}" in your own words?
        </span>
      </div>

      {!result ? (
        <div className="space-y-3">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your understanding here..."
            className="bg-card border-border text-foreground placeholder:text-muted-foreground min-h-[80px] resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCheck}
              disabled={!answer.trim() || isLoading}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Check Understanding
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {result.understood ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-accent" />
            )}
            <span className="text-sm font-medium text-foreground">
              Score: {result.score}/100
            </span>
          </div>
          <p className="text-sm text-secondary-foreground">{result.feedback}</p>
          <Button
            onClick={() => { setResult(null); setAnswer(""); setIsOpen(false); }}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground mt-1"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
