import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  ExternalLink,
  Instagram,
  Mail,
  Menu,
  MessageCircle,
  Play,
  Send,
  X,
  Youtube
} from "lucide-react";
import content from "./content/content.json";
import "./styles.css";

const routes = [
  { label: "Home", path: "/" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Rates", path: "/services" },
  { label: "Collaborations", path: "/collaborations" },
  { label: "Contact", path: "/contact" }
];

function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname);

  React.useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextPath) => {
    if (nextPath === window.location.pathname) return;
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return { path, navigate };
}

function useScrollReveal() {
  React.useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealAll = () => {
      root.classList.add("reveal-ready");
      document.querySelectorAll("[data-reveal]").forEach((element) => {
        element.classList.add("is-visible", "reveal-complete");
      });
    };

    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealAll();
      return undefined;
    }

    root.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          window.setTimeout(() => entry.target.classList.add("reveal-complete"), 1100);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    const observeNewElements = () => {
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((element) => observer.observe(element));
    };

    observeNewElements();

    const mutationObserver = new MutationObserver(observeNewElements);
    const main = document.querySelector("main");
    if (main) mutationObserver.observe(main, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}

function useFlowerScrollMotion() {
  React.useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;

      if (reducedMotion.matches) {
        root.style.setProperty("--flower-scroll", "0");
        return;
      }

      const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      root.style.setProperty("--flower-scroll", progress.toFixed(4));
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    reducedMotion.addEventListener("change", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", requestUpdate);
      root.style.removeProperty("--flower-scroll");
    };
  }, []);
}

function ShineHeading({ as: Tag = "h2", children, className = "" }) {
  const handlePointerMove = React.useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--shine-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--shine-y", `${event.clientY - rect.top}px`);
  }, []);

  return (
    <Tag className={`shine-heading ${className}`.trim()} data-text={children} onPointerMove={handlePointerMove}>
      {children}
    </Tag>
  );
}

function App() {
  const { path, navigate } = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const playerController = useSingleActiveEmbedPlayer();
  const page = path === "/thank-you" ? "thank-you" : path.replace("/", "") || "home";
  useScrollReveal();
  useFlowerScrollMotion();

  return (
    <>
      <Header navigate={navigate} path={path} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        <FloralBackdrop />
        {page === "home" && <Home navigate={navigate} playerController={playerController} />}
        {page === "portfolio" && <Portfolio playerController={playerController} />}
        {page === "services" && <Services navigate={navigate} />}
        {page === "collaborations" && <Collaborations navigate={navigate} />}
        {page === "contact" && <Contact />}
        {page === "thank-you" && <ThankYou navigate={navigate} />}
        {!["home", "portfolio", "services", "collaborations", "contact", "thank-you"].includes(page) && (
          <NotFound navigate={navigate} />
        )}
      </main>
      <Footer navigate={navigate} />
    </>
  );
}

function FloralBackdrop() {
  return (
    <div className="floral-backdrop" aria-hidden="true">
      <div className="flower-layer flower-layer-back">
        <img src="/uploads/Flowers.png" alt="" />
      </div>
      <div className="flower-layer flower-layer-main">
        <img src="/uploads/Flowers.png" alt="" />
      </div>
      <div className="flower-layer flower-layer-near">
        <img src="/uploads/Flowers.png" alt="" />
      </div>
    </div>
  );
}

