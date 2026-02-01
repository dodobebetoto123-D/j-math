import { NextRequest, NextResponse } from "next/server";

// AI 응답에서 JSON만 추출하는 함수
function extractJson(text: string): any | null {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            return JSON.parse(jsonMatch[1]);
        } catch (error) {
            console.error("Failed to parse extracted JSON:", error);
            return null;
        }
    }
    try {
        return JSON.parse(text);
    } catch (error) {
        return null; // Don't log error here, as it might just be regular text
    }
}

export async function POST(req: NextRequest) {
  try {
    const { problem } = await req.json();
    if (!problem || typeof problem !== "string") {
      return NextResponse.json({ error: "유효하지 않은 원본 문제입니다." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "서버에 API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const similarProblemPrompt = `
        You are a math problem generator. Based on the original problem below, create 3 new, similar problems that test the same core concepts.

        Your response MUST be ONLY a single JSON object. Do not include any text outside the JSON.
        The JSON object must have a single key "similar_problems", which is an array of strings. Each string is a new math problem.
        The new problems should be in Korean. Use LaTeX for math formulas.

        Example for "x^2 - 5x + 6 = 0":
        {
            "similar_problems": [
                "이차방정식 $x^2 + 2x - 8 = 0$의 두 근을 구하시오.",
                "방정식 $2x^2 - 7x + 3 = 0$의 해를 찾으시오.",
                "$x(x-4) = 5$ 를 만족하는 모든 $x$의 값을 구하시오."
            ]
        }
        
        Original Problem:
        "${problem}"

        Now, generate 3 similar problems in the specified JSON format ONLY.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "J-Math (Similar Problems)",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-pro",
        messages: [{ role: "user", content: similarProblemPrompt }],
        response_format: { "type": "json_object" },
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenRouter API Error (Similar):", errorData);
        return NextResponse.json({ error: `API 호출 실패: ${errorData.error?.message || response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content;

    if (!rawContent) {
        return NextResponse.json({ error: "AI로부터 유효한 답변을 받지 못했습니다." }, { status: 500 });
    }

    const parsedJson = extractJson(rawContent);

    if (!parsedJson || !parsedJson.similar_problems) {
        console.error("Failed to parse JSON from AI response for similar problems:", rawContent);
        return NextResponse.json({ error: "AI 답변의 형식이 올바르지 않습니다." }, { status: 500 });
    }

    return NextResponse.json({ similar_problems: parsedJson.similar_problems });

  } catch (error: any) {
    console.error("Internal Server Error (Similar):", error);
    return NextResponse.json({ error: `서버 내부 오류: ${error.message}` }, { status: 500 });
  }
}
