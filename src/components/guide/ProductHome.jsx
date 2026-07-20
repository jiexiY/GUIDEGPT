import {
  ArrowRight,
  CheckCircle,
  DownloadSimple,
  Eye,
  GithubLogo,
  LockSimple,
  Microphone,
  PuzzlePiece,
  ShieldCheck,
  Sparkle,
  Target,
  Translate,
} from "@phosphor-icons/react";

export function GuideBrand({ compact = false }) {
  return (
    <span className={compact ? "product-brand is-compact" : "product-brand"}>
      <span className="product-brand__mark" aria-hidden="true">
        <Sparkle size={compact ? 14 : 17} weight="fill" />
      </span>
      <span>GUIDEGPT</span>
    </span>
  );
}

function ProductHeader({ health }) {
  const connected = health?.status === "ready";

  return (
    <header className="product-header">
      <a className="product-header__brand" href="#top" aria-label="GuideGPT home">
        <GuideBrand />
      </a>
      <nav aria-label="Primary navigation">
        <a href="#product">Product</a>
        <a href="#how-it-works">How it works</a>
        <a href="#privacy">Privacy</a>
        <a
          href="https://github.com/jiexiY/GUIDEGPT"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <GithubLogo size={15} weight="bold" />
        </a>
      </nav>
      <div className="product-header__actions">
        <span className={connected ? "live-status is-ready" : "live-status"}>
          <span aria-hidden="true" />
          {connected ? "Guide service live" : "Connecting"}
        </span>
        <a
          className="install-button"
          href="/guidegpt-extension.zip"
          download
          aria-label="Install extension"
          data-guide-target="install"
        >
          <PuzzlePiece size={19} weight="fill" />
          Install extension
        </a>
      </div>
    </header>
  );
}

function HowItWorks() {
  const items = [
    {
      icon: Microphone,
      number: "01",
      title: "Speak or type in your language",
      copy: "Talk naturally or type in English, Mandarin, Korean, Japanese, Spanish, Russian, or Portuguese.",
    },
    {
      icon: Eye,
      number: "02",
      title: "GuideGPT reads the visible page",
      copy: "Only the text and controls on the page you are viewing become context for your guide.",
    },
    {
      icon: Target,
      number: "03",
      title: "You get one clear next step",
      copy: "Each instruction points to a real control, explains what to do, and tells you how to verify it.",
    },
    {
      icon: CheckCircle,
      number: "04",
      title: "You stay in control",
      copy: "GuideGPT never clicks, submits, publishes, or purchases anything on your behalf.",
    },
  ];

  return (
    <section id="how-it-works" className="story-section" aria-labelledby="how-title">
      <div className="section-intro">
        <span className="section-kicker">How it works</span>
        <h2 id="how-title">The shortest path from intent to done.</h2>
        <p>Ask in plain language. GuideGPT turns the page in front of you into a safe, verifiable walkthrough.</p>
      </div>
      <ol className="story-steps">
        {items.map(({ icon: Icon, number, title, copy }) => (
          <li key={number}>
            <span className="story-steps__number">{number}</span>
            <span className="story-steps__icon" aria-hidden="true"><Icon size={22} /></span>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PrivacySection() {
  return (
    <section id="privacy" className="privacy-section" aria-labelledby="privacy-title">
      <div>
        <span className="section-kicker">Privacy by design</span>
        <h2 id="privacy-title">The page stays yours.</h2>
      </div>
      <div className="privacy-section__copy">
        <p>Visible page text is used to create the current guide and is not stored. The microphone starts only after you choose it; your browser or GuideGPT’s transcription provider may process that short recording, but GuideGPT does not store the audio.</p>
        <div className="privacy-facts">
          <span><Eye size={17} />Visible page only</span>
          <span><Microphone size={17} />Review every voice transcript before sending</span>
          <span><LockSimple size={17} />No passwords or hidden fields</span>
          <span><ShieldCheck size={17} />You confirm every action</span>
        </div>
      </div>
    </section>
  );
}

export function ProductHome({ health, onTryDemo }) {
  return (
    <div id="top" className="product-page">
      <ProductHeader health={health} />

      <main id="product-surface">
        <section id="product" className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-eyebrow"><Sparkle size={15} weight="fill" />Live guidance for the web</span>
            <h1 id="hero-title">Get unstuck<br />on any website.</h1>
            <p>Speak or type what you want to do. GuideGPT reads the visible screen and explains the next safe step in your language.</p>
            <div className="hero-actions">
              <a className="hero-primary" href="/guidegpt-extension.zip" download aria-label="Get the GuideGPT extension">
                <DownloadSimple size={19} weight="bold" />
                Get the extension
              </a>
              <button className="hero-secondary" type="button" onClick={onTryDemo} aria-label="Try live demo">
                Try the live guide <ArrowRight size={18} weight="bold" />
              </button>
            </div>
            <div className="hero-trust" aria-label="GuideGPT safety promises">
              <span><ShieldCheck size={17} />Private by design</span>
              <span><CheckCircle size={17} />You approve every step</span>
              <span><Translate size={17} />Voice guidance in 7 languages</span>
            </div>
          </div>

          <div className="hero-breathing-room" aria-hidden="true" />
        </section>

        <section className="proof-strip" aria-label="Product capabilities">
          <span className="proof-strip__label">Built for the websites you already use</span>
          <div>
            <span>Work tools</span>
            <span>Admin consoles</span>
            <span>Forms</span>
            <span>Settings</span>
            <span>Dashboards</span>
          </div>
        </section>

        <HowItWorks />
        <PrivacySection />
      </main>

      <footer className="product-footer">
        <GuideBrand compact />
        <span>Safe, confirmable guidance for the web.</span>
        <a href="https://github.com/jiexiY/GUIDEGPT" target="_blank" rel="noreferrer">View source</a>
      </footer>
    </div>
  );
}
