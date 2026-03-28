import { useKnowledgeGraph } from "@/hooks/useKnowledgeGraph";
import { QueryInput } from "@/components/QueryInput";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { MindMapModal } from "@/components/MindMapModal";
import { GuidedRecoveryModal } from "@/components/GuidedRecoveryModal";
import { UnderstandingScore } from "@/components/UnderstandingScore";
import { ComplexitySlider } from "@/components/ComplexitySlider";
import { TeachMeBackMode } from "@/components/TeachMeBackMode";
import { HistorySidebar } from "@/components/HistorySidebar";
import { Loader2, Download, History, BrainCircuit, X, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import html2pdf from "html2pdf.js";

const Index = () => {
  const {
    nodes, setNodes, isLoading, activeNodeId, setActiveNodeId, complexity, setComplexity,
    error, exploreConcept, checkUnderstanding, markUnderstood, addConceptToNode, stats,
    collapseUnderstanding, teachMeBackEvaluate, loadMap, sessionId
  } = useKnowledgeGraph();

  const [isTeachMeBackOpen, setIsTeachMeBackOpen] = useState(false);
  const [collapsedData, setCollapsedData] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [activeRecoveryTerm, setActiveRecoveryTerm] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleCollapse = async () => {
    const data = await collapseUnderstanding();
    if (data) {
      setCollapsedData(data);
      setIsTeachMeBackOpen(true);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById("pdf-content-area");
    if (!element) return;
    const itemsToHide = element.querySelectorAll(".pdf-ignore");
    itemsToHide.forEach(el => (el as HTMLElement).style.display = "none");
    
    const opt = {
      margin: 10,
      filename: `Zenith_${nodes[0]?.term}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save().then(() => {
      itemsToHide.forEach(el => (el as HTMLElement).style.display = "");
    });
  };

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

  const handleNodeClick = (id: string) => {
    if (id.startsWith("unexplored-")) {
      const term = id.replace("unexplored-", "");
      handleExplore(term);
      setIsMindMapOpen(false);
    } else {
      setActiveNodeId(id);
      setIsMindMapOpen(false);
    }
  };

  const handleBack = () => {
    if (breadcrumbs.length > 1) {
      setActiveNodeId(breadcrumbs[breadcrumbs.length - 2].id);
    }
  };

  const handleSocraticCheck = async (answer: string) => {
    if (!activeNode) return null;
    const response = await checkUnderstanding(activeNode.id, answer);
    if (response && response.score < 40) {
      setActiveRecoveryTerm(activeNode.term);
    }
    return response;
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Permanent Header */}
      <header className="h-[64px] border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] shrink-0">
            <span className="text-primary font-bold text-sm">Z</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-foreground tracking-tight drop-shadow-md">Zenith</h1>
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground whitespace-nowrap">Recursive Understanding Engine</p>
          </div>
        </div>

        <div className="flex-1 flex justify-end items-center gap-2 md:gap-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(prev => !prev)} className="hover:bg-primary/20 hover:text-primary transition-all rounded-full">
            <History className="w-5 h-5" />
          </Button>
          {nodes.length > 0 && (
            <>
              <Button onClick={() => setIsMindMapOpen(true)} variant="outline" size="sm" className="hidden sm:flex border-primary/30 hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)] transition-all">
                <Network className="w-4 h-4 mr-2" />
                View Mind Map
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="hidden md:flex border-primary/30 hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)] transition-all">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              {!isTesting && (
                <Button size="sm" onClick={handleCollapse} className="hidden lg:flex bg-gradient-to-r from-teal-500 to-orange-500 hover:opacity-90 shadow-[0_0_15px_rgba(20,184,166,0.5)] transition-all border-none text-white font-medium">
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  Collapse <span className="hidden xl:inline ml-1">My Understanding</span>
                </Button>
              )}
              <div className="w-32 sm:w-40 hidden sm:block">
                <UnderstandingScore stats={stats} />
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex min-h-0 relative z-10 w-full max-w-[1600px] mx-auto">
        {nodes.length === 0 ? (
          /* Landing state */
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 animate-in fade-in duration-1000 mt-20 md:mt-0">
            <div className="text-center space-y-4 max-w-xl">
              <h2 className="text-5xl font-extrabold text-foreground tracking-tight drop-shadow-xl">
                Understand anything,{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]">deeply</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Start with a concept. Explore its underlying principles recursively. Reveal every layer until genuine mastery is achieved.
              </p>
            </div>
            
            <div className="w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <QueryInput 
                onSubmit={handleInitialQuery} 
                isLoading={isLoading} 
                complexity={complexity} 
                onComplexityChange={setComplexity} 
              />
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-primary mt-8 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-mono tracking-widest uppercase">Exploring Nodes...</span>
              </div>
            )}
            {error && <p className="text-destructive text-sm bg-destructive/10 px-4 py-2 rounded-lg border border-destructive/20">{error}</p>}
          </div>
        ) : (
          /* Exploration state - App Layout */
          <div className="flex-1 flex flex-col w-full min-h-0 bg-background/40 backdrop-blur-sm relative">
            
            {/* Prominent Search Bar (Main Content Area) */}
            <div className="w-full flex justify-center py-4 px-4 shrink-0 z-30 relative bg-background/50 border-b border-border/20 backdrop-blur-lg shadow-sm">
               <div className="w-full max-w-3xl animate-in fade-in slide-in-from-top-4 duration-500">
                 <QueryInput 
                   onSubmit={handleInitialQuery} 
                   isLoading={isLoading} 
                   complexity={complexity} 
                   onComplexityChange={setComplexity} 
                 />
               </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row w-full min-h-0">
              {/* Left Sidebar Layout */}
              <div className={`${isHistoryOpen ? 'flex' : 'hidden lg:flex'} fixed lg:static inset-y-0 left-0 w-full sm:w-[350px] lg:w-[320px] 2xl:w-[380px] border-r border-border/50 bg-background/95 lg:bg-background/60 shadow-2xl lg:shadow-xl flex-col overflow-hidden z-40 transition-all duration-300`}>
                <div className="lg:hidden p-4 border-b border-border/50 flex justify-between items-center shrink-0">
                  <span className="font-bold text-lg">Menu</span>
                  <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex-1 lg:h-full p-4 flex flex-col overflow-y-auto">
                  <HistorySidebar 
                    sessionId={sessionId} 
                    onSelectMap={(id) => { loadMap(id); setIsHistoryOpen(false); }} 
                    isEmbedded={true} 
                  />
                </div>
              </div>

              {/* Right: Explanation */}
              <div id="pdf-content-area" className="flex-1 flex flex-col min-h-0 relative z-10 p-2 md:p-6 lg:ml-2">
              {activeNode ? (
                <div className="bg-card/70 border border-border/50 rounded-2xl shadow-xl h-full backdrop-blur-md overflow-hidden flex flex-col">
                  <ExplanationPanel
                    node={activeNode}
                    nodes={nodes}
                    onExplore={handleExplore}
                    onAddConcept={(term) => addConceptToNode(activeNode.id, term)}
                    onBack={handleBack}
                    onSocraticCheck={handleSocraticCheck}
                    onMarkUnderstood={() => markUnderstood(activeNode.id)}
                    isLoading={isLoading}
                    breadcrumbs={breadcrumbs}
                    isTesting={isTesting}
                    onTestingStateChange={setIsTesting}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-2xl m-4">
                  Select a node to view its explanation
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                  <div className="flex items-center gap-3 text-primary bg-card border border-primary/20 px-8 py-5 rounded-full shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-base font-bold tracking-widest uppercase text-shadow-sm">Expanding Node...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        )}
      </main>

      {isTeachMeBackOpen && collapsedData && (
        <TeachMeBackMode
          collapsedData={collapsedData}
          onEvaluate={teachMeBackEvaluate}
          onClose={() => setIsTeachMeBackOpen(false)}
          onExpandGraph={(concept) => handleExplore(concept)}
          onMastered={() => {}}
        />
      )}

      {isMindMapOpen && (
        <MindMapModal
          nodes={nodes}
          activeNodeId={activeNodeId}
          onNodeClick={handleNodeClick}
          onClose={() => setIsMindMapOpen(false)}
        />
      )}

      {activeRecoveryTerm && activeNode && (
        <GuidedRecoveryModal
          term={activeRecoveryTerm}
          onClose={() => setActiveRecoveryTerm(null)}
          onComplete={() => {
            setActiveRecoveryTerm(null);
            markUnderstood(activeNode.id); // Or re-test implicitly
          }}
        />
      )}
    </div>
  );
};

export default Index;
