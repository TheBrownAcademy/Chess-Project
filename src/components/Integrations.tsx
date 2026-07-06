import { useRef } from "react";
import { Video, Sparkles } from "lucide-react";
import { useGSAP } from "../hooks/useGSAP";
import { gsap, dur } from "../utils/gsapConfig";

// ── Custom Brand SVGs ─────────────────────────────────────────────────────────

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[24px]" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const FigmaIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-[24px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
    <path d="M12 2h3.5a3.5 3.5 0 0 1 0 7H12V2z" />
    <path d="M12 9h3.5a3.5 3.5 0 0 1 3.5 3.5v0a3.5 3.5 0 0 1-3.5 3.5H12V9z" />
    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
    <path d="M5 18.5A3.5 3.5 0 0 1 8.5 15H12v3.5A3.5 3.5 0 0 1 8.5 22h0A3.5 3.5 0 0 1 5 18.5z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[24px]" fill="currentColor">
    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.746-.08-1.32-.176-1.888H12.24z" />
  </svg>
);

const StripeIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[24px]" fill="currentColor">
    <path d="M13.962 10.431c-2.39-.508-3.155-.898-3.155-1.745 0-.742.664-1.242 1.832-1.242 1.18 0 2.188.375 2.922.844l1.242-2.336c-.953-.617-2.348-1.027-3.926-1.027-3.246 0-5.387 1.723-5.387 4.55 0 2.91 2.375 3.84 5.336 4.453 2.129.445 2.766.887 2.766 1.707 0 .863-.828 1.344-2.043 1.344-1.5 0-2.828-.465-3.652-1.09l-1.277 2.379c1.176.793 2.895 1.215 4.672 1.215 3.488 0 5.863-1.77 5.863-4.664 0-3.176-2.586-4.043-5.211-4.594z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[24px]" fill="currentColor">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.553a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[24px]" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
  </svg>
);

const NotionIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[24px]" fill="currentColor">
    <path d="M19.355 2H4.645C3.189 2 2 3.189 2 4.645v14.71C2 20.811 3.189 22 4.645 22h14.71c1.456 0 2.645-1.189 2.645-2.645V4.645C22 3.189 20.811 2 19.355 2zm-4.108 14.887L11.5 12.585v4.302H9.288V7.113h2.257l3.747 4.302V7.113h2.211v9.774h-2.256z" />
  </svg>
);

// ── Concentric Conic Circle ───────────────────────────────────────────────────

interface CircleSnakeProps {
  radius: number;
  offset: number;
}

function CircleSnake({ radius, offset }: CircleSnakeProps) {
  const gradientStyle = {
    background: `conic-gradient(from ${offset}deg, transparent 0deg, transparent 280deg, #151630 300deg, #965F7E 320deg, #AB717D 340deg, #CF9B6E 360deg)`,
  };

  return (
    <div
      className="rounded-full overflow-hidden relative shrink-0"
      style={{ width: `${radius}px`, height: `${radius}px` }}
    >
      <div
        style={gradientStyle}
        className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] animate-[spin_10s_linear_infinite]"
      />
      <div className=" bg-[#1C1D36] absolute inset-[2px] rounded-full border-[1px] border-[#262943df]" />
    </div>
  );
}

// ── Animated Integrations Card ───────────────────────────────────────────────

