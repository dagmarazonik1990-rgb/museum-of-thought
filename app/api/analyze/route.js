import { NextResponse } from "next/server";

const FALLBACK_INSIGHT = {
  summary: "Analysis is temporarily unavailable. Continue mapping your thoughts and revisit later.",
  type: "unclassified",
  emotion: "uncertain",
  conflicts: [],
  patterns: [],
  suggestions: ["Continue expanding the map to surface clearer patterns."]
};

function sanitizeInsight(payload) {
  return {
    summary: typeof payload?.summary === "string" ? payload.summary : FALLBACK_INSIGHT.summary,
    type: typeof payload?.type === "string" ? payload.type : "unclassified",
    emotion: typeof payload?.emotion === "string" ? payload.emotion : "uncertain",
    conflicts: Array.isArray(payload?.conflicts) ? payload.conflicts : [],
    patterns: Array.isArray(payload?.patterns) ? payload.patterns : [],
    suggestions: Array.isArray(payload?.suggestions) ? payload.suggestions : []
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const text = body?.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Missing thought text." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        summary: "AI key missing. Local thought mapping is still available.",
        type: "unclassified",
        emotion: "uncertain",
        conflicts: [],
        patterns: [],
        suggestions: ["Add OPENAI_API_KEY in Vercel or .env.local to enable AI insight."]
      });
    }

    const prompt = `
You are a calm, high-quality cognitive analyst.

Analyze the user's thought and return ONLY valid JSON with this exact shape:
{
  "summary": "string",
  "type": "decision | fear | desire | conflict | memory | idea | identity | unclassified",
  "emotion": "string",
  "conflicts": ["string"],
  "patterns": ["string"],
  "suggestions": ["string"]
}

Be concise, non-clinical, and practical.
Do not add markdown.
Thought:
${text}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You analyze thoughts and return clean JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!response.ok || !content) {
      console.error("OpenAI response error", data);
      return NextResponse.json(
        { error: "OpenAI request failed." },
        { status: 502 }
      );
    }

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(sanitizeInsight(parsed));
    } catch (parseError) {
      console.error("Failed to parse model output", parseError, content);
      return NextResponse.json(sanitizeInsight(FALLBACK_INSIGHT));
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
