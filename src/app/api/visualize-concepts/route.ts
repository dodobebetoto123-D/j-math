import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { concepts } = await req.json();
    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      return NextResponse.json({ error: "유효하지 않은 개념 목록입니다." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "서버에 API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const conceptsString = concepts.join(", ");

    const diagramPrompt = `
        You are a system that generates Mermaid.js graph definitions.
        Based on the list of mathematical concepts provided, create a simple Mermaid.js 'graph TD' (Top-Down) definition showing the relationships between them.

        - The graph should illustrate how the concepts build on or relate to each other.
        - The entire response MUST BE ONLY the Mermaid.js graph definition text. Do not include any explanations or markdown fences.
        - The language for node labels must be Korean.
        
        Example for concepts: "이차방정식의 표준형", "인수분해", "영인자 원리":
        graph TD;
            A["이차방정식의 표준형"] --> B["인수분해"];
            B --> C["영인자 원리"];
            C --> D{해 구하기};

        Concepts to visualize:
        "${conceptsString}"

        Now, generate the Mermaid.js graph definition ONLY.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "J-Math (Concept Map)",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-pro",
        messages: [{ role: "user", content: diagramPrompt }],
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenRouter API Error (Visualize):", errorData);
        return NextResponse.json({ error: `API 호출 실패: ${errorData.error?.message || response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    const diagramSyntax = data.choices[0]?.message?.content;

    if (!diagramSyntax) {
        return NextResponse.json({ error: "AI로부터 유효한 다이어그램을 받지 못했습니다." }, { status: 500 });
    }

    return NextResponse.json({ diagramSyntax });

  } catch (error: any) {
    console.error("Internal Server Error (Visualize):", error);
    return NextResponse.json({ error: `서버 내부 오류: ${error.message}` }, { status: 500 });
  }
}
