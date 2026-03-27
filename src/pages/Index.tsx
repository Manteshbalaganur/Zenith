import { useKnowledgeGraph } from "@/hooks/useKnowledgeGraph";
import { QueryInput } from "@/components/QueryInput";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { UnderstandingScore } from "@/components/UnderstandingScore";
import { ComplexitySlider } from "@/components/ComplexitySlider";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

const Index = () => {
  const {
    nodes, isLoading, activeNodeId, setActiveNodeId, complexity, setComplexity,
    error, exploreConcept, checkUnderstanding, markUnderstood, stats,
  } = useKnowledgeGraph();

  const activeNode = nodes.find(n => n.id === activeNodeId);

  const breadcrumbs = useMemo(() => {
    if (!activeNode) return [];
    const crumbs = [activeNode];
    let current = activeNode;
    while (current.parentId) {
      const parent = nodes.find(n => n.id === current.parentId);
      if (!parent) break;
      crumbs.unshift(parent);
      current = parent;
    }
    return crumbs;
  }, [activeNode, nodes]);

  const handleExplore = async (query: string) => {
    const parentId = activeNodeId;
    const depth = activeNode ? activeNode.depth + 1 : 0;
    await exploreConcept(query, parentId, depth);
  };

  const handleInitialQuery = async (query: string) => {
    await exploreConcept(query, null, 0);
  };

  const handleBack = () => {
    if (breadcrumbs.length > 1) {
      setActiveNodeId(breadcrumbs[breadcrumbs.length - 2].id);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">R</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground tracking-tight">RUE</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Recursive Understanding Engine</p>
            </div>
          </div>
          {nodes.length > 0 && (
            <div className="hidden md:block w-48">
              <UnderstandingScore stats={stats} />
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {nodes.length === 0 ? (
          /* Landing state */
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
            <div className="text-center space-y-3 max-w-lg">
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Understand anything,{" "}
                <span className="text-primary">deeply</span>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ask a question. Explore the concepts in the answer. Keep going until you truly understand.
                Every term is a doorway to deeper knowledge.
              </p>
            </div>
            <QueryInput onSubmit={handleInitialQuery} isLoading={isLoading} />
            <div className="w-48">
              <ComplexitySlider value={complexity} onChange={setComplexity} />
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-mono">Exploring...</span>
              </div>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        ) : (
          /* Exploration state */
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            {/* Left: Knowledge Graph */}
            <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Knowledge Map</span>
                <QueryInput onSubmit={handleInitialQuery} isLoading={isLoading} />
              </div>
              <div className="flex-1 p-4 min-h-[300px]">
                <KnowledgeGraph nodes={nodes} activeNodeId={activeNodeId} onNodeClick={setActiveNodeId} />
              </div>
              {/* Mobile stats */}
              <div className="lg:hidden p-4 border-t border-border">
                <UnderstandingScore stats={stats} />
              </div>
              <div className="p-4 border-t border-border">
                <ComplexitySlider value={complexity} onChange={setComplexity} />
              </div>
            </div>

            {/* Right: Explanation */}
            <div className="lg:w-1/2 flex flex-col min-h-0">
              {activeNode ? (
                <ExplanationPanel
                  node={activeNode}
                  nodes={nodes}
                  onExplore={handleExplore}
                  onBack={handleBack}
                  onSocraticCheck={(answer) => checkUnderstanding(activeNode.id, answer)}
                  onMarkUnderstood={() => markUnderstood(activeNode.id)}
                  isLoading={isLoading}
                  breadcrumbs={breadcrumbs}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Select a node to view its explanation
                </div>
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-primary p-4 border-t border-border">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-mono">Exploring...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
