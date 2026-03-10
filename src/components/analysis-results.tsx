import {
  ArrowUpRight,
  Download,
  Sparkles,
  Target,
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
};

function isJobFitResult(
  result: GeneralAnalysisResult | JobFitAnalysisResult,
): result is JobFitAnalysisResult {
  return "alignment" in result;
}

function getScoreCaption(mode: AnalyzerMode, score: number) {
  if (mode === "general") {
    if (score >= 80) return "Strong candidate";
    if (score >= 60) return "Competitive but improvable";
    if (score >= 40) return "Struggling CV";
    return "Major issues";
  }

  if (score >= 80) return "Strong match";
  if (score >= 60) return "Plausible candidate";
  if (score >= 40) return "Weak alignment";
  return "Unlikely to pass screening";
}

/* ─── Share card (always visible for screenshots) ─── */

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
      <div className="share-card__score">
        <strong>{score}%</strong>
        <span>{label}</span>
      </div>
      <div className="share-card__stack">
        <div>
          <span className="share-card__item-label">Verdict</span>
          <p className="share-card__item-value">{shareCard.summary}</p>
        </div>
        <div>
          <span className="share-card__item-label">Strongest Signal</span>
          <p className="share-card__item-value">{shareCard.strongestSignal}</p>
        </div>
        <div>
          <span className="share-card__item-label">Top Fix</span>
          <p className="share-card__item-value">{shareCard.topFix}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── General mode results ─── */

function GeneralResults({ result }: { result: GeneralAnalysisResult }) {
  return (
    <>
      {/* Diagnosis: strengths, risks, tips — merged into one card */}
      <div className="card">
        <div className="section-heading">
          <Target size={18} />
          <h3>Diagnosis</h3>
        </div>

        <div className="diagnosis-list">
          <div className="diagnosis-item">
            <span className="diagnosis-item__label">Strongest signal</span>
            <p className="diagnosis-item__value">{result.strongestSignal}</p>
          </div>
          <div className="diagnosis-item">
            <span className="diagnosis-item__label">Biggest hiring risk</span>
            <p className="diagnosis-item__value">{result.biggestRisk}</p>
          </div>
          <div className="diagnosis-item">
            <span className="diagnosis-item__label">Most fixable weakness</span>
            <p className="diagnosis-item__value">{result.mostFixableWeakness}</p>
          </div>
        </div>

        <hr className="results-divider" style={{ margin: "20px 0" }} />

        <div className="section-heading">
          <Sparkles size={18} />
          <h3>Quick wins</h3>
        </div>
        <ul className="tip-list">
          {result.survivalTips.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Rewrite */}
      <div className="card">
        <div className="section-heading">
          <ArrowUpRight size={18} />
          <h3>Rewrite suggestions</h3>
        </div>

        <div className="rewrite-grid">
          <div className="rewrite-card rewrite-card--wide">
            <span className="rewrite-card__label">Professional summary</span>
            <p>{result.rewrite.professionalSummary}</p>
          </div>
          <div className="rewrite-card">
            <span className="rewrite-card__label">Experience bullets</span>
            <ul>
              {result.rewrite.experienceBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rewrite-card">
            <span className="rewrite-card__label">Skills</span>
            <ul className="chip-list chip-list--partial">
              {result.rewrite.skillsSection.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Job-fit mode results ─── */

function JobFitResults({ result }: { result: JobFitAnalysisResult }) {
  return (
    <>
      {/* Alignment */}
      <div className="card">
        <div className="section-heading">
          <Target size={18} />
          <h3>Skill alignment</h3>
        </div>

        <div className="alignment-grid">
          {result.alignment.strong.length > 0 && (
            <div className="alignment-group">
              <span className="alignment-group__label">Strong match</span>
              <ul className="chip-list chip-list--strong">
                {result.alignment.strong.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {result.alignment.partial.length > 0 && (
            <div className="alignment-group">
              <span className="alignment-group__label">Partial match</span>
              <ul className="chip-list chip-list--partial">
                {result.alignment.partial.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {result.alignment.missing.length > 0 && (
            <div className="alignment-group">
              <span className="alignment-group__label">Missing emphasis</span>
              <ul className="chip-list chip-list--missing">
                {result.alignment.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {result.alignment.missingKeywords.length > 0 && (
            <div className="alignment-group">
              <span className="alignment-group__label">Missing keywords</span>
              <ul className="chip-list chip-list--critical">
                {result.alignment.missingKeywords.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Rewrite */}
      <div className="card">
        <div className="section-heading">
          <ArrowUpRight size={18} />
          <h3>Targeted rewrite</h3>
        </div>

        <div className="rewrite-grid">
          <div className="rewrite-card rewrite-card--wide">
            <span className="rewrite-card__label">Professional summary</span>
            <p>{result.rewrite.professionalSummary}</p>
          </div>
          <div className="rewrite-card">
            <span className="rewrite-card__label">Experience bullets</span>
            <ul>
              {result.rewrite.experienceBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rewrite-card">
            <span className="rewrite-card__label">Keyword additions</span>
            <ul>
              {result.rewrite.keywordAdditions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          {result.rewrite.sectionReorder.length > 0 && (
            <div className="rewrite-card rewrite-card--wide">
              <span className="rewrite-card__label">Section reorder</span>
              <ul>
                {result.rewrite.sectionReorder.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main results wrapper ─── */

export function AnalysisResults({
  mode,
  result,
  shareCardRef,
  onExport,
  isExporting,
  cvFileName,
}: AnalysisResultsProps) {
  const label = mode === "general" ? "Employability Score" : "Job Match Score";
  const caption = getScoreCaption(mode, result.score);

  return (
    <section className="results-shell" id="analysis-results">
      {/* Hero: score + verdict + first impression / gap analysis */}
      <div className="card">
        <div className="result-hero">
          <ScoreGauge score={result.score} label={label} caption={caption} />
          <h2>{result.verdict}</h2>
          <p className="lede">
            {isJobFitResult(result)
              ? result.gapAnalysis
              : result.recruiterFirstImpression}
          </p>
        </div>
      </div>

      {/* Mode-specific results */}
      {isJobFitResult(result) ? (
        <JobFitResults result={result} />
      ) : (
        <GeneralResults result={result} />
      )}

      {/* Share card + export */}
      <div className="card">
        <ShareCardPreview
          score={result.score}
          label={label}
          shareCard={result.shareCard}
          shareCardRef={shareCardRef}
        />
        <button className="secondary-button" onClick={onExport} type="button">
          <Download size={18} />
          {isExporting ? "Exporting..." : "Download as PNG"}
        </button>
      </div>
    </section>
  );
}
