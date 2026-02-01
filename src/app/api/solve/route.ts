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
    console.error("Failed to parse text as JSON:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { problem } = await req.json();
    if (!problem || typeof problem !== "string") {
      return NextResponse.json({ error: "잘못된 문제 형식입니다." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "서버에 API 키가 설정되지 않았습니다." }, { status: 500 });
    }
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const solutionPrompt = `
      You are a structured math problem solver API. Your response must be ONLY a single JSON object. Do not include any text outside of the JSON.
      Your task is to solve the following math problem step-by-step and return it in a specific JSON format.

      The JSON object must have a single key "solution", which is an array of step objects.
      Each step object in the "solution" array must have three keys:
      1. "step_number": An integer representing the step number.
      2. "description": A string explaining the action taken in this step, in Korean. Use LaTeX for math formulas ($inline$ or $$block$$).
      3. "core_concept": A short, simple string (in Korean) naming the key mathematical concept or formula used in this step. This will be used for a "Why?" button.

      Example for "x^2 - 5x + 6 = 0":
      {
        "solution": [
          {
            "step_number": 1,
            "description": "주어진 이차방정식은 $ax^2 + bx + c = 0$ 꼴입니다. 계수는 $a=1, b=-5, c=6$ 입니다.",
            "core_concept": "이차방정식의 표준형"
          },
          {
            "step_number": 2,
            "description": "곱해서 6이 되고 더해서 -5가 되는 두 수, -2와 -3을 찾아 인수분해합니다. $(x - 2)(x - 3) = 0$",
            "core_concept": "인수분해"
          },
          {
            "step_number": 3,
            "description": "각 인수가 0이 되는 $x$값을 찾습니다. $x-2=0$ 또는 $x-3=0$ 이므로, 해는 $x=2, x=3$ 입니다.",
            "core_concept": "영인자 원리 (Zero-Product Property)"
          }
        ]
      }

      Now, solve the following problem and provide the response in the specified JSON format ONLY.

      Problem:
      ${problem}
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "J-Math",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-pro",
        messages: [{ role: "user", content: solutionPrompt }],
        // AI가 JSON 형식으로만 응답하도록 강제하는 옵션 (사용 가능한 모델에 따라 다름)
        response_format: { "type": "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API Error:", errorData);
      return NextResponse.json({ error: `API 호출 실패: ${errorData.error?.message || response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json({ error: "AI로부터 유효한 답변을 받지 못했습니다." }, { status: 500 });
    }

    const parsedJson = extractJson(rawContent);

    if (!parsedJson || !parsedJson.solution) {
      console.error("Failed to parse JSON from AI response:", rawContent);
      return NextResponse.json({ error: "AI 답변의 형식이 올바르지 않습니다." }, { status: 500 });
    }
    
    return NextResponse.json({ solution: parsedJson.solution });

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: `서버 내부 오류: ${error.message}` }, { status: 500 });
  }
}
