import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

interface TeachMeBackModeProps {
  collapsedData: any;
  onEvaluate: (explanation: string) => Promise<any>;
  onClose: () => void;
  onExpandGraph: (concept: string) => void;
  onMastered: () => void;
}

export function TeachMeBackMode({ collapsedData, onEvaluate, onClose, onExpandGraph, onMastered }: TeachMeBackModeProps) {
  const [explanation, setExplanation] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!explanation.trim()) return;
    setIsEvaluating(true);
    const res = await onEvaluate(explanation);
    setResult(res);
    if (res?.score > 80) onMastered();
    setIsEvaluating(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 md:p-8 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-5xl space-y-6">
        <Button onClick={onClose} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Graph
        </Button>
        
        {!result ? (
          <>
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                Teach Me Back
              </h1>
              <p className="text-muted-foreground text-lg">
                Now explain this entire concept to me in your own words, as if you are teaching a friend.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="space-y-4">
                <div className="p-6 rounded-xl border border-border bg-card">
                  <h3 className="text-lg font-semibold mb-3 border-b border-border pb-2 text-primary">Core Ideas to Cover</h3>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm">
                    {collapsedData?.coreIdeas?.map((idea: string, i: number) => (
                      <li key={i}>{idea}</li>
                    ))}
                  </ul>
                  <h3 className="text-lg font-semibold mt-6 mb-3 border-b border-border pb-2 text-accent">Concept Dependency</h3>
                  <p className="text-sm text-muted-foreground">{collapsedData?.dependencies}</p>
                </div>
              </div>
              
              <div className="space-y-4 flex flex-col">
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm font-medium italic">
                  "{collapsedData?.prompt || "Teach it back to me!"}"
                </div>
                <Textarea 
                  className="flex-1 min-h-[300px] resize-none focus-visible:ring-primary/50 text-base p-4" 
                  placeholder="Start explaining here. Be descriptive and detailed..." 
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
                <Button 
                  onClick={handleSubmit} 
                  disabled={isEvaluating || !explanation.trim()} 
                  className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                >
                  {isEvaluating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Submit Explanation
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center p-8 rounded-2xl border bg-card/50">
              <h2 className="text-5xl font-bold mb-4 drop-shadow-md">
                Score: <span className={result.score > 80 ? "text-green-500" : result.score > 50 ? "text-yellow-500" : "text-red-500"}>{result.score}%</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{result.feedback}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border bg-red-500/10 border-red-500/20">
                <h3 className="font-semibold text-red-500 mb-2">Gaps Identified</h3>
                <p className="text-sm text-foreground/80">{result.gapExplanation}</p>
              </div>
              
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-3">Missing Concepts (Click to Add to Graph)</h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingConcepts?.filter(Boolean).map((concept: string, i: number) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      onClick={() => {
                        onExpandGraph(concept);
                        onClose();
                      }}
                      className="hover:border-primary hover:text-primary transition-colors"
                    >
                      Explore: {concept}
                    </Button>
                  ))}
                  {(!result.missingConcepts || result.missingConcepts.length === 0) && (
                    <p className="text-sm text-muted-foreground">None! Great job.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
