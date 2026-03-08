# How Employable Am I?

A bold, light-themed Next.js app that scores a CV in two modes:

- `How Employable Am I?` for general interview-readiness
- `How Employable Am I for This Job?` for CV-vs-job-description matching

The app accepts PDF CV uploads, extracts text server-side, sends structured prompts through OpenRouter, and returns a dramatic but useful diagnosis plus actionable rewrites.

## Stack

- Next.js App Router
- TypeScript
- OpenRouter for LLM access
- Vercel-ready deployment
- `pdf-parse` for server-side PDF extraction
- `html-to-image` for downloadable PNG share cards
- Vitest for core schema, route, and parsing tests

## Local setup

1. Install dependencies:
   `npm install`
2. Copy the env example and fill in your OpenRouter credentials:
   `cp .env.example .env.local`
3. Start the dev server:
   `npm run dev`

## Environment variables

- `OPENROUTER_API_KEY`: your OpenRouter API key
- `OPENROUTER_MODEL`: OpenRouter model slug, default example uses `deepseek/deepseek-v3.2`
- `NEXT_PUBLIC_APP_URL`: local or deployed app URL for request metadata

## Routes

- `/` landing page with both modes
- `/general` general CV diagnosis
- `/job-fit` job-fit diagnosis
- `POST /api/parse-cv` PDF text extraction
- `POST /api/analyze/general` general employability analysis
- `POST /api/analyze/job-fit` job-fit analysis

## Testing

Run the core test suite with:

```bash
npm test
```

The tests cover:

- schema validation and score ranges
- PDF extraction for valid, blank, and invalid files
- analysis helper behavior
- API route validation and upstream failure handling

## Deployment

This repo is ready for Vercel. Add the environment variables in the Vercel project settings, then deploy.