function useSingleActiveEmbedPlayer() {
  const playerRefs = React.useRef(new Map());

  const pausePlayer = React.useCallback((player) => {
    if (!player?.contentWindow) return;

    if (player.dataset.platform === "YouTube") {
      player.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
        "*"
      );
      return;
    }

    player.contentWindow.postMessage({ type: "pause", value: undefined, "x-tiktok-player": true }, "*");
  }, []);

  const pauseOtherPlayers = React.useCallback(
    (activeId) => {
      playerRefs.current.forEach((player, playerId) => {
        if (playerId !== activeId) pausePlayer(player);
      });
    },
    [pausePlayer]
  );

  const registerPlayer = React.useCallback((playerId, player) => {
    if (player) {
      playerRefs.current.set(playerId, player);
      return;
    }

    playerRefs.current.delete(playerId);
  }, []);

  React.useEffect(() => {
    const onMessage = (event) => {
      // TikTok players announce playback through postMessage, so we pause siblings when one starts.
      const message = readEmbedMessage(event.data);
      if (!message || message.type !== "onStateChange" || Number(message.value) !== 1) return;

      const activePlayer = Array.from(playerRefs.current.entries()).find(
        ([, player]) => player.contentWindow === event.source
      );
      if (!activePlayer) return;

      pauseOtherPlayers(activePlayer[0]);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pauseOtherPlayers]);

  const pauseAll = React.useCallback(() => {
    playerRefs.current.forEach((player) => pausePlayer(player));
  }, [pausePlayer]);

  return React.useMemo(() => ({ pauseAll, registerPlayer }), [pauseAll, registerPlayer]);
}

function readEmbedMessage(data) {
  if (!data) return null;

  if (typeof data === "string") {
    try {
      return readEmbedMessage(JSON.parse(data));
    } catch {
      return null;
    }
  }

  if (data["x-tiktok-player"]) {
    return {
      type: data.type,
      value: data.value
    };
  }

  return null;
}

function Header({ navigate, path, menuOpen, setMenuOpen }) {
  const headerRef = React.useRef(null);

  React.useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (headerRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen, setMenuOpen]);

  return (
    <header className="site-header" ref={headerRef}>
      <a
        href="/"
        className="brand-mark"
        onClick={(event) => {
          event.preventDefault();
          navigate("/");
          setMenuOpen(false);
        }}
      >
        <span>
          <img src="/uploads/Malaika.png" alt="" />
        </span>
        <strong>{content.site.name}</strong>
      </a>
      <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
        {routes.map((route) => (
          <a
            key={route.path}
            href={route.path}
            className={path === route.path ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              navigate(route.path);
              setMenuOpen(false);
            }}
          >
            {route.label}
          </a>
        ))}
      </nav>
      <a
        href="/contact"
        className="header-cta"
        onClick={(event) => {
          event.preventDefault();
          navigate("/contact");
          setMenuOpen(false);
        }}
      >
        <Mail size={18} />
        <span>Work with me</span>
      </a>
      <button
        className="icon-button menu-button"
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
    </header>
  );
}

