import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { KnowledgeNode, Complexity, ExploreResponse, SocraticResponse, Attempt } from "@/types/knowledge";

let nodeCounter = 0;
const genId = () => `node-${Date.now()}-${++nodeCounter}`;

const genSessionId = () => {
  let sid = localStorage.getItem("zenith_session_id");
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("zenith_session_id", sid);
  }
  return sid;
};

export function useKnowledgeGraph() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [globalUnderstandingScore, setGlobalUnderstandingScore] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);
  const [mapId, setMapId] = useState<string | null>(null);
  const sessionId = useMemo(genSessionId, []);

  // Adaptive difficulty logic
  useEffect(() => {
    if (globalUnderstandingScore < 40) setComplexity("eli5");
    else if (globalUnderstandingScore < 80) setComplexity("standard");
    else setComplexity("expert");
  }, [globalUnderstandingScore]);

  // Save changes to Supabase
  useEffect(() => {
    if (nodes.length === 0) return;
    
    let isSubscribed = true;
    (async () => {
      try {
        if (!mapId) {
          const { data, error } = await (supabase as any).from('knowledge_maps').insert({
            user_id: sessionId,
            query: nodes[0].term,
            title: nodes[0].term,
            map_data: nodes
          }).select().single();
          if (!error && data && isSubscribed) {
            setMapId(data.id);
          }
        } else {
          await (supabase as any).from('knowledge_maps').update({
            map_data: nodes,
            updated_at: new Date().toISOString()
          }).eq('id', mapId);
        }
      } catch(e) { console.error('Supabase save error', e); }
    })();

    return () => { isSubscribed = false; };
  }, [nodes]); // Trigger whenever nodes array changes

  // Realtime subscription (listen for changes on other tabs/devices)
  useEffect(() => {
    if (!mapId) return;
    
    const channel = supabase.channel(`public:knowledge_maps:id=eq.${mapId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'knowledge_maps', filter: `id=eq.${mapId}` }, (payload) => {
        // Simple heuristic to prevent loop (if map_data length drastically different, update it)
        // In a real app we'd compare deeply or use a timestamp
        if (payload.new && Array.isArray(payload.new.map_data)) {
           setNodes(payload.new.map_data as KnowledgeNode[]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mapId]);

  // Log exploration history on node click
  useEffect(() => {
    if (!mapId || !activeNodeId) return;
    const node = nodes.find(n => n.id === activeNodeId);
    if (!node) return;
    
    (async () => {
      try {
        await (supabase as any).from('exploration_history').insert({
          map_id: mapId,
          action: 'viewed_node',
          node_id: node.id,
          node_title: node.term
        });
      } catch(e) {}
    })();
  }, [mapId, activeNodeId]);


  const loadMap = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any).from('knowledge_maps').select('*').eq('id', id).single();
      if (!error && data) {
        setNodes(data.map_data);
        setMapId(data.id);
        setActiveNodeId(data.map_data[0]?.id || null);
      }
    } catch(e) { console.error('Load map error', e); }
    setIsLoading(false);
  }, []);

  const exploreConcept = useCallback(async (query: string, parentId: string | null = null, depth: number = 0) => {
    setIsLoading(true);
    setError(null);

    // Check if already explored
    const existing = nodes.find(n => n.term.toLowerCase() === query.toLowerCase());
    if (existing) {
      setNodes(prev => prev.map(n => n.id === existing.id ? { ...n, interactions: (n.interactions || 1) + 1 } : n));
      setActiveNodeId(existing.id);
      setIsLoading(false);
      return existing;
    }

    try {
      const context = parentId
        ? nodes.filter(n => n.id === parentId).map(n => `Previously exploring: ${n.term}`).join(". ")
        : "";

      const { data, error: fnError } = await supabase.functions.invoke("explore-concept", {
        body: { query, context, complexity },
      });

      if (fnError) throw fnError;
      const response = data as ExploreResponse;

      const newNode: KnowledgeNode = {
        id: genId(),
        term: query,
        explanation: response.explanation,
        concepts: response.concepts || [],
        resources: response.recommended_resources || [],
        status: "explored",
        parentId,
        depth,
        difficulty: response.concepts?.[0]?.difficulty || "intermediate",
        interactions: 1,
      };

      setNodes(prev => [...prev, newNode]);
      setActiveNodeId(newNode.id);
      setIsLoading(false);
      return newNode;
    } catch (e: any) {
      setError(e.message || "Failed to explore concept");
      setIsLoading(false);
      return null;
    }
  }, [nodes, complexity]);

  const checkUnderstanding = useCallback(async (nodeId: string, userAnswer: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("socratic-check", {
        body: { term: node.term, userAnswer, originalExplanation: node.explanation },
      });

      if (fnError) throw fnError;
      const response = data as SocraticResponse;

      if (response.understood) {
        setNodes(prev => prev.map(n =>
          n.id === nodeId ? { ...n, status: "understood" as const, socraticScore: response.score, interactions: (n.interactions || 1) + 1 } : n
        ));
      } else {
        setNodes(prev => prev.map(n =>
          n.id === nodeId ? { ...n, socraticScore: response.score, interactions: (n.interactions || 1) + 1 } : n
        ));
      }
      
      setGlobalUnderstandingScore(prev => Math.round(prev * 0.4 + response.score * 0.6));

      if (mapId) {
        (supabase as any).from('exploration_history').insert({
          map_id: mapId,
          action: `socratic_test_score_${response.score}`,
          node_id: nodeId,
          node_title: node.term
        }).then();
      }

      setIsLoading(false);
      return response;
    } catch (e: any) {
      setError(e.message || "Failed to check understanding");
      setIsLoading(false);
      return null;
    }
  }, [nodes]);

  const markUnderstood = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, status: "understood" as const, socraticScore: 100, interactions: (n.interactions || 1) + 1 } : n
    ));
    setGlobalUnderstandingScore(prev => Math.round(prev * 0.3 + 100 * 0.7));
  }, []);

  const addConceptToNode = useCallback((nodeId: string, customTerm: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        if (n.concepts?.some(c => c.term.toLowerCase() === customTerm.toLowerCase())) {
          return n;
        }
        return {
          ...n,
          interactions: (n.interactions || 1) + 1,
          concepts: [
            ...(n.concepts || []),
            { term: customTerm, difficulty: n.difficulty, reason: "Added from selection" }
          ]
        };
      }
      return n;
    }));
  }, []);

  const addAttemptToNode = useCallback((nodeId: string, attempt: Attempt) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          interactions: (n.interactions || 1) + 1,
          attempts: [...(n.attempts || []), attempt]
        };
      }
      return n;
    }));
  }, []);

  const collapseUnderstanding = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("collapse-understanding", {
        body: { nodes },
      });
      if (fnError) throw fnError;
      setIsLoading(false);
      return data;
    } catch (e: any) {
      setError(e.message || "Failed to collapse understanding");
      setIsLoading(false);
      return null;
    }
  }, [nodes]);

  const teachMeBackEvaluate = useCallback(async (explanation: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("teach-me-back-evaluate", {
        body: { nodes, explanation },
      });
      if (fnError) throw fnError;
      setIsLoading(false);
      return data;
    } catch (e: any) {
      setError(e.message || "Failed to evaluate teach back");
      setIsLoading(false);
      return null;
    }
  }, [nodes]);

  const stats = {
    total: nodes.length,
    explored: nodes.filter(n => n.status === "explored").length,
    understood: nodes.filter(n => n.status === "understood").length,
    score: nodes.length > 0
      ? Math.round((nodes.filter(n => n.status === "understood").length / nodes.length) * 100)
      : 0,
    maxDepth: nodes.length > 0 ? Math.max(...nodes.map(n => n.depth)) : 0,
  };

  return {
    nodes, setNodes, isLoading, activeNodeId, setActiveNodeId, complexity, setComplexity, globalUnderstandingScore,
    error, exploreConcept, checkUnderstanding, markUnderstood, addConceptToNode, addAttemptToNode, stats,
    collapseUnderstanding, teachMeBackEvaluate, loadMap, mapId, sessionId
  };
}
