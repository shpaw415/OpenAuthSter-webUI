"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@static/logo.webp";
import { Icon } from "@components/icon";
import { useAuth } from "@hooks/useAuth";

type NavLink = { href: string; label: string; external?: boolean };
type FooterLink = { href: string; label: string; icon?: string; external?: boolean };

const NAV_LINKS: NavLink[] = [
	{ href: "#features", label: "Features" },
	{ href: "#how-it-works", label: "How it works" },
	{ href: "#testimonials", label: "Testimonials" },
	{ href: "#pricing", label: "Pricing" },
	{ href: "https://doc.openauthster.com/docs", label: "Docs", external: true },
];

const LOGO_STRIP = [
	{ icon: "simple-icons:cloudflare", label: "Cloudflare" },
	{ icon: "simple-icons:react", label: "React" },
	{ icon: "simple-icons:tailwindcss", label: "Tailwind" },
	{ icon: "simple-icons:drizzle", label: "Drizzle" },
	{ icon: "simple-icons:hono", label: "Hono" },
	{ icon: "simple-icons:github", label: "GitHub" },
];

const PLATFORM_FEATURES = [
	{
		title: "Manage projects from one dashboard",
		description: "Switch between clients and tenants. Isolated auth domains per project.",
		visual: "multi-project",
	},
	{
		title: "Security by default",
		description: "TOTP, WebAuthn, HMAC sessions. MFA and secure flows built-in.",
		visual: "security",
	},
	{
		title: "Edge-native deployment",
		description: "Workers + D1. Low-latency auth endpoints worldwide.",
		visual: "edge",
	},
	{
		title: "Composable provider stack",
		description: "Social, OIDC, password, passkeys. Add providers in minutes.",
		visual: "providers",
	},
] as const;

const HOW_IT_WORKS = [
	{
		step: 1,
		title: "Create a project and configure providers",
		description: "Add your project in the dashboard, set up OAuth, OIDC, or password providers in minutes.",
		visual: "setup",
	},
	{
		step: 2,
		title: "Deploy to Cloudflare Workers",
		description: "OpenAuthster runs at the edge. Deploy the issuer and connect your app via the SDK.",
		visual: "deploy",
	},
	{
		step: 3,
		title: "Integrate and go live",
		description: "Use the client SDK in your app. Sessions, MFA, and themes are ready to use.",
		visual: "integrate",
	},
];

const PRICING_PLANS = [
	{
		name: "Free",
		price: { monthly: 0, yearly: 0 },
		description: "For side projects and MVPs",
		chips: ["1 project", "100 users"],
		features: [
			"Email/password + OAuth",
			"Basic dashboard",
			"Community support",
		],
		cta: "Start Free",
		popular: false,
	},
	{
		name: "Premium",
		price: { monthly: 17, yearly: 14 },
		description: "For startups and growing teams",
		chips: ["5 projects", "5,000 users"],
		features: [
			"Advanced provider configs",
			"Webhooks + custom themes",
			"Priority support",
			"More auth analytics",
		],
		cta: "Upgrade to Premium",
		popular: true,
	},
	{
		name: "Enterprise",
		price: { monthly: 49, yearly: 39 },
		description: "For organizations at scale",
		chips: ["Unlimited projects", "Unlimited users"],
		features: [
			"SSO-ready setup",
			"SLA and dedicated support",
			"Security review assistance",
			"Enterprise onboarding",
		],
		cta: "Contact Team",
		popular: false,
	},
];

const TESTIMONIALS = [
	{ quote: "OpenAuthster replaced a month of auth work with one weekend. Multi-tenant support was the key for us.", author: "Alex Chen", role: "CTO, BuildFlow" },
	{ quote: "We needed secure auth on Workers without losing control. This gave us both velocity and flexibility.", author: "Sarah Miller", role: "Lead Developer" },
	{ quote: "The dashboard-driven setup made onboarding new projects surprisingly fast and predictable.", author: "Nolan Reyes", role: "Product Engineer" },
	{ quote: "Deploying auth at the edge cut our latency in half. Our users notice the difference.", author: "Jordan Kim", role: "Staff Engineer" },
	{ quote: "OIDC, social logins, and passkeys from one dashboard. Exactly what we needed.", author: "Maya Patel", role: "Tech Lead" },
	{ quote: "The multi-project control lets us manage several client apps without context switching.", author: "Chris Wu", role: "Founder, AuthFlow" },
	{ quote: "WebAuthn and TOTP built-in meant we could ship MFA without extra services.", author: "Elena Torres", role: "Security Engineer" },
	{ quote: "Cloudflare-native stack, D1, Workers — we stayed in our ecosystem from day one.", author: "Dev Raj", role: "Platform Lead" },
];

