import { useState, useEffect } from "react";
import { X, BrainCircuit, Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface GuidedRecoveryModalProps {
  term: string;
  onComplete: () => void;
  onClose: () => void;
}

const STEPS = [
  { id: "intuition", title: "Intuition", prompt: "Explain the absolute basic intuition behind " },
  { id: "basic", title: "Basic Concept", prompt: "Explain the fundamental definition and basic rules of " },
  { id: "structured", title: "Structured Details", prompt: "Explain the structured technical details of " },
  { id: "application", title: "Application", prompt: "Provide a real-world application and example for " }
];

export function GuidedRecoveryModal({ term, onComplete, onClose }: GuidedRecoveryModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepContents, setStepContents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadStepContent(currentStep);
  }, [currentStep]);

  const loadStepContent = async (stepIndex: number) => {
    if (stepContents[stepIndex]) return;

    setIsLoading(true);
    try {
      const stepConfig = STEPS[stepIndex];
      const query = stepConfig.prompt + `"${term}"`;

      const { data, error } = await supabase.functions.invoke("explore-concept", {
        body: { query, context: "", complexity: stepIndex < 2 ? "eli5" : "standard" },
      });

      if (error) throw error;
      
      const newContents = [...stepContents];
      newContents[stepIndex] = data.explanation;
      setStepContents(newContents);
    } catch (e) {
      console.error(e);
      const newContents = [...stepContents];
      newContents[stepIndex] = "Failed to load explanation. Please try again.";
      setStepContents(newContents);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-3xl max-h-[90vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-5 border-b border-border/50 flex items-center justify-between shrink-0 bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <BrainCircuit className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Concept Recovery: {term}</h2>
              <p className="text-sm text-muted-foreground">Let's break this down step-by-step.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {!completed ? (
          <>
            {/* Progress Steps */}
            <div className="flex items-center p-4 border-b border-border/30 bg-background/50 overflow-x-auto shrink-0">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center shrink-0">
                  <div className={`flex items-center justify-center text-xs font-bold w-6 h-6 rounded-full border ${
                    index < currentStep ? 'bg-primary border-primary text-primary-foreground' :
                    index === currentStep ? 'bg-primary/20 border-primary text-primary' :
                    'bg-card border-border text-muted-foreground'
                  }`}>
                    {index < currentStep ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={`text-xs ml-2 font-medium ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className="w-12 h-[2px] mx-3 bg-border/50" />
                  )}
                </div>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 relative">
              {isLoading && !stepContents[currentStep] ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground font-mono tracking-widest uppercase animate-pulse">
                    Synthesizing {STEPS[currentStep].title}...
                  </p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none animate-in slide-in-from-right-8 duration-500 fade-in">
                  <ReactMarkdown>{stepContents[currentStep] || ""}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 flex justify-between items-center bg-card shrink-0">
              <div className="text-sm text-muted-foreground">
                Take your time. Read through the {STEPS[currentStep].title.toLowerCase()} carefully.
              </div>
              <Button 
                onClick={handleNext} 
                disabled={isLoading || !stepContents[currentStep]}
                className="gap-2"
              >
                {currentStep < STEPS.length - 1 ? (
                  <>Next Step <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Complete Recovery <ShieldCheck className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Recovery Complete</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              You've successfully rebuilt your understanding of <strong>{term}</strong> from the ground up.
            </p>
            <Button size="lg" onClick={onComplete} className="gap-2">
              <CheckCircle2 className="w-5 h-5" /> Back to Exploration
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
