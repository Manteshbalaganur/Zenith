import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, context, complexity } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const complexityGuide = {
      eli5: "Explain like I'm 5 years old. Use simple analogies and everyday language. Avoid all jargon.",
      standard: "Explain clearly for someone with basic knowledge. Use some technical terms but define them.",
      expert: "Explain at an expert level with precise technical terminology and nuance."
    };

    const systemPrompt = `You are RUE (Recursive Understanding Engine), an AI designed to help users achieve deep understanding of concepts through recursive exploration.

Your task: Given a user's question or concept, provide a clear explanation and identify the key conceptual terms that a learner might need to understand.

Complexity level: ${complexityGuide[complexity as keyof typeof complexityGuide] || complexityGuide.standard}

${context ? `Context from previous exploration: ${context}` : ""}

You MUST respond with valid JSON in exactly this format:
{
  "explanation": "Your clear explanation here...",
  "concepts": [
    {
      "term": "Concept Name",
      "difficulty": "beginner|intermediate|advanced",
      "reason": "Why this term is important to understand"
    }
  ]
}

Rules for concept extraction:
- Extract 3-7 meaningful conceptual terms that are important for understanding
- Do NOT extract common/simple words like "is", "the", "provides"
- Focus on terms that are: technically meaningful, potentially confusing, important building blocks
- Tag difficulty accurately: beginner (common knowledge), intermediate (domain knowledge needed), advanced (expert-level)
- Each concept should have a brief reason explaining why understanding it matters`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { explanation: content, concepts: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("explore-concept error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