function Home({ navigate, playerController }) {
  const featured = content.portfolio.filter((item) => item.featured).slice(0, 3);

  return (
    <>
      <section className="hero-section">
        <div className="hero-media" aria-hidden="true">
          <img src={content.site.heroImage} alt="" />
        </div>
        <div className="hero-content page-shell">
          <p className="eyebrow">{content.site.role}</p>
          <h1>{content.site.name}</h1>
          <p className="hero-copy">{content.site.intro}</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => navigate("/contact")}>
              <Send size={18} />
              Work with me
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate("/portfolio")}>
              <Play size={18} />
              View work
            </button>
          </div>
        </div>
      </section>

      <section className="intro-section">
        <div className="page-shell intro-grid" data-reveal>
          <div>
            <p className="eyebrow">How I Create</p>
            <ShineHeading>I create content that resonates across cultures and borders.</ShineHeading>
          </div>
          <div className="intro-copy">
            <p>{content.site.bio}</p>
            <div className="social-row">
              {content.site.socials.map((social) => (
                <a key={social.label} href={social.url} target="_blank" rel="noreferrer">
                  {socialIcon(social.label)}
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="portfolio-preview section-band">
        <div className="page-shell section-heading" data-reveal>
          <div>
            <p className="eyebrow">Featured Work</p>
          </div>
          <button className="text-button" type="button" onClick={() => navigate("/portfolio")}>
            See all work
            <ChevronRight size={18} />
          </button>
        </div>
        <PortfolioCarousel
          items={featured}
          shellClassName="page-shell"
          trackClassName="feature-grid"
          playerController={playerController}
          label="Featured work"
        />
      </section>

      <CtaBlock navigate={navigate} />
    </>
  );
}

function Portfolio({ playerController }) {
  const filters = content.categories.map((category) => category.name);
  const [filter, setFilter] = useState(filters[0] || "");
  const visibleItems = content.portfolio.filter((item) => item.category === filter);

  return (
    <PageHero
      eyebrow="Portfolio"
      title="My Content"
      copy="Real experiences shaped into engaging social content."
      shineTitle
      compactDesktop
    >
      <div className="filter-bar">
        {filters.map((item) => (
          <button
            className={filter === item ? "filter-chip active" : "filter-chip"}
            key={item}
            type="button"
            onClick={() => setFilter(item)}
          >
            {formatCategoryTab(item)}
          </button>
        ))}
      </div>
      <PortfolioCarousel
        key={filter}
        items={visibleItems}
        trackClassName="portfolio-grid"
        playerController={playerController}
        label={`${formatCategoryTab(filter)} portfolio`}
      />
      {visibleItems.length === 0 && (
        <div className="empty-state" data-reveal>
          <p className="eyebrow">{formatCategoryTab(filter)}</p>
          <h2>More work is coming here soon.</h2>
          <p>New embedded videos will be added as soon as the right links are ready.</p>
        </div>
      )}
    </PageHero>
  );
}

function PortfolioCarousel({ items, shellClassName = "", trackClassName, playerController, label }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const maxIndex = Math.max(0, items.length - 1);
  const itemsSignature = items.map((item) => item.url || item.title).join("|");

  React.useEffect(() => {
    setActiveIndex(0);
  }, [itemsSignature]);

  const moveTo = React.useCallback(
    (nextIndex) => {
      const clampedIndex = Math.min(maxIndex, Math.max(0, nextIndex));
      setActiveIndex(clampedIndex);
      playerController?.pauseAll?.();
    },
    [maxIndex, playerController]
  );

  return (
    <div
      className={`carousel-shell ${shellClassName}`.trim()}
      style={{ "--carousel-index": activeIndex }}
      aria-label={label}
    >
      <div className={`${trackClassName} carousel-track`}>
        {items.map((item) => (
          <PortfolioCard item={item} key={item.title} playerController={playerController} />
        ))}
      </div>
      {activeIndex > 0 && (
        <button className="carousel-nav carousel-nav-prev" type="button" onClick={() => moveTo(activeIndex - 1)} aria-label="Previous video">
          <ChevronLeft size={20} strokeWidth={2.25} aria-hidden="true" />
        </button>
      )}
      {activeIndex < maxIndex && (
        <button className="carousel-nav carousel-nav-next" type="button" onClick={() => moveTo(activeIndex + 1)} aria-label="Next video">
          <ChevronRight size={20} strokeWidth={2.25} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function formatCategoryTab(category) {
  return category || "";
}

function PortfolioCard({ item, playerController }) {
  const embed = getVideoEmbed(item.url);
  const playerId = React.useMemo(() => `${item.category}:${item.title}:${item.url}`, [item.category, item.title, item.url]);
  const registerPlayer = React.useCallback(
    (player) => {
      playerController?.registerPlayer(playerId, player);
    },
    [playerController, playerId]
  );

  return (
    <article className="portfolio-card" data-reveal>
      {embed ? (
        <div className="thumb-link embedded-player" aria-label={`${item.title} ${embed.platform} player`}>
          <iframe
            ref={registerPlayer}
            src={embed.src}
            title={`${item.title} ${embed.platform} player`}
            data-platform={embed.platform}
            loading={embed.platform === "TikTok" ? "eager" : "lazy"}
            allow="clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <a href={item.url || "#"} target={item.url ? "_blank" : undefined} rel="noreferrer" className="thumb-link">
          <img src={item.thumbnail} alt={`${item.title} thumbnail`} />
          <span className="play-badge">
            <Play size={16} fill="currentColor" />
          </span>
        </a>
      )}
      <div className="portfolio-body">
        <div className="card-meta">
          <span>{item.category}</span>
          {item.platform && <span>{item.platform}</span>}
        </div>
        {!embed && <p>{item.description}</p>}
        {!embed && item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className="inline-link">
            Open social
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    </article>
  );
}

function getVideoEmbed(url) {
  if (!url) return null;

  const tikTokMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
  if (tikTokMatch) {
    return {
      platform: "TikTok",
      src: `https://www.tiktok.com/player/v1/${tikTokMatch[1]}?controls=1&autoplay=0&loop=0&music_info=0&description=0&rel=0`
    };
  }

  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  if (youtubeMatch) {
    return {
      platform: "YouTube",
      src: `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&enablejsapi=1`
    };
  }

  return null;
}

function Services({ navigate }) {
  return (
    <PageHero
      eyebrow="Services & Rates"
      title="Here are a few ways we can work together."
      copy="My UGC services include concept development, script outline when needed, filming, editing, captions, professional delivery, and one re-edit after feedback."
      shineTitle
      compactDesktop
    >
      <div className="rates-layout">
        <div className="rates-column">
          <h2>Base Packages</h2>
          <div className="rate-grid">
            {content.rates.packages.map((rate) => (
              <RateCard rate={rate} key={rate.name} />
            ))}
          </div>
        </div>
        <div className="rates-column">
          <h2>Usage & Add-ons</h2>
          <div className="rate-grid">
            {content.rates.addons.map((rate) => (
              <RateCard rate={rate} key={rate.name} />
            ))}
          </div>
        </div>
      </div>
      <div className="center-action">
        <button className="primary-button" type="button" onClick={() => navigate("/contact")}>
          <MessageCircle size={18} />
          Ask for a quote
        </button>
      </div>
    </PageHero>
  );
}

function RateCard({ rate }) {
  return (
    <article className="rate-card" data-reveal>
      <Check size={18} />
      <h3>{rate.name}</h3>
      <strong>{rate.price}</strong>
      <p>{rate.detail}</p>
    </article>
  );
}

function Collaborations({ navigate }) {
  const logoBrands = content.brands.filter((brand) => brand.logo);

  return (
    <PageHero
      eyebrow="Collaborations"
      title="I document real experiences that resonate with globally curious audiences."
      shineTitle
      compactDesktop
    >
      <div className="trusted-brands" data-reveal>
        <p className="eyebrow">Trusted by:</p>
        <div className="brand-grid">
          {logoBrands.map((brand) => (
            <article className="brand-card" key={brand.name} aria-label={brand.name}>
              <div className="brand-visual">
                <img src={brand.logo} alt={`${brand.name} logo`} />
              </div>
            </article>
          ))}
        </div>
      </div>
      <section className="brand-testimonial" data-reveal>
        <div>
          <p className="eyebrow">Brand Testimonials</p>
          <h2>Seon Collective</h2>
          <p>{content.testimonials[0].quote}</p>
          <button className="primary-button" type="button" onClick={() => navigate("/contact")}>
            <Send size={18} />
            Plan a campaign with me
          </button>
        </div>
        <img src={content.brands[0].image} alt="Seon Collective campaign preview" />
      </section>
    </PageHero>
  );
}

function Contact() {
  return (
    <PageHero
      eyebrow="Contact"
      title="Let's talk campaigns."
      copy="Tell me what you're building, what kind of content you need, and when you need it. I will read through the details and get back to you."
      shineTitle
      compactDesktop
    >
      <section className="contact-layout">
        <div className="contact-panel" data-reveal>
          <h2>Reach me directly</h2>
          <a href={`mailto:${content.site.email}`} className="contact-line">
            <Mail size={18} />
            {content.site.email}
          </a>
          {content.site.socials.map((social) => (
            <a key={social.label} href={social.url} target="_blank" rel="noreferrer" className="contact-line">
              {socialIcon(social.label)}
              {social.label}
            </a>
          ))}
        </div>

        <form
          className="contact-form"
          name="contact"
          method="POST"
          data-netlify="true"
          netlify-honeypot="bot-field"
          action="/thank-you"
          data-reveal
        >
          <input type="hidden" name="form-name" value="contact" />
          <p className="hidden-field">
            <label>
              Leave this empty
              <input name="bot-field" />
            </label>
          </p>
          <label>
            Name
            <input name="name" type="text" autoComplete="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Brand / Company
            <input name="brand" type="text" autoComplete="organization" />
          </label>
          <label>
            Campaign Type
            <select name="campaign_type" required defaultValue="">
              <option value="" disabled>
                Select one
              </option>
              <option>UGC video</option>
              <option>UGC photo</option>
              <option>Paid media usage</option>
              <option>Brand collaboration</option>
              <option>Modeling or acting</option>
            </select>
          </label>
          <label className="mobile-span-two">
            Budget / Timeline
            <input name="budget" type="text" placeholder="Example: 3 videos this month" />
          </label>
          <label className="span-two">
            Message
            <textarea name="message" rows="6" required />
          </label>
          <button className="primary-button span-two" type="submit">
            <Send size={18} />
            Submit
          </button>
        </form>
      </section>
    </PageHero>
  );
}

function ThankYou({ navigate }) {
  return (
    <PageHero
      eyebrow="Message Sent"
      title="Thanks for reaching out."
      copy="I have your inquiry and will reply as soon as I can."
    >
      <button className="primary-button" type="button" onClick={() => navigate("/")}>
        <ArrowRight size={18} />
        Back to home
      </button>
    </PageHero>
  );
}

function NotFound({ navigate }) {
  return (
    <PageHero eyebrow="404" title="This page is not available." copy="Use the navigation to get back to the main site.">
      <button className="primary-button" type="button" onClick={() => navigate("/")}>
        <ArrowRight size={18} />
        Back to home
      </button>
    </PageHero>
  );
}

function PageHero({ eyebrow, title, copy, children, shineTitle = false, compactDesktop = false }) {
  return (
    <section className={compactDesktop ? "page-section page-section-compact-desktop" : "page-section"}>
      <div className="page-shell">
        <div className="page-intro" data-reveal>
          <p className="eyebrow page-intro-eyebrow">{eyebrow}</p>
          {shineTitle ? <ShineHeading as="h1">{title}</ShineHeading> : <h1>{title}</h1>}
          {copy && <p>{copy}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function CtaBlock({ navigate }) {
  return (
    <section className="cta-band">
      <div className="page-shell cta-inner" data-reveal>
        <div>
          <p className="eyebrow">Ready To Collaborate</p>
          <ShineHeading>Let's build the kind of content people actually stop for.</ShineHeading>
        </div>
        <button className="primary-button" type="button" onClick={() => navigate("/contact")}>
          <Mail size={18} />
          Contact me
        </button>
      </div>
    </section>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-grid">
        <div>
          <strong>{content.site.name}</strong>
          <p>{content.site.role}</p>
        </div>
        <div className="footer-links">
          {routes.map((route) => (
            <a
              key={route.path}
              href={route.path}
              onClick={(event) => {
                event.preventDefault();
                navigate(route.path);
              }}
            >
              {route.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function socialIcon(label) {
  const normalized = label.toLowerCase();
  if (normalized.includes("instagram")) return <Instagram size={17} />;
  if (normalized.includes("youtube")) return <Youtube size={17} />;
  if (normalized.includes("tiktok")) return <Clapperboard size={17} />;
  return <Camera size={17} />;
}

const rootElement = document.getElementById("root");
const appRoot = window.__malaikaAppRoot || createRoot(rootElement);
window.__malaikaAppRoot = appRoot;
appRoot.render(<App />);
