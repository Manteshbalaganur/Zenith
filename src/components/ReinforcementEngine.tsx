import { useState, useEffect } from "react";
import { X, BrainCircuit, Loader2, Target, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { KnowledgeNode, Attempt } from "@/types/knowledge";
import ReactMarkdown from "react-markdown";

interface ReinforcementEngineProps {
  node: KnowledgeNode;
  onAddAttempt: (nodeId: string, attempt: Attempt) => void;
  onClose: () => void;
}

type QuestionData = {
  question: string;
  correctAnswer: string;
  type: "definition" | "application" | "misconception" | "fill";
};

export function ReinforcementEngine({ node, onAddAttempt, onClose }: ReinforcementEngineProps) {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [phase, setPhase] = useState<"answering" | "confidence" | "evaluating" | "feedback" | "completed">("answering");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high" | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  useEffect(() => {
    generateQuestions();
  }, [node.id]);

  const generateQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prompt = `Generate exactly 10 advanced flashcard questions for the concept "${node.term}".
Mix these types: "definition", "fill", "application", "misconception".
Return ONLY a valid stringified JSON array inside the "explanation" field exactly matching this schema:
[{"question": "The question text...", "correctAnswer": "The expected robust answer or explanation", "type": "definition"}]
Do NOT include any external markdown or text outside this JSON string in your explanation field payload.`;

      const { data, error: fnError } = await supabase.functions.invoke("explore-concept", {
        body: { query: prompt, context: node.explanation, complexity: "expert" },
      });

      if (fnError) throw fnError;
      
      let parsedQ: QuestionData[] = [];
      try {
        parsedQ = JSON.parse(data.explanation);
      } catch (e) {
        // Fallback or attempt to strip out markdown blocks
        const cleaned = data.explanation.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedQ = JSON.parse(cleaned);
      }

      if (Array.isArray(parsedQ) && parsedQ.length > 0) {
        setQuestions(parsedQ);
      } else {
        throw new Error("Failed to parse valid questions format.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;
    setPhase("confidence");
  };

  const handleConfidenceSelect = async (level: "low" | "medium" | "high") => {
    setConfidence(level);
    setPhase("evaluating");
    
    // Evaluate via Socratic
    const currentQ = questions[currentIndex];
    try {
      const { data, error: fnError } = await supabase.functions.invoke("socratic-check", {
        body: { 
          term: currentQ.question, 
          userAnswer: userAnswer, 
          originalExplanation: currentQ.correctAnswer 
        },
      });

      if (fnError) throw fnError;

      const isCorrect = data.understood || data.score >= 70;
      setFeedback({ isCorrect, text: data.feedback });
      
      onAddAttempt(node.id, {
        question: currentQ.question,
        userAnswer,
        correctAnswer: currentQ.correctAnswer,
        isCorrect,
        confidence: level,
        type: currentQ.type
      });
      
      setPhase("feedback");
    } catch (e) {
      console.error(e);
      // Fallback optimistic grading if disconnected
      setFeedback({ isCorrect: false, text: "Error evaluating answer. Please proceed to the next question." });
      setPhase("feedback");
    }
  };

  const handleNext = () => {
    // Basic Adaptive Logic:
    // If they got it wrong, look for a definition or fill next.
    // If they got it right, look for application or misconception next.
    let nextIndex = currentIndex + 1;
    
    if (feedback) {
      const remainingQuestions = questions.slice(currentIndex + 1);
      if (remainingQuestions.length > 0) {
        if (!feedback.isCorrect) {
          const easierIndex = remainingQuestions.findIndex(q => q.type === "definition" || q.type === "fill");
          if (easierIndex !== -1) nextIndex = (currentIndex + 1) + easierIndex;
        } else {
          const harderIndex = remainingQuestions.findIndex(q => q.type === "application" || q.type === "misconception");
          if (harderIndex !== -1) nextIndex = (currentIndex + 1) + harderIndex;
        }
      }
    }

    if (nextIndex >= questions.length || remainingCount() <= 0) {
      setPhase("completed");
    } else {
      // Swap to put the found question next if it wasn't sequentially next
      if (nextIndex !== currentIndex + 1) {
         const newQuestions = [...questions];
         const temp = newQuestions[currentIndex + 1];
         newQuestions[currentIndex + 1] = newQuestions[nextIndex];
         newQuestions[nextIndex] = temp;
         setQuestions(newQuestions);
      }

      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setConfidence(null);
      setFeedback(null);
      setPhase("answering");
    }
  };

  const remainingCount = () => questions.length - 1 - currentIndex;

  if (isLoading) {
    return (
      <div className="bg-card/70 border border-border/50 rounded-2xl shadow-xl h-full backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold mb-2">Synthesizing Reinforcements</h2>
        <p className="text-muted-foreground">Generating cognitive flashcards for <strong>{node.term}</strong>...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="bg-card/70 border border-border/50 rounded-2xl shadow-xl h-full backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-muted-foreground mb-4">{error || "Could not generate questions."}</p>
        <Button onClick={onClose} variant="outline">Back to Exploration</Button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  if (phase === "completed") {
    return (
      <div className="bg-card/70 border border-border/50 rounded-2xl shadow-xl h-full backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
        <BrainCircuit className="w-16 h-16 text-emerald-500 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Reinforcement Complete!</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          You've completed the active cognitive reinforcement loop for <strong>{node.term}</strong>. 
          Your gaps and strengths have been actively mapped into your session report.
        </p>
        <Button onClick={onClose} size="lg" className="bg-primary text-primary-foreground">
          Continue Exploring
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card/70 border border-border/50 rounded-2xl shadow-xl h-full backdrop-blur-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0 bg-background/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Cognitive Reinforcement</h2>
            <div className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex gap-2 items-center">
              <span>{node.term}</span>
              <span>•</span>
              <span className="text-blue-400">{currentQ.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-muted-foreground">{currentIndex + 1} / {questions.length}</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Flashcard Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col">
        {/* Question */}
        <div className="bg-background/80 border border-border/60 p-6 md:p-8 rounded-2xl shadow-sm mb-8">
          <div className="prose prose-invert prose-lg max-w-none font-medium">
            <ReactMarkdown>
              {currentQ.question}
            </ReactMarkdown>
          </div>
        </div>

        {/* Input Phase */}
        {phase === "answering" && (
          <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-4 max-w-2xl w-full mx-auto animate-in slide-in-from-bottom-4 duration-300 relative">
            <label className="text-sm font-bold tracking-widest text-muted-foreground uppercase ml-1">Your Answer</label>
            <Input 
              autoFocus 
              type="text" 
              value={userAnswer} 
              onChange={(e) => setUserAnswer(e.target.value)} 
              placeholder="Type your understanding here..." 
              className="h-14 text-lg bg-background/50 border-border/60 backdrop-blur-sm"
            />
            <Button type="submit" disabled={!userAnswer.trim()} size="lg" className="mt-2 w-full sm:w-auto sm:self-end">
              Submit Answer
            </Button>
          </form>
        )}

        {/* Confidence Phase */}
        {phase === "confidence" && (
          <div className="max-w-2xl w-full mx-auto flex flex-col items-center animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-bold mb-6">How confident are you?</h3>
            <div className="grid grid-cols-3 gap-4 w-full">
              <Button variant="outline" size="lg" className="h-20 flex flex-col gap-2 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50" onClick={() => handleConfidenceSelect("low")}>
                <span className="text-xl">🤔</span>
                <span className="font-bold">Low</span>
              </Button>
              <Button variant="outline" size="lg" className="h-20 flex flex-col gap-2 hover:bg-yellow-500/20 hover:text-yellow-500 hover:border-yellow-500/50" onClick={() => handleConfidenceSelect("medium")}>
                <span className="text-xl">😐</span>
                <span className="font-bold">Medium</span>
              </Button>
              <Button variant="outline" size="lg" className="h-20 flex flex-col gap-2 hover:bg-emerald-500/20 hover:text-emerald-500 hover:border-emerald-500/50" onClick={() => handleConfidenceSelect("high")}>
                <span className="text-xl">😎</span>
                <span className="font-bold">High</span>
              </Button>
            </div>
          </div>
        )}

        {/* Evaluating Phase */}
        {phase === "evaluating" && (
          <div className="flex flex-col items-center justify-center py-12 animate-in fade-in">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-mono tracking-widest uppercase animate-pulse">Analyzing Logic...</p>
          </div>
        )}

        {/* Feedback Phase */}
        {phase === "feedback" && feedback && (
          <div className="flex flex-col max-w-3xl mx-auto w-full animate-in slide-in-from-bottom-8 duration-500">
            <div className={`p-6 md:p-8 rounded-2xl border ${feedback.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-destructive/10 border-destructive/30'} mb-6`}>
              <div className="flex items-start gap-4">
                {feedback.isCorrect ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0 mt-1" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-destructive shrink-0 mt-1" />
                )}
                <div>
                  <h3 className={`text-2xl font-bold mb-4 ${feedback.isCorrect ? 'text-emerald-500' : 'text-destructive'}`}>
                    {feedback.isCorrect ? "Correct!" : "Not Quite."}
                  </h3>
                  <div className="prose prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                    <ReactMarkdown>{feedback.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            {!feedback.isCorrect && (
              <div className="p-6 bg-background/50 border border-border/50 rounded-2xl mb-6">
                <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase block mb-2">Expected Answer Logic</span>
                <div className="prose prose-invert max-w-none text-muted-foreground">
                  <ReactMarkdown>{currentQ.correctAnswer}</ReactMarkdown>
                </div>
              </div>
            )}

            <Button size="lg" onClick={handleNext} className="w-full sm:w-auto sm:self-end mt-4 gap-2">
              Next Question <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
