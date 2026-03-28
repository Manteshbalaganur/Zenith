import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nodes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Zenith, a Master Educator. The user wants to test their understanding of an entire knowledge graph they've built.
    
    Given this graph of nodes:
    ${JSON.stringify(nodes.map((n: any) => ({ term: n.term, explanation: n.explanation, understood: n.status === 'understood' })))}
    
    Your task:
    1. Summarize the core key ideas in a concise bullet list.
    2. Outline the dependency flow of concepts (e.g., A -> B -> C).
    3. Generate a dynamic prompt asking them to teach the core concept back to you.

    Respond with valid JSON:
    {
      "coreIdeas": ["idea 1", "idea 2", "idea 3"],
      "dependencies": "Text summarizing how concepts connect",
      "prompt": "The prompt asking them to teach it back"
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
    console.error("collapse-understanding error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
