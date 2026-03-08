import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark">CV</span>
        <span>
          <strong>How Employable Am I?</strong>
          <small>Dramatic diagnosis, useful rewrites.</small>
        </span>
      </Link>

      <nav className="site-nav" aria-label="Primary">
        <Link href="/general">General</Link>
        <Link href="/job-fit">Job Fit</Link>
      </nav>
    </header>
  );
}
