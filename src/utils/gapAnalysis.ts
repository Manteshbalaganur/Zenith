import type { KnowledgeNode } from "@/types/knowledge";

export type TopicProgress = {
  topic: string;
  depth: number;
  interactions: number;
  testScore?: number;
  subtopics?: string[];
  exploredSubtopics?: string[];
};

export type GapAnalysisResult = {
  level: "Beginner" | "Intermediate" | "Advanced";
  confidenceScore: number;
  gaps: string[];
  strengths: string[];
  recommendations: string[];
  progressData: TopicProgress[];
};

export function runGapAnalysis(nodes: KnowledgeNode[]): GapAnalysisResult {
  if (!nodes || nodes.length === 0) {
    return {
      level: "Beginner",
      confidenceScore: 0,
      gaps: [],
      strengths: [],
      recommendations: ["Start exploring topics to see gap analysis."],
      progressData: []
    };
  }

  const progressData: TopicProgress[] = [];
  const exploredTerms = new Set(nodes.map(n => n.term.toLowerCase()));

  let totalScore = 0;
  let scoredCount = 0;
  
  const gaps: string[] = [];
  const strengths: string[] = [];
  const recommendations: Set<string> = new Set();

  nodes.forEach(node => {
    const exploredSubtopics = node.concepts
      .map(c => c.term)
      .filter(term => exploredTerms.has(term.toLowerCase()));
      
    const progress: TopicProgress = {
      topic: node.term,
      depth: node.depth,
      interactions: node.interactions || 1, // Default to 1 if explored
      testScore: node.socraticScore,
      subtopics: node.concepts.map(c => c.term),
      exploredSubtopics
    };
    progressData.push(progress);

    if (progress.testScore !== undefined) {
      totalScore += progress.testScore;
      scoredCount++;
    }

    // Gap Analysis Logic for this specific topic
    const missingSubtopicsCount = (progress.subtopics?.length || 0) - (progress.exploredSubtopics?.length || 0);
    const lowInteractions = progress.interactions < 3;
    const shallowDepth = progress.depth < 2;
    const lowTestScore = progress.testScore !== undefined && progress.testScore < 70;

    if (lowTestScore) {
      gaps.push(`Low test performance observed on "${progress.topic}"`);
      recommendations.add(`Re-test your understanding on "${progress.topic}"`);
    } else if (progress.testScore && progress.testScore >= 85) {
      strengths.push(`Strong understanding of "${progress.topic}"`);
    }

    if (shallowDepth && !lowTestScore && missingSubtopicsCount > 0) {
      gaps.push(`Superficial exploration of "${progress.topic}"`);
      recommendations.add(`Explore deeper subtopics of "${progress.topic}"`);
    }

    if (lowInteractions && node.status !== 'understood') {
       // Only flag as gap if they haven't proven understanding
       gaps.push(`Low interaction time with "${progress.topic}"`);
    }

    if (node.attempts && node.attempts.length > 0) {
      node.attempts.forEach(attempt => {
        if (!attempt.isCorrect && attempt.confidence === 'high') {
          gaps.push(`Strong misconception detected for "${progress.topic}"`);
          recommendations.add(`Review core definitions to correct misconceptions on "${progress.topic}"`);
        } else if (attempt.isCorrect && attempt.confidence === 'low') {
          recommendations.add(`Build confidence by re-testing weak understanding of "${progress.topic}"`);
        } else if (!attempt.isCorrect && attempt.confidence === 'low') {
          gaps.push(`Knowledge gap verified for "${progress.topic}"`);
        } else if (attempt.isCorrect && attempt.confidence === 'high') {
          strengths.push(`Solidified understanding of "${progress.topic}" via reinforcement`);
        }
      });
    }
    
    // Suggest one missing subtopic to explore
    if (progress.subtopics && missingSubtopicsCount > 0) {
      const unexplored = progress.subtopics.find(st => !progress.exploredSubtopics?.includes(st));
      if (unexplored) {
        recommendations.add(`Explore new concept: "${unexplored}"`);
      }
    }
  });

  const confidenceScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 50; // Default if no tests taken
  let level: "Beginner" | "Intermediate" | "Advanced" = "Beginner";
  
  if (confidenceScore >= 80 && nodes.length > 5) level = "Advanced";
  else if (confidenceScore >= 50 && nodes.length > 2) level = "Intermediate";

  // Deduplicate and slice for readability
  const uniqueGaps = Array.from(new Set(gaps)).slice(0, 5);
  const uniqueRecommendations = Array.from(recommendations).slice(0, 5);
  const uniqueStrengths = Array.from(new Set(strengths)).slice(0, 5);

  if (uniqueGaps.length === 0 && scoredCount === 0) {
     uniqueGaps.push("Not enough data to find specific gaps. Try testing your knowledge!");
  }

  if (uniqueStrengths.length === 0) {
    if (nodes.filter(n => n.status === 'understood').length > 0) {
      uniqueStrengths.push("Shows initiative by validating topics.");
    } else {
      uniqueStrengths.push("Exploration started successfully.");
    }
  }

  return {
    level,
    confidenceScore,
    gaps: uniqueGaps,
    strengths: uniqueStrengths,
    recommendations: uniqueRecommendations,
    progressData
  };
}
