export type Difficulty = "beginner" | "intermediate" | "advanced";
export type NodeStatus = "unexplored" | "explored" | "understood";
export type Complexity = "eli5" | "standard" | "expert";

export interface ConceptTerm {
  term: string;
  difficulty: Difficulty;
  reason: string;
}

export interface Resource {
  title: string;
  url: string;
  description: string;
}

export interface KnowledgeNode {
  id: string;
  term: string;
  explanation: string;
  concepts: ConceptTerm[];
  status: NodeStatus;
  parentId: string | null;
  depth: number;
  difficulty: Difficulty;
  socraticScore?: number;
  resources?: Resource[];
}

export interface ExploreResponse {
  explanation: string;
  concepts: ConceptTerm[];
  recommended_resources?: Resource[];
}

export interface SocraticResponse {
  understood: boolean;
  feedback: string;
  score: number;
}
