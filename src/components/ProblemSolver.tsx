"use client";

import { useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import ExplanationModal from "./ExplanationModal";
import dynamic from "next/dynamic";

// Diagram 컴포넌트 자체를 dynamic import로 변경합니다.
// 이 컴포넌트는 이제 클라이언트에서만 렌더링됩니다.
const Diagram = dynamic(() => import("./Diagram"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center p-4 bg-white rounded-lg">다이어그램 로딩 중...</div>,
});


interface Step {
  step_number: number;
  description: string;
  core_concept: string;
}

const renderLatex = (text: string) => {
  if (!text) return null;
  const cleanedText = text.replace(/\\/g, "\\\\");
  const parts = cleanedText.split(/(\\$\$[[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  return parts.map((part, index) => {
    try {
      if (part.startsWith("$$") && part.endsWith("$$")) return <BlockMath key={index}>{part.slice(2, -2)}</BlockMath>;
      if (part.startsWith("$") && part.endsWith("$")) return <InlineMath key={index}>{part.slice(1, -1)}</InlineMath>;
    } catch (e) { return <span key={index}>{part}</span>; }
    return <span key={index}>{part.replace(/\\\\n/g, "<br />")}</span>;
  });
};

export default function ProblemSolver() {
  const [problem, setProblem] = useState("");
  const [originalProblem, setOriginalProblem] = useState("");
  const [solution, setSolution] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [selectedConcept, setSelectedConcept] = useState("");
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [similarProblems, setSimilarProblems] = useState<string[]>([]);
  const [isSimilarLoading, setIsSimilarLoading] = useState(false);
  const [diagramSyntax, setDiagramSyntax] = useState("");
  const [isDiagramLoading, setIsDiagramLoading] = useState(false);

  const clearAllOutputs = () => {
    setSolution([]);
    setError("");
    setSimilarProblems([]);
    setDiagramSyntax("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() || isLoading) return;
    setIsLoading(true);
    clearAllOutputs();
    setOriginalProblem(problem);
    try {
      const response = await fetch('/api/solve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problem }) });
      if (!response.ok) throw new Error((await response.json()).error || "API 요청 실패");
      const data = await response.json();
      setSolution(data.solution);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };
  
  const handleExplainClick = async (concept: string) => {
    setSelectedConcept(concept);
    setIsModalOpen(true);
    setIsExplanationLoading(true);
    setExplanation("");
    try {
      const response = await fetch('/api/explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ concept }) });
      if (!response.ok) throw new Error((await response.json()).error || "설명 API 요청 실패");
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err: any) { setExplanation(`'${concept}'에 대한 설명을 불러오는 데 실패했습니다: ${err.message}`); } finally { setIsExplanationLoading(false); }
  };

  const handleGenerateSimilar = async () => {
    setIsSimilarLoading(true);
    setError("");
    setDiagramSyntax("");
    try {
      const response = await fetch('/api/generate-similar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problem: originalProblem }) });
      if (!response.ok) throw new Error((await response.json()).error || "유사 문제 생성 API 요청 실패");
      const data = await response.json();
      setSimilarProblems(data.similar_problems);
    } catch (err: any) { setError(err.message); } finally { setIsSimilarLoading(false); }
  };

  const handleVisualizeConcepts = async () => {
    setIsDiagramLoading(true);
    setError("");
    setSimilarProblems([]);
    const concepts = solution.map(step => step.core_concept);
    try {
      const response = await fetch('/api/visualize-concepts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ concepts }) });
      if (!response.ok) throw new Error((await response.json()).error || "개념 시각화 API 요청 실패");
      const data = await response.json();
      setDiagramSyntax(data.diagramSyntax);
    } catch (err: any) { setError(err.message); } finally { setIsDiagramLoading(false); }
  };

  const handleSimilarProblemClick = (newProblem: string) => {
    setProblem(newProblem);
    clearAllOutputs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="w-full max-w-3xl mx-auto pb-24">
        <form onSubmit={handleSubmit}>
          <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="예: x^2 - 5x + 6 = 0의 해를 구하시오." className="w-full h-32 p-4 bg-gray-800 border-2 border-gray-600 rounded-lg text-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" disabled={isLoading} />
          <button type="submit" className="w-full mt-4 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-lg font-bold text-white transition-colors" disabled={isLoading || isExplanationLoading || isSimilarLoading || isDiagramLoading}>
            {isLoading ? "AI가 풀이 중..." : "풀어보기"}
          </button>
        </form>

        {error && <div className="mt-8 p-6 bg-red-900/50 rounded-lg border border-red-700 text-red-200"><h2 className="text-xl font-bold mb-2">오류 발생</h2><p>{error}</p></div>}

        {solution.length > 0 && (
          <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-white">풀이 결과</h2>
            <div className="space-y-6">{solution.map((step) => (
              <div key={step.step_number} className="flex items-start gap-4 p-4 rounded-md bg-gray-900/50">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-lg">{step.step_number}</span>
                <div className="flex-grow">
                  <div className="text-lg text-gray-200 leading-relaxed">{renderLatex(step.description)}</div>
                  <div className="mt-3 text-right"><button onClick={() => handleExplainClick(step.core_concept)} className="px-3 py-1 text-sm font-semibold text-cyan-300 bg-cyan-900/50 hover:bg-cyan-800/50 rounded-full transition-colors disabled:opacity-50" title={`'${step.core_concept}'에 대해 더 알아보기`} disabled={isLoading || isExplanationLoading}>궁금해요 ({step.core_concept})</button></div>
                </div>
              </div>
            ))}</div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-700 pt-6 text-center">
              <button onClick={handleGenerateSimilar} className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 rounded-lg font-bold text-white transition-colors" disabled={isLoading || isSimilarLoading}>
                {isSimilarLoading ? "생성 중..." : "유사 문제로 연습하기"}
              </button>
              <button onClick={handleVisualizeConcepts} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 rounded-lg font-bold text-white transition-colors" disabled={isLoading || isDiagramLoading}>
                {isDiagramLoading ? "분석 중..." : "개념 관계 보기"}
              </button>
            </div>
          </div>
        )}

        {similarProblems.length > 0 && (
          <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700"><h2 className="text-2xl font-bold mb-6 text-white">유사 문제</h2><div className="space-y-4">{similarProblems.map((p, i) => (<div key={i} onClick={() => handleSimilarProblemClick(p)} className="p-4 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"><div className="text-lg text-gray-200">{renderLatex(p)}</div></div>))}</div></div>
        )}

        {isDiagramLoading && (
            <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-white">개념 관계도</h2>
                <div className="p-4 bg-white rounded-lg flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                </div>
            </div>
        )}

        {diagramSyntax && !isDiagramLoading && (
          <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-white">개념 관계도</h2>
            <div className="p-4 bg-white rounded-lg">
              <Diagram chart={diagramSyntax} />
            </div>
          </div>
        )}
      </div>

      <ExplanationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} content={explanation} concept={selectedConcept} isLoading={isExplanationLoading} />
    </>
  );
}
