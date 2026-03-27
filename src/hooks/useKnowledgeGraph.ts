import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { KnowledgeNode, Complexity, ExploreResponse, SocraticResponse } from "@/types/knowledge";

let nodeCounter = 0;
const genId = () => `node-${++nodeCounter}`;

export function useKnowledgeGraph() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [error, setError] = useState<string | null>(null);

  const exploreConcept = useCallback(async (query: string, parentId: string | null = null, depth: number = 0) => {
    setIsLoading(true);
    setError(null);

    // Check if already explored
    const existing = nodes.find(n => n.term.toLowerCase() === query.toLowerCase());
    if (existing) {
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
        status: "explored",
        parentId,
        depth,
        difficulty: response.concepts?.[0]?.difficulty || "intermediate",
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
          n.id === nodeId ? { ...n, status: "understood" as const, socraticScore: response.score } : n
        ));
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
      n.id === nodeId ? { ...n, status: "understood" as const, socraticScore: 100 } : n
    ));
  }, []);

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
    nodes, isLoading, activeNodeId, setActiveNodeId, complexity, setComplexity,
    error, exploreConcept, checkUnderstanding, markUnderstood, stats,
  };
}
