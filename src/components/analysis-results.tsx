import {
  ArrowUpRight,
  Download,
  FilePenLine,
  Radar,
  ScanSearch,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
import type { RefObject } from "react";

import { ScoreGauge } from "@/components/score-gauge";
import type {
  GeneralAnalysisResult,
  JobFitAnalysisResult,
  ShareCard,
} from "@/lib/schemas";

type AnalyzerMode = "general" | "job-fit";

type AnalysisResultsProps = {
  mode: AnalyzerMode;
  result: GeneralAnalysisResult | JobFitAnalysisResult;
  shareCardRef: RefObject<HTMLDivElement | null>;
  onExport: () => Promise<void>;
  isExporting: boolean;
  cvFileName: string;
  sourceLabel: string;
};

function isJobFitResult(
  result: GeneralAnalysisResult | JobFitAnalysisResult,
): result is JobFitAnalysisResult {
  return "alignment" in result;
}

function getScoreCaption(mode: AnalyzerMode, score: number) {
  if (mode === "general") {
    if (score >= 80) {
      return "Strong candidate";
    }
    if (score >= 60) {
      return "Competitive but improvable";
    }
    if (score >= 40) {
      return "Struggling CV";
    }
    return "Major issues";
  }

  if (score >= 80) {
    return "Strong match";
  }
  if (score >= 60) {
    return "Plausible candidate";
  }
  if (score >= 40) {
    return "Weak alignment";
  }
  return "Unlikely to pass screening";
}

function ShareCardPreview({
  score,
  label,
  shareCard,
  shareCardRef,
}: {
  score: number;
  label: string;
  shareCard: ShareCard;
  shareCardRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="share-card" ref={shareCardRef}>
      <span className="share-card__eyebrow">Shareable Result Card</span>
      <div className="share-card__score">
        <strong>{score}%</strong>
        <span>{label}</span>
      </div>
      <div className="share-card__stack">
        <div>
          <span>Verdict</span>
          <p>{shareCard.summary}</p>
        </div>
        <div>
          <span>Strongest Signal</span>
          <p>{shareCard.strongestSignal}</p>
        </div>
        <div>
          <span>Top Fix</span>
          <p>{shareCard.topFix}</p>
        </div>
      </div>
    </div>
  );
}

export function AnalysisResults({
  mode,
  result,
  shareCardRef,
  onExport,
  isExporting,
  cvFileName,
  sourceLabel,
}: AnalysisResultsProps) {
  const label = mode === "general" ? "Employability Score" : "Job Match Score";
  const caption = getScoreCaption(mode, result.score);

  return (
    <section className="results-shell" id="analysis-results">
      <div className="results-hero">
        <div className="panel hero-panel hero-panel--result">
          <div className="hero-panel__topline">
            <span className="pill">{cvFileName}</span>
            <span className="pill pill--muted">{sourceLabel}</span>
          </div>
          <div className="results-hero__grid">
            <div>
              <ScoreGauge score={result.score} label={label} caption={caption} />
              <h2>{result.verdict}</h2>
              <p className="lede">
                {isJobFitResult(result)
                  ? result.gapAnalysis
                  : result.recruiterFirstImpression}
              </p>
            </div>

            <aside className="result-actions">
              <ShareCardPreview
                score={result.score}
                label={label}
                shareCard={result.shareCard}
                shareCardRef={shareCardRef}
              />
              <button className="secondary-button" onClick={onExport} type="button">
                <Download size={18} />
                {isExporting ? "Exporting..." : "Download PNG"}
              </button>
            </aside>
          </div>
        </div>
      </div>

      {isJobFitResult(result) ? (
        <div className="results-grid">
          <section className="panel section-card">
            <div className="section-heading">
              <Radar size={18} />
              <div>
                <h3>Skill and Keyword Alignment</h3>
                <p>What the CV proves, almost proves, and never quite says out loud.</p>
              </div>
            </div>
            <div className="alignment-grid">
              <div>
                <span className="mini-label">Strong alignment</span>
                <ul className="chip-list">
                  {result.alignment.strong.length > 0 ? (
                    result.alignment.strong.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>Nothing overwhelmingly convincing yet.</li>
                  )}
                </ul>
              </div>
              <div>
                <span className="mini-label">Partial alignment</span>
                <ul className="chip-list chip-list--neutral">
                  {result.alignment.partial.length > 0 ? (
                    result.alignment.partial.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>No partial matches surfaced.</li>
                  )}
                </ul>
              </div>
              <div>
                <span className="mini-label">Missing emphasis</span>
                <ul className="chip-list chip-list--warn">
                  {result.alignment.missing.length > 0 ? (
                    result.alignment.missing.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>No major missing skills called out.</li>
                  )}
                </ul>
              </div>
              <div>
                <span className="mini-label">Missing keywords</span>
                <ul className="chip-list chip-list--critical">
                  {result.alignment.missingKeywords.length > 0 ? (
                    result.alignment.missingKeywords.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>No key phrases are missing.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          <section className="panel section-card">
            <div className="section-heading">
              <TriangleAlert size={18} />
              <div>
                <h3>Gap Analysis</h3>
                <p>The thing most likely to make a recruiter pause.</p>
              </div>
            </div>
            <p className="body-copy">{result.gapAnalysis}</p>
          </section>

          <section className="panel section-card section-card--wide">
            <div className="section-heading">
              <FilePenLine size={18} />
              <div>
                <h3>Targeted CV Rewrite</h3>
                <p>What to update before this application goes anywhere near a recruiter.</p>
              </div>
            </div>
            <div className="rewrite-grid">
              <div className="rewrite-card">
                <span className="mini-label">Professional summary</span>
                <p>{result.rewrite.professionalSummary}</p>
              </div>
              <div className="rewrite-card">
                <span className="mini-label">Rewritten experience bullets</span>
                <ul className="bullet-list">
                  {result.rewrite.experienceBullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rewrite-card">
                <span className="mini-label">Keyword additions</span>
                <ul className="bullet-list bullet-list--compact">
                  {result.rewrite.keywordAdditions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rewrite-card">
                <span className="mini-label">Section reorder</span>
                <ul className="bullet-list bullet-list--compact">
                  {result.rewrite.sectionReorder.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="results-grid">
          <section className="panel section-card">
            <div className="section-heading">
              <ScanSearch size={18} />
              <div>
                <h3>Recruiter First Impression</h3>
                <p>What lands in the first ten seconds, for better or worse.</p>
              </div>
            </div>
            <p className="body-copy">{result.recruiterFirstImpression}</p>
          </section>

          <section className="panel section-card">
            <div className="section-heading">
              <Target size={18} />
              <div>
                <h3>Strengths vs Risks</h3>
                <p>Why the score landed where it did.</p>
              </div>
            </div>
            <div className="stack-list">
              <div>
                <span className="mini-label">Strongest signal</span>
                <p>{result.strongestSignal}</p>
              </div>
              <div>
                <span className="mini-label">Biggest hiring risk</span>
                <p>{result.biggestRisk}</p>
              </div>
              <div>
                <span className="mini-label">Most fixable weakness</span>
                <p>{result.mostFixableWeakness}</p>
              </div>
            </div>
          </section>

          <section className="panel section-card">
            <div className="section-heading">
              <Sparkles size={18} />
              <div>
                <h3>Survival Tips</h3>
                <p>The quickest upgrades with the biggest payoff.</p>
              </div>
            </div>
            <ul className="bullet-list">
              {result.survivalTips.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="panel section-card section-card--wide">
            <div className="section-heading">
              <ArrowUpRight size={18} />
              <div>
                <h3>CV Rewrite Generator</h3>
                <p>Immediate copy you can steal and clean up before the next application.</p>
              </div>
            </div>
            <div className="rewrite-grid rewrite-grid--three">
              <div className="rewrite-card">
                <span className="mini-label">Professional summary</span>
                <p>{result.rewrite.professionalSummary}</p>
              </div>
              <div className="rewrite-card">
                <span className="mini-label">Rewritten experience bullets</span>
                <ul className="bullet-list">
                  {result.rewrite.experienceBullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rewrite-card">
                <span className="mini-label">Cleaner skills section</span>
                <ul className="chip-list chip-list--neutral">
                  {result.rewrite.skillsSection.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
