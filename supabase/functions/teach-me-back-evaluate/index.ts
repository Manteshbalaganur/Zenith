import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nodes, explanation } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const graphSummary = nodes.map((n: any) => n.term).join(", ");

    const systemPrompt = `You are Zenith, a Master Educator. The user has explored these concepts: ${graphSummary}.
    They were asked to teach back their comprehensive understanding in their own words.
    
    Their explanation:
    "${explanation}"
    
    Evaluate their understanding across the entire graph. Look for missing concepts, weak areas, and profound gaps.
    
    Respond with valid JSON:
    {
      "score": 0-100, // Overall mastery score
      "feedback": "Encouraging overall feedback.",
      "missingConcepts": ["term1", "term2"], // Concepts they completely missed or got wrong
      "gapExplanation": "Specific explanation of what they misunderstood."
    }`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) throw new Error("AI gateway error");

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("teach-me-back-evaluate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
