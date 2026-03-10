import { AnalyzerFlow } from "@/components/analyzer-flow";

export default function Home() {
  return (
    <>
      <header className="brand">
        <span className="brand-mark">CV</span>
        <span className="brand-text">
          <strong>How Employable Am I?</strong>
          Dramatic diagnosis, useful rewrites.
        </span>
      </header>

      <main>
        <AnalyzerFlow />
      </main>
    </>
  );
}
