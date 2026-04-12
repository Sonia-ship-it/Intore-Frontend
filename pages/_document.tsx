import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon — Intore diamond mark */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />

        {/* Primary meta */}
        <meta name="application-name" content="Intore" />
        <meta name="description" content="AI-powered talent screening platform. Screen faster. Decide confidently. Stay in control." />
        <meta name="theme-color" content="#0F1547" />

        {/* Open Graph */}
        <meta property="og:title" content="Intore — AI Talent Screening" />
        <meta property="og:description" content="Screen faster. Decide confidently. Stay in control." />
        <meta property="og:type" content="website" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
