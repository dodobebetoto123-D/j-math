import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { concept } = await req.json();
    if (!concept || typeof concept !== "string") {
      return NextResponse.json({ error: "잘못된 개념 요청입니다." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "서버에 API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const explanationPrompt = `
      You are a helpful math tutor. Explain the following mathematical concept to a student in a simple and easy-to-understand way.
      - Your response must be in Korean.
      - Use Markdown for formatting if needed.
      - Use LaTeX for formulas if needed ($inline$ or $$block$$).
      
      Concept to explain:
      "${concept}"
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "J-Math (Explanation)",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-pro",
        messages: [{ role: "user", content: explanationPrompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API Error (Explain):", errorData);
      return NextResponse.json({ error: `API 호출 실패: ${errorData.error?.message || response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    const explanation = data.choices[0]?.message?.content;

    if (!explanation) {
      return NextResponse.json({ error: "AI로부터 유효한 설명을 받지 못했습니다." }, { status: 500 });
    }

    return NextResponse.json({ explanation });

  } catch (error: any) {
    console.error("Internal Server Error (Explain):", error);
    return NextResponse.json({ error: `서버 내부 오류: ${error.message}` }, { status: 500 });
  }
}