const FOOTER_LINKS: Record<string, FooterLink[]> = {
	Product: [
		{ href: "#features", label: "Features", icon: "lucide:layout-grid" },
		{ href: "#how-it-works", label: "How it works", icon: "lucide:list-ordered" },
		{ href: "#testimonials", label: "Testimonials", icon: "lucide:messages-square" },
		{ href: "#pricing", label: "Pricing", icon: "lucide:badge-dollar-sign" },
	],
	Resources: [
		{
			href: "https://doc.openauthster.com/",
			label: "Docs",
			icon: "lucide:book-open",
			external: true,
		},
		{
			href: "https://doc.openauthster.com/docs/getting-started",
			label: "Getting Started",
			icon: "lucide:rocket",
			external: true,
		},
		{
			href: "https://github.com/shpaw415/openauthster",
			label: "GitHub",
			icon: "simple-icons:github",
			external: true,
		},
	],
	Community: [
		{
			href: "https://github.com/shpaw415/openauthster/discussions",
			label: "Discussions",
			icon: "lucide:message-circle",
			external: true,
		},
		{
			href: "https://github.com/shpaw415/openauthster/issues",
			label: "Issues",
			icon: "lucide:bug",
			external: true,
		},
	],
};

function useScrollReveal(threshold = 0.12) {
	const ref = useRef<HTMLElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) setVisible(true);
			},
			{ threshold },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [threshold]);

	return { ref, visible };
}

function CTAButton({
	auth,
	className,
	children,
}: {
	auth: ReturnType<typeof useAuth>;
	className: string;
	children: React.ReactNode;
}) {
	if (auth?.isLoaded && auth?.isAuthenticated) {
		return (
			<a href="/dashboard" className={className}>
				{children}
			</a>
		);
	}
	return (
		<button type="button" onClick={() => auth?.login?.()} className={className}>
			{children}
		</button>
	);
}

