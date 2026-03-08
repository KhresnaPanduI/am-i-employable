import { ArrowRight, BriefcaseBusiness, ScanSearch, Share2, Sparkles } from "lucide-react";
import Link from "next/link";

const exampleCards = [
  {
    title: "General CV diagnosis",
    quote: "Technically capable, but the CV undersells the real value.",
    detail: "Best for creators who want a clean, dramatic before-and-after demo.",
  },
  {
    title: "Job-specific diagnosis",
    quote: "Relevant background, but the CV could be tailored more directly to the role.",
    detail: "Best for content where you pit a CV against a specific posting.",
  },
];

export default function Home() {
  return (
    <main className="page-frame">
      <section className="landing-hero panel">
        <div className="landing-hero__copy">
          <span className="eyebrow">Fun project for career content</span>
          <h1>How Employable Am I?</h1>
          <p>
            A light-themed, dramatic CV analyzer that gives people a score, a verdict,
            and practical rewrites without sounding like a beige HR dashboard.
          </p>
          <div className="hero-links hero-links--strong">
            <Link href="/general">
              Try general mode
              <ArrowRight size={18} />
            </Link>
            <Link href="/job-fit">Try job-fit mode</Link>
          </div>
        </div>

        <div className="landing-hero__card-stack">
          <article className="spotlight-card">
            <span className="mini-label">General verdict sample</span>
            <h2>Busy resume, weak signal.</h2>
            <p>
              Great raw material, but the proof of impact is buried under responsibilities and filler.
            </p>
          </article>
          <article className="spotlight-card spotlight-card--warm">
            <span className="mini-label">Job-fit verdict sample</span>
            <h2>Close enough to interest them. Not close enough to relax.</h2>
            <p>
              The skills line up, but the CV still needs sharper proof for this specific role.
            </p>
          </article>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel feature-card">
          <ScanSearch size={20} />
          <h2>Diagnosis first</h2>
          <p>Lead with the score, verdict, and recruiter first impression before offering fixes.</p>
        </article>
        <article className="panel feature-card">
          <BriefcaseBusiness size={20} />
          <h2>Two clear modes</h2>
          <p>One mode for general interview-readiness, one mode for role-by-role targeting.</p>
        </article>
        <article className="panel feature-card">
          <Share2 size={20} />
          <h2>Built for screenshots</h2>
          <p>The share card is designed to look strong on social before anyone reads the full breakdown.</p>
        </article>
      </section>

      <section className="dual-mode-grid">
        <article className="panel mode-card">
          <span className="mini-label">Mode 01</span>
          <h2>How Employable Am I?</h2>
          <p>
            Ask the broad question: if a recruiter saw this CV today, would it create interviews or polite silence?
          </p>
          <Link href="/general">Open general diagnosis</Link>
        </article>
        <article className="panel mode-card mode-card--accent">
          <span className="mini-label">Mode 02</span>
          <h2>How Employable Am I for This Job?</h2>
          <p>
            Compare the CV against one real job description and find the mismatch before the recruiter does.
          </p>
          <Link href="/job-fit">Open job-fit diagnosis</Link>
        </article>
      </section>

      <section className="example-grid">
        {exampleCards.map((card) => (
          <article className="panel example-card" key={card.title}>
            <span className="mini-label">{card.title}</span>
            <p className="example-card__quote">{card.quote}</p>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel landing-footer-card">
        <div>
          <span className="mini-label">Stack</span>
          <h2>Next.js + TypeScript + OpenRouter + Vercel</h2>
          <p>
            Light-only UI, PDF-first upload flow, session-only results, and client-side PNG export.
          </p>
        </div>
        <div className="hero-links">
          <Link href="/general">
            Start diagnosing
            <Sparkles size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
