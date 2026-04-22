import { NextResponse } from "next/server";

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
        summary: "AI key missing. Local mode is still working.",
        type: "unclassified",
        emotion: "uncertain",
        conflicts: [],
        patterns: [],
        suggestions: [
          "Add OPENAI_API_KEY in Vercel or .env.local to enable AI analysis."
        ]
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

Be insightful, concise, and non-clinical.
Do not moralize.
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
      console.error(data);
      return NextResponse.json(
        { error: "OpenAI request failed." },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    return NextResponse.json({
      summary: parsed.summary || "",
      type: parsed.type || "unclassified",
      emotion: parsed.emotion || "uncertain",
      conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