export default function LandingPage() {
	const auth = useAuth();
	const [yearly, setYearly] = useState(false);
	const [testimonialIndex, setTestimonialIndex] = useState(0);
	const [carouselDirection, setCarouselDirection] = useState<"left" | "right" | null>(null);
	const heroReveal = useScrollReveal(0.2);
	const featuresReveal = useScrollReveal(0.08);
	const howItWorksReveal = useScrollReveal(0.08);
	const testimonialReveal = useScrollReveal(0.08);
	const pricingReveal = useScrollReveal(0.08);

	const goToTestimonial = (delta: number) => {
		setCarouselDirection(delta > 0 ? "right" : "left");
		setTestimonialIndex((i) => (i + delta + TESTIMONIALS.length) % TESTIMONIALS.length);
	};

	useEffect(() => {
		if (carouselDirection === null) return;
		const raf = requestAnimationFrame(() => {
			requestAnimationFrame(() => setCarouselDirection(null));
		});
		return () => cancelAnimationFrame(raf);
	}, [carouselDirection]);

	useEffect(() => {
		const id = setInterval(() => goToTestimonial(1), 5200);
		return () => clearInterval(id);
	}, []);

	return (
		<div className="min-h-screen bg-[#05070d] text-gray-300 antialiased overflow-x-hidden">
			<div
				className="fixed inset-0 pointer-events-none z-0 opacity-[0.07]"
				style={{
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)",
					backgroundSize: "40px 40px",
				}}
				aria-hidden
			/>

			<header className="relative z-30 w-full px-5 py-3 border-b border-white/5 bg-black/55 backdrop-blur-xl">
				<nav className="max-w-6xl mx-auto flex items-center justify-between gap-4">
					<a href="/" className="flex items-center gap-2.5">
						<img src={Logo.src(320)} alt="OpenAuthster" className="w-8 h-8 object-contain" />
						<span className="font-semibold text-white text-lg">OpenAuthster</span>
					</a>
					<div className="hidden md:flex items-center gap-5">
						{NAV_LINKS.map((link) => (
							<a
								key={link.label}
								href={link.href}
								target={link.external ? "_blank" : undefined}
								rel={link.external ? "noreferrer" : undefined}
								className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
							>
								{link.label}
							</a>
						))}
					</div>
					{auth?.isLoaded && (
						<CTAButton
							auth={auth}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#007AFF] text-white hover:bg-[#0066DD] transition-all duration-300 text-sm font-medium shadow-[0_0_26px_rgba(0,122,255,0.33)]"
						>
							<Icon icon="lucide:arrow-up-right" className="w-4 h-4" />
							{auth?.isAuthenticated ? "Open Dashboard" : "Start Free"}
						</CTAButton>
					)}
				</nav>
			</header>

			<section
				ref={heroReveal.ref as React.RefObject<HTMLElement>}
				className={`relative z-20 overflow-hidden px-5 pt-14 pb-20 md:pt-20 md:pb-24 transition-all duration-700 ${
					heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
				}`}
			>
				{/* Hero background - AIVERA-style: radial glow + vertical column lighting */}
				<div className="absolute inset-0 pointer-events-none -z-10" aria-hidden>
					{/* Base: deep navy, black at edges */}
					<div
						className="absolute inset-0"
						style={{ background: "#05070d" }}
					/>
					{/* Primary radial glow: electric blue #2f5bff, strongest at top-center */}
					<div
						className="absolute inset-0"
						style={{
							background:
								"radial-gradient(ellipse 100% 70% at 50% 35%, #2f5bff 0%, rgba(47,91,255,0.6) 20%, rgba(30,58,138,0.3) 45%, transparent 75%)",
						}}
					/>
					{/* Vertical columns: many bands, each with distinct opacity variation */}
					<div className="absolute inset-0 flex">
						{Array.from({ length: 28 }, (_, i) => {
							const center = 13.5;
							const distFromCenter = Math.abs(i - center) / center;
							const colOpacity = 1 - distFromCenter * 0.88;
							const wave1 = Math.sin((i / 28) * Math.PI) * 0.1;
							const wave2 = Math.sin((i * 1.3) * 0.4) * 0.06;
							const variation = wave1 + wave2;
							const topBright = Math.min(0.5, 0.1 + colOpacity * 0.32 + variation);
							const midBright = Math.min(0.25, 0.03 + colOpacity * 0.14 + variation * 0.6);
							const bottomBright = 0.005 + colOpacity * 0.025 + variation * 0.2;
							return (
								<div
									key={i}
									className="flex-1 min-w-0 shrink-0"
									style={{
										background: `linear-gradient(to bottom, rgba(47,91,255,${topBright}) 0%, rgba(47,91,255,${midBright}) 45%, rgba(47,91,255,${bottomBright}) 80%, transparent 100%)`,
										borderRight: i < 27 ? "1px solid rgba(0,0,0,0.18)" : "none",
									}}
								/>
							);
						})}
					</div>
					{/* Top-to-bottom: solid dark at bottom (mockup area) */}
					<div
						className="absolute inset-0"
						style={{
							background:
								"linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(5,7,13,0.2) 80%, rgba(5,7,13,0.6) 100%)",
						}}
					/>
					{/* Vignette: darken edges, keep center visible for columns */}
					<div
						className="absolute inset-0"
						style={{
							background:
								"radial-gradient(ellipse 85% 75% at 50% 40%, transparent 50%, rgba(0,0,0,0.3) 100%)",
						}}
					/>
					<div
						className="absolute inset-0"
						style={{
							background:
								"linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.4) 100%)",
						}}
					/>
					{/* Fine grain noise */}
					<div
						className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
							backgroundRepeat: "repeat",
						}}
					/>
				</div>
				<div className="relative max-w-6xl mx-auto">
				<div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
					<div>
						<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-gray-300 mb-5">
							<Icon icon="lucide:sparkles" className="w-3.5 h-3.5 text-[#007AFF]" />
							Auth Infrastructure, Reimagined
						</div>
						<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.03] tracking-tight max-w-2xl">
							Launch multi-tenant auth with a futuristic control plane.
						</h1>
						<p className="mt-4 text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed">
							Deploy one issuer, manage many projects, and scale on Cloudflare with
							providers, templates, themes, and sessions from one modern dashboard.
						</p>
						<div className="mt-8 flex flex-wrap gap-4">
							<div className="relative">
								<span className="absolute inset-0 rounded-full bg-[#007AFF]/35 blur-xl animate-pulse-ring" />
								<CTAButton
									auth={auth}
									className="relative inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#007AFF] text-white font-medium hover:bg-[#0066DD] transition-all duration-300"
								>
									<Icon icon="lucide:rocket" className="w-4 h-4" />
									Get Started Free
								</CTAButton>
							</div>
							<a
								href="https://doc.openauthster.com/docs"
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white hover:border-[#007AFF]/60 hover:bg-[#007AFF]/10 transition-all duration-300"
							>
								<Icon icon="lucide:book-open" className="w-4 h-4" />
								Read Docs
							</a>
						</div>
					</div>

					<div className="relative mt-1 lg:mt-0">
						<div className="absolute inset-0 rounded-2xl opacity-30 blur-3xl" style={{ background: "radial-gradient(circle at 48% 46%, rgba(0,122,255,0.36) 0%, transparent 62%)" }} />
						<div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl animate-float-slow">
							<div className="h-8 flex items-center gap-2 px-3 border-b border-white/10 bg-white/[0.03]">
								<div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
								<div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
								<div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
							</div>
							<div className="p-4 grid grid-cols-6 gap-2.5 bg-linear-to-r from-[#0c111b] via-[#101829] to-[#0b111b] bg-[length:200%_200%] animate-gradient-shift">
								<div className="col-span-2 rounded-lg border border-white/10 bg-black/35 p-2 space-y-2">
									<div className="h-2.5 rounded bg-white/10" />
									<div className="h-2.5 rounded bg-[#007AFF]/35" />
									<div className="h-2.5 rounded bg-white/10" />
									<div className="h-2.5 rounded bg-white/10" />
								</div>
								<div className="col-span-4 grid grid-cols-2 gap-2.5">
									{[1, 2, 3, 4, 5, 6].map((i) => (
										<div key={i} className="h-14 rounded-lg border border-white/10 bg-white/6" />
									))}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-10 w-full min-w-0">
					<p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Trusted stack</p>
					<div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
						<div className="flex animate-marquee-slow w-max">
							{[1, 2].map((copy) => (
								<div key={copy} className="flex min-w-max shrink-0 gap-7 px-4 py-3" aria-hidden={copy > 1}>
									{Array(4)
										.fill(LOGO_STRIP)
										.flat()
										.map((logo, i) => (
											<div key={`${logo.label}-${copy}-${i}`} className="flex items-center gap-2.5 text-gray-300/80 whitespace-nowrap shrink-0">
												<Icon icon={logo.icon} className="w-4 h-4 text-[#7ea9ff]" />
												<span className="text-sm">{logo.label}</span>
											</div>
										))}
								</div>
							))}
						</div>
					</div>
				</div>
				</div>
			</section>

			<section
				id="features"
				ref={featuresReveal.ref as React.RefObject<HTMLElement>}
				className={`relative z-20 py-24 px-5 overflow-visible transition-all duration-700 ${featuresReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
			>
				<div className="max-w-6xl mx-auto overflow-visible">
					<div className="text-center mb-14">
						<p className="text-[#77a9ff] text-sm uppercase tracking-[0.2em] mb-2">The Platform</p>
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
							Everything you need to ship auth
							<br />
							in one place
						</h2>
						<p className="mt-3 text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
							Multi-tenant auth, edge deployment, and provider flexibility.
							Configure projects, themes, and providers from a single dashboard.
						</p>
						<a href="https://doc.openauthster.com/docs" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-[#8fb7ff] hover:text-white transition-colors">
							View docs <Icon icon="lucide:arrow-up-right" className="w-4 h-4" />
						</a>
					</div>

					<div className="relative -my-8 md:-my-12 py-8 md:py-12 overflow-visible">
						{/* Background: extends into adjacent sections, soft fade at edges */}
						<div
							className="absolute -inset-16 md:-inset-24 lg:-inset-32 pointer-events-none -z-10"
							style={{
								maskImage: "radial-gradient(ellipse 75% 60% at 50% 50%, black 20%, rgba(0,0,0,0.4) 55%, transparent 85%)",
								WebkitMaskImage: "radial-gradient(ellipse 75% 60% at 50% 50%, black 20%, rgba(0,0,0,0.4) 55%, transparent 85%)",
								background: [
									"linear-gradient(90deg, transparent 20%, rgba(47,91,255,0.15) 45%, rgba(255,255,255,0.06) 50%, rgba(47,91,255,0.15) 55%, transparent 80%)",
									"linear-gradient(85deg, transparent 35%, rgba(47,91,255,0.1) 50%, transparent 65%)",
									"linear-gradient(95deg, transparent 35%, rgba(47,91,255,0.1) 50%, transparent 65%)",
									"linear-gradient(0deg, transparent 45%, rgba(47,91,255,0.06) 50%, transparent 55%)",
									"linear-gradient(180deg, transparent 45%, rgba(47,91,255,0.06) 50%, transparent 55%)",
									"radial-gradient(ellipse 70% 25% at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(220,235,255,0.04) 30%, rgba(47,91,255,0.18) 60%, transparent 85%)",
									"radial-gradient(ellipse 80% 20% at 50% 50%, rgba(47,91,255,0.15) 0%, rgba(30,58,138,0.06) 55%, transparent 90%)",
								].join(", "),
							}}
						/>
						<div
							className="absolute -inset-16 md:-inset-24 lg:-inset-32 pointer-events-none -z-10 opacity-[0.02] mix-blend-soft-light"
							style={{
								maskImage: "radial-gradient(ellipse 75% 60% at 50% 50%, black 20%, rgba(0,0,0,0.4) 55%, transparent 85%)",
								WebkitMaskImage: "radial-gradient(ellipse 75% 60% at 50% 50%, black 20%, rgba(0,0,0,0.4) 55%, transparent 85%)",
								backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
								backgroundRepeat: "repeat",
							}}
						/>
						<div className="relative grid md:grid-cols-5 md:grid-rows-[1fr_1fr] md:min-h-[420px] gap-6 md:gap-8">
						{PLATFORM_FEATURES.map((feature, i) => (
							<div
								key={feature.title}
								className={`relative group flex flex-col min-h-0 h-full ${i === 0 ? "md:col-span-3" : i === 1 ? "md:col-span-2" : i === 2 ? "md:col-span-2" : "md:col-span-3"}`}
							>
								<div
									className="absolute -inset-4 -z-10 opacity-40 blur-2xl transition-opacity group-hover:opacity-60"
									style={{
										background: `radial-gradient(circle at ${i % 2 === 0 ? "30%" : "70%"} 50%, rgba(0,122,255,0.2) 0%, transparent 65%)`,
									}}
								/>
								<div className="relative flex flex-col flex-1 min-h-0 rounded-2xl border border-white/[0.12] bg-white/[0.03] backdrop-blur-sm p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]">
									<h3 className="text-white font-semibold text-lg mb-1.5 shrink-0">{feature.title}</h3>
									<p className="text-sm text-gray-500 mb-5 leading-relaxed shrink-0">{feature.description}</p>
									<div className="relative flex-1 min-h-[120px] rounded-xl border border-white/10 bg-black/30 p-4 flex items-center justify-center overflow-hidden">
										{feature.visual === "multi-project" && (
											<div className="w-full space-y-2">
												<div className="flex items-center gap-2">
													<div className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center gap-2">
														<Icon icon="lucide:folder" className="w-4 h-4 text-[#77a9ff]" />
														<span className="text-xs text-gray-400">Project: app.acme.com</span>
													</div>
													<button type="button" className="rounded-lg bg-[#007AFF] px-3 py-1.5 text-[10px] font-medium text-white">
														Switch
													</button>
												</div>
												<div className="grid grid-cols-2 gap-2">
													{["Client A", "Client B", "Client C", "Client D"].map((name) => (
														<div key={name} className="rounded-md bg-white/5 px-2 py-1.5 text-[10px] text-gray-400 truncate">
															{name}
														</div>
													))}
												</div>
											</div>
										)}
										{feature.visual === "security" && (
											<div className="w-full space-y-2">
												<div className="flex items-center gap-1.5 flex-nowrap min-w-0">
													<div className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 flex items-center justify-between gap-1">
														<span className="text-[10px] text-gray-400 truncate">TOTP</span>
														<span className="text-[9px] text-[#22c55e] shrink-0">On</span>
													</div>
													<div className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 flex items-center justify-between gap-1">
														<span className="text-[10px] text-gray-400 truncate">WebAuthn</span>
														<span className="text-[9px] text-[#22c55e] shrink-0">On</span>
													</div>
												</div>
												<div className="flex items-center gap-1.5">
													<Icon icon="lucide:shield-check" className="w-3.5 h-3.5 text-[#77a9ff] shrink-0" />
													<span className="text-[10px] text-gray-500 truncate">HMAC · Two-tier auth</span>
												</div>
											</div>
										)}
										{feature.visual === "edge" && (
											<div className="w-full space-y-2">
												<div className="flex items-center gap-2">
													<Icon icon="simple-icons:cloudflare" className="w-5 h-5 text-[#fca130]" />
													<span className="text-xs font-medium text-white">Workers + D1</span>
												</div>
												<div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center justify-between">
													<span className="text-[10px] text-gray-500">Median latency</span>
													<span className="text-[10px] font-medium text-[#22c55e]">&lt; 50ms</span>
												</div>
												<div className="h-1 rounded-full bg-white/10 overflow-hidden">
													<div className="h-full w-[80%] bg-gradient-to-r from-[#007AFF] to-[#49a0ff] rounded-full" />
												</div>
											</div>
										)}
										{feature.visual === "providers" && (
											<div className="w-full">
												<div className="flex flex-wrap gap-1.5 mb-2">
													{["Google", "GitHub", "OIDC", "Passkey"].map((p) => (
														<span key={p} className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-[10px] text-gray-400">
															{p}
														</span>
													))}
												</div>
												<div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center gap-2">
													<Icon icon="lucide:plus" className="w-3.5 h-3.5 text-[#77a9ff]" />
													<span className="text-[10px] text-gray-500">Add provider</span>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						))}
						</div>
					</div>
				</div>
			</section>

			<section
				id="how-it-works"
				ref={howItWorksReveal.ref as React.RefObject<HTMLElement>}
				className={`relative z-20 py-24 px-5 transition-all duration-700 ${howItWorksReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
			>
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-14">
						<p className="text-[#77a9ff] text-sm uppercase tracking-[0.2em] mb-2">How it works</p>
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
							Ship auth
							<br />
							in three simple steps
						</h2>
						<p className="mt-3 text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
							From project setup to production, OpenAuthster helps you configure providers,
							deploy at the edge, and integrate secure auth into your app.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-6 md:gap-8">
						{HOW_IT_WORKS.map((step) => (
							<div
								key={step.step}
								className="relative rounded-2xl border border-white/[0.12] bg-white/[0.03] backdrop-blur-sm p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] flex flex-col"
							>
								<div className="rounded-xl border border-white/10 bg-black/30 p-4 h-[140px] flex items-center justify-center mb-5 overflow-hidden">
									{step.visual === "setup" && (
										<div className="w-full space-y-2">
											<div className="flex items-center gap-2">
												<div className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center gap-2">
													<Icon icon="lucide:folder-plus" className="w-4 h-4 text-[#77a9ff]" />
													<span className="text-[10px] text-gray-400">New project</span>
												</div>
												<Icon icon="lucide:plus" className="w-4 h-4 text-[#77a9ff]" />
											</div>
											<div className="flex gap-1.5">
												{["Google", "OIDC", "Password"].map((p) => (
													<span key={p} className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-gray-500">{p}</span>
												))}
											</div>
										</div>
									)}
									{step.visual === "deploy" && (
										<div className="w-full space-y-2">
											<div className="flex items-center gap-2">
												<Icon icon="simple-icons:cloudflare" className="w-6 h-6 text-[#fca130]" />
												<span className="text-xs font-medium text-white">Workers + D1</span>
											</div>
											<div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center justify-between">
												<span className="text-[10px] text-gray-500">Deploy</span>
												<Icon icon="lucide:check" className="w-3.5 h-3.5 text-[#22c55e]" />
											</div>
										</div>
									)}
									{step.visual === "integrate" && (
										<div className="w-full space-y-2">
											<div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center gap-2">
												<Icon icon="lucide:code-2" className="w-4 h-4 text-[#77a9ff]" />
												<span className="text-[10px] text-gray-400">openauthster-shared</span>
											</div>
											<div className="flex items-center gap-1.5 text-[10px] text-gray-500">
												<Icon icon="lucide:plug" className="w-3.5 h-3.5" />
												<span>Connect SDK</span>
											</div>
										</div>
									)}
								</div>
								<div className="flex items-center gap-2 mb-2">
									<span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-xs font-medium text-gray-400">
										{step.step}
									</span>
									<h3 className="text-white font-semibold text-base">{step.title}</h3>
								</div>
								<p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section
				id="testimonials"
				ref={testimonialReveal.ref as React.RefObject<HTMLElement>}
				className={`relative z-20 py-24 px-5 overflow-visible transition-all duration-700 ${testimonialReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
			>
				<div className="max-w-5xl mx-auto">
					<div className="relative -mx-6 sm:-mx-12 md:-mx-16 rounded-2xl overflow-hidden">
						{/* Background image : couvre titre + cartes, s'arrête au niveau des flèches */}
						<div
							className="absolute inset-0 bg-no-repeat bg-cover"
							style={{
								backgroundImage: "url(/static/testimonials-bg.png)",
								backgroundPosition: "center 85%",
								maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
								WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
							}}
						/>
						<div
							className="absolute inset-0 bg-black/25 pointer-events-none"
							style={{
								maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
								WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
							}}
							aria-hidden={true}
						/>

						{/* Titre et sous-titre */}
						<div className="relative z-10 text-center pt-12 pb-6 px-4">
							<p className="text-[#77a9ff] text-sm uppercase tracking-widest mb-2">User Voices</p>
							<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
								How teams use OpenAuthster
								<br />
								to ship auth faster
							</h2>
							<p className="mt-3 text-sm md:text-base text-gray-500 max-w-xl mx-auto">
								Developers and teams building secure, multi-tenant authentication on the edge.
							</p>
						</div>

						{/* Zone cartes */}
						<div className="relative z-10 py-8 px-4 sm:px-6 pb-0">
							<div className="flex items-center justify-center gap-3 md:gap-6 px-2">
								{[-1, 0, 1].map((offset) => {
									const idx = (testimonialIndex + offset + TESTIMONIALS.length) % TESTIMONIALS.length;
									const t = TESTIMONIALS[idx]!;
									const isActive = offset === 0;
									const slideFrom: Record<number, number> | null =
										carouselDirection === "right"
											? { [-1]: 80, [0]: 100, [1]: 180 }
											: carouselDirection === "left"
												? { [-1]: -180, [0]: -100, [1]: -80 }
												: null;
									const translateX = slideFrom ? slideFrom[offset] ?? 0 : 0;
									return (
										<div
											key={`${idx}-${offset}`}
											className={`flex-shrink-0 transition-all duration-500 ease-out ${
												isActive
													? "w-full max-w-md z-10 opacity-100 scale-100"
													: "hidden md:block w-64 lg:w-72 opacity-75 scale-90 blur-[2px] pointer-events-none"
											}`}
											style={{ transform: `translateX(${translateX}px)` }}
										>
											<div
												className={`relative rounded-2xl border overflow-hidden ${
													isActive
														? "border-white/20 bg-white/[0.06] backdrop-blur-xl shadow-[0_0_40px_rgba(0,122,255,0.12)]"
														: "border-white/15 bg-white/[0.05] backdrop-blur-sm"
												}`}
											>
												{isActive && (
													<div
														className="absolute inset-0 pointer-events-none"
														style={{
															background: "linear-gradient(to top, rgba(0,122,255,0.18) 0%, transparent 55%)",
														}}
													/>
												)}
												<div className="relative px-6 py-8 md:px-8 md:py-10 min-h-[220px] flex flex-col justify-between">
													<p className={`text-base md:text-lg leading-relaxed ${isActive ? "text-white" : "text-gray-300"}`}>
														"{t.quote}"
													</p>
													<div className="mt-6 flex items-center gap-3">
															<div
																className={`shrink-0 flex items-center justify-center ${
																	isActive ? "w-12 h-12 rounded-xl bg-[#007AFF]/25" : "w-10 h-10 rounded-lg bg-white/15"
																}`}
															>
																<Icon icon="lucide:user-round" className={`w-6 h-6 ${isActive ? "text-[#8eb9ff]" : "text-gray-400"}`} />
														</div>
														<div>
															<p className={`font-semibold ${isActive ? "text-white" : "text-gray-300"}`}>{t.author}</p>
															<p className={`text-xs ${isActive ? "text-gray-500" : "text-gray-400"}`}>{t.role}</p>
														</div>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* Zone navigation */}
						<div className="relative z-10 flex items-center justify-center gap-4 pt-10 pb-16 px-4">
							<button
								type="button"
								onClick={() => goToTestimonial(-1)}
								className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all"
							>
								<Icon icon="lucide:chevron-left" className="w-5 h-5" />
							</button>
							<span className="text-sm font-medium text-white tabular-nums">
								{testimonialIndex + 1} / {TESTIMONIALS.length}
							</span>
							<button
								type="button"
								onClick={() => goToTestimonial(1)}
								className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all"
							>
								<Icon icon="lucide:chevron-right" className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</section>

			<section
				id="pricing"
				ref={pricingReveal.ref as React.RefObject<HTMLElement>}
				className={`relative z-20 py-20 px-5 transition-all duration-700 ${pricingReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
			>
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12">
						<p className="text-[#77a9ff] text-sm uppercase tracking-wider mb-2">Choose your plan</p>
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight">
							Simple pricing for
							<br />
							authentication infrastructure
						</h2>
						<p className="mt-3 text-sm md:text-base text-gray-400 max-w-2xl mx-auto">
							Start for free, then scale as your projects and tenants grow.
							Plans designed for teams shipping secure auth.
						</p>
						<div className="mt-6">
							<button
								type="button"
								onClick={() => setYearly((prev) => !prev)}
								className="inline-flex items-center rounded-lg bg-white/5 border border-white/10 p-1"
							>
								<span className={`px-5 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${!yearly ? "bg-[#0f48a8] text-white" : "text-gray-400"}`}>
									Monthly
								</span>
								<span className={`px-5 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${yearly ? "bg-[#0f48a8] text-white" : "text-gray-400"}`}>
									Yearly
								</span>
							</button>
						</div>
					</div>

					<div className="relative">
						<div
							className="hidden lg:block absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px pointer-events-none"
							style={{
								background: "linear-gradient(90deg, transparent 0%, rgba(0,122,255,0.85) 50%, transparent 100%)",
							}}
						/>
						<div
							className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[620px] h-28 pointer-events-none blur-2xl"
							style={{
								background: "radial-gradient(circle, rgba(0,122,255,0.78) 0%, transparent 72%)",
							}}
						/>

						<div className="grid lg:grid-cols-3 gap-6 items-end">
							{PRICING_PLANS.map((plan) => {
								const isContact = plan.cta === "Contact Team";
								const monthlyPrice = yearly ? plan.price.yearly : plan.price.monthly;
								const accent = plan.popular;

								return (
									<div
										key={plan.name}
										className={`relative rounded-2xl border transition-all duration-300 flex flex-col ${
											accent
												? "z-20 lg:-mt-3 lg:mb-0 lg:min-h-[400px] border-[#3e7be0] bg-[#0b1a38]/95 shadow-[0_0_90px_rgba(0,122,255,0.3)] px-7 pt-7 pb-8 lg:px-8 lg:pt-8 lg:pb-9"
												: "z-10 border-white/12 bg-[#07090f]/85 px-6 py-6 min-h-[360px]"
										}`}
									>
										{accent && (
											<div
												className="pointer-events-none absolute -inset-x-12 -inset-y-12 -z-10 blur-3xl opacity-95"
												style={{
													background:
														"radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,122,255,0.5) 0%, rgba(0,122,255,0.15) 40%, transparent 75%)",
												}}
											/>
										)}
										{accent && (
											<div
												className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
												style={{
													backgroundImage:
														"linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
													backgroundSize: "20px 20px",
												}}
											/>
										)}
										{accent && (
											<span className="absolute top-5 right-5 px-3 py-1.5 rounded-full bg-[#2c6fe4] text-[11px] font-medium text-white shadow-[0_0_20px_rgba(47,116,255,0.5)]">
												Popular
											</span>
										)}
										<div className={`${accent ? "mb-7" : "mb-5"}`}>
											<p className={`text-white font-semibold tracking-tight ${accent ? "text-4xl" : "text-3xl"}`}>{plan.name}</p>
											<p className="text-gray-400 text-sm mt-2 max-w-xs">{plan.description}</p>
										</div>

										<div className={`flex items-end gap-1.5 ${accent ? "mb-7" : "mb-5"}`}>
											<span className={`font-semibold text-white leading-none ${accent ? "text-6xl" : "text-5xl"}`}>${monthlyPrice}</span>
											<span className="text-gray-500 text-sm mb-1.5">/ month</span>
											{accent && (
												<span className="ml-2 px-2.5 py-1 rounded-full bg-[#2f64cc] text-[11px] font-medium text-white">-20%</span>
											)}
										</div>

										<div className={`${accent ? "mb-6" : "mb-4"}`}>
											{isContact ? (
												<a
													href="https://github.com/shpaw415/openauthster/discussions"
													target="_blank"
													rel="noreferrer"
													className={`w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 inline-flex items-center justify-center gap-2 ${
														accent
															? "bg-[#007AFF] text-white hover:bg-[#0066dd] shadow-[0_0_24px_rgba(0,122,255,0.4)]"
															: "bg-white/5 text-white border border-white/15 hover:bg-white/10"
													}`}
												>
													{plan.cta} <Icon icon="lucide:arrow-right" className="w-4 h-4" />
												</a>
											) : (
												<CTAButton
													auth={auth}
													className={`w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 inline-flex items-center justify-center gap-2 ${
														accent
															? "bg-[#007AFF] text-white hover:bg-[#0066dd] shadow-[0_0_24px_rgba(0,122,255,0.4)]"
															: "bg-white/5 text-white border border-white/15 hover:bg-white/10"
													}`}
												>
													{plan.cta} <Icon icon="lucide:arrow-right" className="w-4 h-4" />
												</CTAButton>
											)}
										</div>

										<p className="text-xs text-gray-500 mb-3">What's included</p>
										<ul className={`space-y-3 flex-1 ${accent ? "min-h-[140px]" : ""}`}>
											{plan.features.map((feature) => (
												<li key={feature} className="flex items-start gap-3 text-sm">
													{accent ? (
														<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3e7be0]">
															<Icon icon="lucide:check" className="w-3 h-3 text-white" />
														</span>
													) : (
														<Icon icon="lucide:circle-check" className="w-5 h-5 mt-0.5 shrink-0 text-gray-500" />
													)}
													<span className={accent ? "text-gray-200" : "text-gray-400"}>{feature}</span>
												</li>
											))}
										</ul>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			<footer className="relative z-20 py-20 px-5 border-t border-white/6">
				<div className="max-w-6xl mx-auto relative">
					<p className="absolute inset-0 flex items-end justify-center pb-4 text-[84px] md:text-[140px] font-black text-white/[0.03] select-none pointer-events-none">
						OpenAuthster
					</p>
					<div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
						<div className="lg:col-span-1">
							<a href="/" className="inline-flex items-center gap-2 mb-3">
								<img src={Logo.src(320)} alt="OpenAuthster" className="w-7 h-7" />
								<span className="text-white font-semibold">OpenAuthster</span>
							</a>
							<p className="text-sm text-gray-500 max-w-xs">Multi-tenant auth management with a modern Web UI powered by Cloudflare edge.</p>
							<div className="flex items-center gap-2 mt-4">
								<a href="https://github.com/shpaw415/openauthster" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-colors">
									<Icon icon="simple-icons:github" className="w-4 h-4" />
								</a>
								<a href="https://doc.openauthster.com/" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-colors">
									<Icon icon="lucide:book-open" className="w-4 h-4" />
								</a>
							</div>
						</div>
						{Object.entries(FOOTER_LINKS).map(([group, links]) => (
							<div key={group}>
								<h4 className="text-white font-medium text-sm mb-2.5">{group}</h4>
								<ul className="space-y-2">
									{links.map((link) => (
										<li key={link.label}>
											<a
												href={link.href}
												target={link.external ? "_blank" : undefined}
												rel={link.external ? "noreferrer" : undefined}
												className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
											>
												{link.icon && <Icon icon={link.icon} className="w-4 h-4" />}
												{link.label}
											</a>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
					<div className="relative mt-8 pt-4 border-t border-white/6 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
						<span>OpenAuthster © {new Date().getFullYear()}</span>
						<span>Created by M2Tech Solutions</span>
					</div>
				</div>
			</footer>
		</div>
	);
}