export function IntegrationsCard() {
  const circles = [
    { radius: 554, offset: 340 },
    { radius: 517, offset: 350 },
    { radius: 480, offset: 0 },
    { radius: 443, offset: 10 },
    { radius: 409, offset: 20 },
    { radius: 376, offset: 30 },
    { radius: 342, offset: 40 },
    { radius: 316, offset: 50 },
    { radius: 291, offset: 60 },
    { radius: 262, offset: 70 },
    { radius: 234, offset: 80 },
    { radius: 209, offset: 90 },
    { radius: 184, offset: 100 },
    { radius: 163, offset: 110 },
    { radius: 142, offset: 120 },
  ];

  return (
    <div
      className="luxury-card w-[384px] h-[540px] backdrop-blur-xl relative overflow-hidden"
      style={{ borderRadius: "2px" }}
    >
      {/* Upper Content */}
      <div
        className="flex flex-col gap-3 absolute inset-5 z-20"
        style={{ position: "absolute" }}
      >
        <div className="size-[30px] rounded-lg bg-gold-whisper border border-gold/30 flex items-center justify-center text-gold-bright">
          <Sparkles className="size-[16px]" />
        </div>
        <div>
          <p className="font-semibold text-[19px] text-[#E2E8FF] tracking-tight">
            Crafted for your favorite tools
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-[14px] text-[#7C7F99] leading-relaxed">
            Connect your tools - we’ll handle the rest.
          </p>
          <p className="font-medium text-[14px] text-[#7C7F99] leading-relaxed">
            Many integrations, with more to come.
          </p>
        </div>
      </div>

      {/* Spiral Canvas Area */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2"
        style={{ position: "absolute" }}
      >
        <div className="size-[365px] border-[1px] border-[#272842] rounded-xl overflow-hidden relative bg-[#090A1F]">
          {/* Concentric spiral snake lines */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="relative">
              {circles.map((c, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <CircleSnake radius={c.radius} offset={c.offset} />
                </div>
              ))}
            </div>
          </div>

          {/* Orbiting Icons */}
          <div className="size-[271px] absolute animate-spin-reverse top-[47px] left-[47px] z-10">
            <div className="relative w-full h-full">
              {/* GitHub */}
              <div
                className="size-[55px] absolute animate-[spin_10s_linear_infinite] top-[108px] left-[223px] rounded-full bg-[#151732E5] flex justify-center items-center border border-[#36395A] text-white hover:text-gold-bright transition-colors"
                title="GitHub integration"
              >
                <GithubIcon />
              </div>

              {/* Figma */}
              <div
                className="size-[55px] absolute animate-[spin_10s_linear_infinite] top-[27px] left-[189px] rounded-full bg-[#151732E5] flex justify-center items-center border border-[#36395A] text-white hover:text-gold-bright transition-colors"
                title="Figma design system"
              >
                <FigmaIcon />
              </div>

              {/* Google */}
              <div
                className="size-[55px] absolute animate-[spin_10s_linear_infinite] -top-[7px] left-[108px] rounded-full bg-[#151732E5] flex justify-center items-center border border-[#36395A] text-white hover:text-gold-bright transition-colors"
                title="Google Workspace"
              >
                <GoogleIcon />
              </div>

              {/* Stripe */}
              <div
                className="size-[55px] absolute animate-[spin_10s_linear_infinite] top-[27px] left-[27px] rounded-full bg-[#151732E5] flex justify-center items-center border border-[#36395A] text-white hover:text-gold-bright transition-colors"
                title="Stripe payment gateway"
              >
                <StripeIcon />
              </div>

              {/* Zoom */}
              <div
                className="size-[55px] absolute animate-[spin_10s_linear_infinite] top-[108px] left-[-7px] rounded-full bg-[#151732E5] flex justify-center items-center border border-[#36395A] text-white hover:text-gold-bright transition-colors"
                title="Zoom meetings integration"
              >
                <Video className="size-[24px]" />
              </div>

              {/* YouTube */}
              <div
                className="size-[55px] absolute animate-[spin_10s_linear_infinite] top-[189px] left-[27px] rounded-full bg-[#151732E5] flex justify-center items-center border border-[#36395A] text-white hover:text-gold-bright transition-colors"
                title="YouTube content embeds"
              >
                <YoutubeIcon />
              </div>

              {/* Discord */}
              <div
                className="size-[55px] absolute animate-[spin_10s_linear_infinite] top-[223px] left-[108px] rounded-full bg-[#151732E5] flex justify-center items-center border border-[#36395A] text-white hover:text-gold-bright transition-colors"
                title="Discord community features"
              >
                <DiscordIcon />
              </div>

              {/* Notion */}
              <div
                className="size-[55px] absolute animate-[spin_10s_linear_infinite] top-[189px] left-[189px] rounded-full bg-[#151732E5] flex justify-center items-center border border-[#36395A] text-white hover:text-gold-bright transition-colors"
                title="Notion knowledge base sync"
              >
                <NotionIcon />
              </div>
            </div>
          </div>

          {/* Central Logo */}
          <div className="size-[64px] rounded-full absolute overflow-hidden top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 border border-gold/30 bg-[#0C1020] flex items-center justify-center p-2 shadow-gold-sm">
            <img
              src="/final%20logo.png"
              alt="XLChess logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Integrations Section Component ──────────────────────────────────────────

export default function Integrations() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Header Animation
      gsap.fromTo(
        headerRef.current,
        { y: 50, opacity: 0, filter: "blur(6px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: dur(1.0),
          ease: "expo.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 84%",
            toggleActions: "play none none none",
          },
        },
      );

      // Card Stagger/Entrance
      gsap.fromTo(
        cardRef.current,
        { scale: 0.95, opacity: 0, y: 40 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: dur(1.1),
          ease: "expo.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );
    },
    sectionRef,
    [],
  );

  return (
    <>
      <div className="section-divider" aria-hidden="true" />

      <section
        ref={sectionRef}
        id="integrations"
        className="relative py-28 md:py-36 overflow-hidden bg-brand-bg"
      >
        {/* Glow Effects */}
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: "rgba(212, 175, 110, 0.015)" }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none"
          style={{ background: "rgba(99, 102, 241, 0.02)" }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            {/* Left Content Column */}
            <div
              ref={headerRef}
              className="w-full lg:w-1/2 text-left space-y-8"
              style={{ opacity: 0 }}
            >
              <div className="section-eyebrow">Ecosystem Integrations</div>
              <h2 className="font-display text-5xl sm:text-6xl md:text-7xl tracking-editorial leading-[0.95] text-white">
                Everything Connected.
                <span
                  className="block text-gold-gradient font-display"
                  style={{ fontStyle: "italic", fontWeight: 400 }}
                >
                  Automated for You.
                </span>
              </h2>

              <p className="font-sans text-base sm:text-lg leading-relaxed text-brand-secondary">
                ChessCraft integrates directly with the platforms you already
                rely on to run your business, stream your matches, and teach
                your academy. Keep your focus on content and coaching — we take
                care of the background orchestration.
              </p>

              {/* Integration Bullets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-brand-border/60">
                <div className="space-y-2">
                  <h4 className="font-sans font-semibold text-white text-base flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    Audience &amp; Live Streams
                  </h4>
                  <p className="font-sans text-sm text-brand-secondary leading-relaxed">
                    Embed YouTube videos, stream directly to your community
                    dashboard, and coordinate events via Discord.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-sans font-semibold text-white text-base flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    Billing &amp; Coaching
                  </h4>
                  <p className="font-sans text-sm text-brand-secondary leading-relaxed">
                    Configure Stripe for memberships and digital products, and
                    book tutoring sessions through Google or Zoom.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-sans font-semibold text-white text-base flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    Custom styling
                  </h4>
                  <p className="font-sans text-sm text-brand-secondary leading-relaxed">
                    Sync figma themes and modify your platform assets directly
                    using Git/GitHub version tracking.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-sans font-semibold text-white text-base flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    Structured Learning
                  </h4>
                  <p className="font-sans text-sm text-brand-secondary leading-relaxed">
                    Synchronize student databases, assignments, and study logs
                    directly to your custom Notion Workspace.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Spiral Column */}
            <div
              ref={cardRef}
              className="w-full lg:w-1/2 flex justify-center items-center"
              style={{ opacity: 0 }}
            >
              <div className="relative">
                {/* Decorative gold backdrop reflection */}
                <div
                  className="absolute inset-0 blur-[60px] pointer-events-none"
                  style={{
                    background: "rgba(212, 175, 110, 0.04)",
                    mixBlendMode: "screen",
                    borderRadius: "2px",
                  }}
                  aria-hidden="true"
                />
                <IntegrationsCard />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
