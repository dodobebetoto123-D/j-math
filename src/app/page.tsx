import ProblemSolver from "@/components/ProblemSolver";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            J-Math
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            AI 튜터와 함께하는 개인화된 수학 학습 플랫폼
          </p>
        </div>
      </header>

      <main className="flex-grow flex items-start justify-center py-12 px-4">
        <ProblemSolver />
      </main>

      <footer className="py-6 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} J-Math. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
