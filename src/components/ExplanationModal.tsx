"use client";

import { BlockMath, InlineMath } from "react-katex";

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  concept: string;
  isLoading: boolean;
}

// LaTeX 렌더링을 위한 파서 (ProblemSolver와 중복되지만, 독립적인 컴포넌트를 위해 포함)
const renderLatex = (text: string) => {
  if (!text) return null;
  const cleanedText = text.replace(/\\/g, "\\\\");
  const parts = cleanedText.split(/(\\$\$[[\s\S]*?\\$\$]|[\$][\s\S]*?[\$])/g);

  return parts.map((part, index) => {
    try {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        return <BlockMath key={index}>{part.slice(2, -2)}</BlockMath>;
      } else if (part.startsWith("$") && part.endsWith("$")) {
        return <InlineMath key={index}>{part.slice(1, -1)}</InlineMath>;
      }
    } catch (e) {
      console.error("Katex rendering error:", e);
      return <span key={index}>{part}</span>
    }
    return <span key={index}>{part.replace(/\\\\n/g, "<br />")}</span>;
  });
};


export default function ExplanationModal({ isOpen, onClose, content, concept, isLoading }: ExplanationModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않도록 함
      >
        <header className="flex justify-between items-center p-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-cyan-300">'{concept}'에 대한 설명</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
        </header>

        <main className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-300"></div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-lg leading-relaxed text-gray-300">
              {renderLatex(content)}
            </div>
          )}
        </main>

         <footer className="p-4 border-t border-gray-700 text-right">
            <button 
                onClick={onClose} 
                className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
                닫기
            </button>
        </footer>
      </div>
    </div>
  );
}
