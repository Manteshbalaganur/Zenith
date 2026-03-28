import { useKnowledgeGraph } from "@/hooks/useKnowledgeGraph";
import { QueryInput } from "@/components/QueryInput";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { MindMapModal } from "@/components/MindMapModal";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { GuidedRecoveryModal } from "@/components/GuidedRecoveryModal";
import { ReinforcementEngine } from "@/components/ReinforcementEngine";
import { UnderstandingScore } from "@/components/UnderstandingScore";
import { ComplexitySlider } from "@/components/ComplexitySlider";
import { TeachMeBackMode } from "@/components/TeachMeBackMode";
import { Loader2, Download, Menu, BrainCircuit, X, Network, FileText, BarChart, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { runGapAnalysis, type GapAnalysisResult } from "@/utils/gapAnalysis";
import ReactMarkdown from "react-markdown";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const Index = () => {
  const {
    nodes, setNodes, isLoading, activeNodeId, setActiveNodeId, complexity, setComplexity,
    error, exploreConcept, checkUnderstanding, markUnderstood, addConceptToNode, addAttemptToNode, stats,
    collapseUnderstanding, teachMeBackEvaluate, loadMap, sessionId
  } = useKnowledgeGraph();

  const [isTeachMeBackOpen, setIsTeachMeBackOpen] = useState(false);
  const [collapsedData, setCollapsedData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [activeRecoveryTerm, setActiveRecoveryTerm] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [mainView, setMainView] = useState<'explanation' | 'report' | 'analysis' | 'reinforce'>('explanation');
  const [gapAnalysisData, setGapAnalysisData] = useState<GapAnalysisResult | null>(null);

  const handleCollapse = async () => {
    const data = await collapseUnderstanding();
    if (data) {
      setCollapsedData(data);
      setIsTeachMeBackOpen(true);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("pdf-content-area");
    const mindmapElement = document.getElementById("mindmap-export-container");
    if (!element || !mindmapElement) return;

    const itemsToHide = element.querySelectorAll(".pdf-ignore");
    itemsToHide.forEach(el => (el as HTMLElement).style.display = "none");
    mindmapElement.style.display = "block"; // Temporarily show

    // wait for layout
    await new Promise(res => setTimeout(res, 500));

    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      
      // Page 1: Explanation
      const canvas1 = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas1.height * pdfWidth) / canvas1.width;
      pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));

      // Page 2: Mindmap
      pdf.addPage();
      const canvas2 = await html2canvas(mindmapElement, { scale: 2, useCORS: true });
      const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
      const mmHeight = (canvas2.height * pdfWidth) / canvas2.width;
      pdf.addImage(imgData2, 'JPEG', 0, 0, pdfWidth, Math.min(mmHeight, pdf.internal.pageSize.getHeight()));

      pdf.save(`Zenith_${nodes[0]?.term || 'Export'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      itemsToHide.forEach(el => (el as HTMLElement).style.display = "");
      mindmapElement.style.display = "none";
    }
  };

  const handleRunAnalysis = () => {
    setGapAnalysisData(runGapAnalysis(nodes));
    setMainView('analysis');
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
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(prev => !prev)} className="hover:bg-primary/20 hover:text-primary transition-all rounded-full lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          {nodes.length > 0 && (
            <div className="w-32 sm:w-40 hidden sm:block">
              <UnderstandingScore stats={stats} />
            </div>
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
              {/* Left Sidebar Layout (Controls Panel) */}
              <div className={`${isSidebarOpen ? 'flex' : 'hidden lg:flex'} fixed lg:static inset-y-0 left-0 w-full sm:w-[350px] lg:w-[320px] 2xl:w-[380px] border-r border-border/50 bg-background/95 lg:bg-background/60 shadow-2xl lg:shadow-xl flex-col overflow-hidden z-40 transition-all duration-300`}>
                <div className="lg:hidden p-4 border-b border-border/50 flex justify-between items-center shrink-0">
                  <span className="font-bold text-lg">Menu</span>
                  <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex-1 lg:h-full p-6 flex flex-col gap-4 overflow-y-auto">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Controls</h3>
                  
                  <Button onClick={() => { setIsMindMapOpen(true); setIsSidebarOpen(false); }} variant="outline" className="w-full justify-start border-primary/30 hover:bg-primary/10 transition-all">
                    <Network className="w-4 h-4 mr-3 text-primary" />
                    View Mindmap
                  </Button>
                  
                  <Button onClick={() => { handleCollapse(); setIsSidebarOpen(false); }} variant="outline" className="w-full justify-start border-primary/30 hover:bg-primary/10 transition-all">
                    <BrainCircuit className="w-4 h-4 mr-3 text-emerald-500" />
                    Collapse View
                  </Button>

                  <hr className="w-full border-border/50 my-2" />

                  <Button onClick={() => { handleExportPDF(); setIsSidebarOpen(false); }} variant="outline" className="w-full justify-start border-primary/30 hover:bg-primary/10 transition-all">
                    <Download className="w-4 h-4 mr-3 text-cyan-400" />
                    Export PDF
                  </Button>
                  
                  <Button onClick={() => { setMainView('report'); setIsSidebarOpen(false); }} variant="outline" className="w-full justify-start border-primary/30 hover:bg-primary/10 transition-all">
                    <FileText className="w-4 h-4 mr-3 text-orange-400" />
                    Session Report
                  </Button>

                  <hr className="w-full border-border/50 my-2" />

                  <Button onClick={() => { handleRunAnalysis(); setIsSidebarOpen(false); }} variant="outline" className="w-full justify-start border-primary/30 hover:bg-primary/10 transition-all">
                    <BarChart className="w-4 h-4 mr-3 text-purple-400" />
                    Analyze Understanding
                  </Button>

                  <Button onClick={() => { setMainView('reinforce'); setIsSidebarOpen(false); }} variant="outline" className="w-full justify-start border-primary/30 hover:bg-primary/10 transition-all">
                    <Target className="w-4 h-4 mr-3 text-rose-400" />
                    Reinforce Understanding
                  </Button>
                  
                  {mainView !== 'explanation' && (
                    <Button onClick={() => { setMainView('explanation'); setIsSidebarOpen(false); }} variant="ghost" className="w-full justify-start mt-4 transition-all text-muted-foreground">
                      <X className="w-4 h-4 mr-3" />
                      Close Current View
                    </Button>
                  )}
                </div>
              </div>

              {/* Right: Explanation */}
              <div id="pdf-content-area" className="flex-1 flex flex-col min-h-0 relative z-10 p-2 md:p-6 lg:ml-2">
              {mainView === 'report' ? (
                <div className="bg-card/70 border border-border/50 rounded-2xl shadow-xl h-full backdrop-blur-md overflow-y-auto p-6 md:p-8">
                  <div className="prose prose-invert max-w-none">
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><FileText className="w-8 h-8 text-orange-400" /> Session Report</h2>
                    <p className="text-muted-foreground mb-8">Generated {new Date().toLocaleDateString()}</p>
                    
                    <h3>Topics Explored</h3>
                    <ul>
                      {nodes.map(n => <li key={n.id}><strong>{n.term}</strong> (Depth: {n.depth})</li>)}
                    </ul>

                    <h3>Key Insights</h3>
                    <p>You have navigated through {nodes.length} distinct concepts, drilling down to a maximum depth of {Math.max(0, ...nodes.map(n => n.depth))}. Your learning pattern suggests a {nodes.length > 5 ? 'comprehensive' : 'focused'} approach to mastering these domains.</p>
                  </div>
                </div>
              ) : mainView === 'analysis' && gapAnalysisData ? (
                <div className="bg-card/70 border border-border/50 rounded-2xl shadow-xl h-full backdrop-blur-md overflow-y-auto p-6 md:p-8">
                  <div className="prose prose-invert max-w-none">
                    <h2 className="text-3xl font-bold flex items-center gap-3 pt-0 mt-0"><BarChart className="w-8 h-8 text-purple-400" /> Knowledge Gap Analysis</h2>
                    
                    <div className="flex gap-4 my-6 not-prose">
                      <div className="bg-background/50 border border-border p-4 rounded-xl flex-1 max-w-[200px]">
                        <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1">Estimated Level</div>
                        <div className="text-3xl font-bold">{gapAnalysisData.level}</div>
                      </div>
                      <div className="bg-background/50 border border-border p-4 rounded-xl flex-1 max-w-[200px]">
                        <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-1">Confidence Score</div>
                        <div className="text-3xl font-bold text-primary">{gapAnalysisData.confidenceScore}%</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-8">
                      <div>
                        <h3 className="text-emerald-400 mt-0">Identified Strengths</h3>
                        <ul className="pl-5">
                          {gapAnalysisData.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                         <h3 className="text-orange-400 mt-0">Knowledge Gaps</h3>
                          <ul className="pl-5">
                            {gapAnalysisData.gaps.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                      </div>
                    </div>

                    <h3 className="text-cyan-400">Recommended Next Steps</h3>
                    <ul className="pl-5">
                      {gapAnalysisData.recommendations.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              ) : mainView === 'reinforce' && activeNode ? (
                <ReinforcementEngine
                  node={activeNode}
                  onAddAttempt={addAttemptToNode}
                  onClose={() => setMainView('explanation')}
                />
              ) : activeNode ? (
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
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-2xl m-4 bg-card/30 backdrop-blur-md">
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

      {/* Hidden container for PDF export */}
      <div id="mindmap-export-container" className="absolute top-0 left-0 w-[1200px] h-[800px] bg-background -z-50 opacity-0 pointer-events-none" style={{ display: 'none' }}>
        {nodes.length > 0 && (
           <KnowledgeGraph 
             nodes={nodes} 
             activeNodeId={activeNodeId} 
             onNodeClick={() => {}} 
           />
        )}
      </div>
    </div>
  );
};

export default Index;
