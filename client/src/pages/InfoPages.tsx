import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHero, PageShell } from "@/components/PageShell";
import { trpc } from "@/lib/trpc";
import { CORE_VALUES, SCHOOL_FAQ, SCHOOL_FORMATS, SCHOOL_PROCESS, TEAM } from "@shared/content";
import { ArrowRight, Award, BookOpenCheck, CheckCircle2, ChevronRight, ClipboardCheck, Handshake, HeartHandshake, Lightbulb, Mail, MapPin, MessageSquare, Microscope, Rocket, Send, ShieldCheck, UsersRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export function SchoolsPage() {
  const [selected, setSelected] = useState(0);
  return (
    <PageShell>
      <PageHero eyebrow="Polaris for schools" title={<>Turn a classroom into a <span className="brand-gradient-text">working lab.</span></>} description="Hands-on aerospace, astronomy, and computational science workshops for Grades 6–12. We align with your timetable, bring the materials and guide students toward a concrete scientific result." />
      <section className="container px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]"><div><p className="eyebrow">Formats</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-foreground">Select the model that best fits your students.</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Every format can be tuned from observational astronomy to advanced numerical physics.</p><div className="mt-6 space-y-2">{SCHOOL_FORMATS.map((format, index) => <button key={format.title} type="button" onClick={() => setSelected(index)} className={`press w-full rounded-xl border p-4 text-left transition-colors ${selected === index ? "border-primary/50 bg-primary/10" : "border-border bg-card hover:border-primary/35 hover:bg-primary/5"}`}><span className="font-mono text-[0.56rem] text-primary">{String(index + 1).padStart(2, "0")}</span><span className="ml-2 text-sm font-semibold text-foreground">{format.title}</span></button>)}</div></div><div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 sm:p-8"><div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl" /><div className="relative"><span className="rounded-full bg-gold/12 px-2.5 py-1 font-mono text-[0.57rem] uppercase tracking-[0.09em] text-gold">{SCHOOL_FORMATS[selected].duration}</span><h3 className="mt-6 font-display text-4xl font-bold tracking-[-0.045em] text-foreground">{SCHOOL_FORMATS[selected].title}</h3><p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground">{SCHOOL_FORMATS[selected].description}</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{[{ icon: Rocket, value: "Project-first", label: "Applied science" }, { icon: UsersRound, value: "Grades 6–12", label: "Flexible depth" }, { icon: Award, value: "Verified", label: "Certificates" }].map(({ icon: Icon, value, label }) => <div key={value} className="rounded-xl border border-border bg-secondary/35 p-4"><Icon className="h-4 w-4 text-primary" /><p className="mt-3 font-mono text-[0.65rem] font-semibold text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</div><a href="#inquiry" className="press mt-8 inline-flex items-center gap-2 rounded-full bg-[image:var(--grad-brand)] px-5 py-3 font-mono text-[0.65rem] font-semibold text-[#0a0810]">Request a school program <ArrowRight className="h-3.5 w-3.5" /></a></div></div></div></section>
      <section className="border-y border-border bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-20"><div className="container"><p className="eyebrow">Process</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-foreground">Four calm steps from inquiry to impact.</h2><div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{SCHOOL_PROCESS.map(step => <div key={step.step} className="rounded-2xl border border-border bg-card p-5"><span className="font-mono text-[0.7rem] text-primary">{step.step}</span><h3 className="mt-6 font-display text-2xl font-bold text-foreground">{step.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{step.detail}</p></div>)}</div></div></section>
      <section id="inquiry" className="container px-4 py-16 sm:px-6 sm:py-20"><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="eyebrow">Inquiry form</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-foreground">Bring Polaris to your school.</h2><p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">Share your student group, preferred topic and timing. Our academic outreach team uses this information to propose the right format.</p><div className="mt-7 flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/6 p-4"><ShieldCheck className="h-5 w-5 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">School inquiries are stored securely and only used to coordinate your requested program.</p></div></div><InquiryForm kind="school" /></div></section>
      <section className="border-t border-border bg-[var(--surface)] px-4 py-16 sm:px-6"><div className="container grid gap-8 lg:grid-cols-[0.68fr_1.32fr]"><div><p className="eyebrow">Frequently asked questions</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-foreground">Planning clarity, upfront.</h2></div><Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-5">{SCHOOL_FAQ.map((item, index) => <AccordionItem key={item.question} value={`faq-${index}`}><AccordionTrigger className="font-display text-lg font-bold text-foreground hover:no-underline">{item.question}</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">{item.answer}</AccordionContent></AccordionItem>)}</Accordion></div></section>
    </PageShell>
  );
}

export function AboutPage() {
  const principles = [
    ["Be respectful", "Value every peer's perspective and support an inclusive environment."],
    ["Take ownership", "Own assigned initiatives from start to finish with proactive initiative."],
    ["Communicate professionally", "Maintain transparent, clear, and prompt communication."],
    ["Meet deadlines", "Respect team timelines and deliverables with high consistency."],
    ["Be open to feedback", "Embrace constructive reviews as opportunities for rapid growth."],
    ["Support fellow members", "Collaborate, share knowledge, and lift others up as you grow."],
    ["Continuously learn", "Stay curious, experiment fearlessly, and improve every day."],
  ];
  return (
    <PageShell>
      <PageHero eyebrow="The Polaris Story" title={<>Education should not end at <span className="brand-gradient-text">memorizing the textbook.</span></>} description="Project Polaris is a student engineering ecosystem bridging traditional education and real-world skills through interactive simulations, research cohorts, and collaborative build squads." />
      <section className="container px-4 py-16 sm:px-6 sm:py-20"><div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]"><div><p className="eyebrow">The provocation</p><h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-foreground">What if education wasn&apos;t just about memorizing?</h2></div><div><p className="text-lg leading-9 text-muted-foreground">Millions of students solve theoretical problems for grades every semester, yet rarely configure a CFD mesh, calculate orbital transfer burns, or defend technical research in front of practicing aerospace engineers.</p><p className="mt-5 text-lg leading-9 text-foreground">Project Polaris bridges that gap through student-led build cohorts—places where theory meets a public, inspectable result.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{["Build authentic physics & software systems", "Present research in front of peers and engineers", "Meet scientists and propulsion innovators", "Conduct verified, peer-reviewed experiments", "Turn textbook theory into public platforms", "Learn through deliberate collaboration"].map(item => <div key={item} className="flex gap-2 rounded-xl border border-border bg-card p-3.5 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{item}</div>)}</div></div></div></section>
      <section className="border-y border-border bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-20"><div className="container"><p className="eyebrow">Operating architecture</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-foreground">Three principles that keep the ecosystem moving.</h2><div className="mt-9 grid gap-4 md:grid-cols-3">{[{ code: "BUILD", icon: Rocket, title: "Engineering Core", detail: "Build authentic physics simulations, astronomical databases, data pipelines, and computational aerospace models with verifiable code." }, { code: "LEARN", icon: BookOpenCheck, title: "Cohorts & Mentors", detail: "Learn on demand through mentor office hours, scientist masterclasses, peer code reviews, and structured problem roadmaps." }, { code: "CONNECT", icon: HeartHandshake, title: "Sprint Teams", detail: "Collaborate in small squads of 3–5 builders. Tackle open challenges, conduct research, and ship together." }].map(({ code, icon: Icon, title, detail }) => <article key={code} className="rounded-2xl border border-border bg-card p-6"><span className="font-mono text-[0.64rem] tracking-[0.1em] text-primary">{code}</span><Icon className="mt-6 h-6 w-6 text-gold" /><h3 className="mt-5 font-display text-2xl font-bold text-foreground">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{detail}</p></article>)}</div></div></section>
      <section className="container px-4 py-16 sm:px-6 sm:py-20"><div className="text-center"><p className="eyebrow">Student-led ecosystem</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-foreground">Behind Project Polaris</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Founded and led by students who believe in open computational tools, reproducible science, and peer-to-peer building.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{TEAM.map((member, index) => <article key={member.role} className="relative overflow-hidden rounded-2xl border border-border bg-card p-5"><span className="absolute right-4 top-4 font-mono text-[0.62rem] text-primary/50">P{String(index + 1).padStart(2, "0")}</span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">P</span><p className="mt-5 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-gold">Polaris Core Member</p><h3 className="mt-2 font-display text-2xl font-bold text-foreground">{member.role}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{member.description}</p></article>)}</div></section>
      <section className="border-y border-border bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-20"><div className="container grid gap-8 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="eyebrow">Operating principles</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-foreground">Professional standards. High empathy.</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Every volunteer, associate, and core team member operates with care for the work and the people doing it.</p></div><div className="grid gap-2 sm:grid-cols-2">{principles.map(([title, detail]) => <div key={title} className="rounded-xl border border-border bg-card p-4"><p className="font-medium text-foreground">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></div>)}</div></div></section>
      <section className="container px-4 py-16 sm:px-6 sm:py-20"><div className="flex flex-col gap-5 rounded-3xl border border-primary/20 bg-[image:var(--grad-brand-soft)] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9"><div><p className="eyebrow">Build with us</p><h2 className="mt-3 font-display text-3xl font-bold text-foreground">Ready to turn curiosity into a contribution?</h2></div><Link href="/pricing" className="press inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-mono text-[0.65rem] font-semibold text-primary-foreground">Explore pathways <ArrowRight className="h-3.5 w-3.5" /></Link></div></section>
    </PageShell>
  );
}

export function ContactPage() {
  return <PageShell><PageHero eyebrow="Contact Project Polaris" title={<>Start a conversation that <span className="brand-gradient-text">builds something.</span></>} description="Whether you are a student, mentor, school coordinator, or collaborator, reach out with enough context for our team to route your message responsibly." align="center" /><section className="container px-4 py-16 sm:px-6 sm:py-20"><div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr]"><div><p className="eyebrow">Contact channels</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-foreground">Tell us what you want to build.</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Use the form for programs, partnerships, technical questions or platform feedback. Community discussions are best for learning questions and peer collaboration.</p><div className="mt-8 space-y-3">{[{ icon: MessageSquare, label: "Student community", value: "Ask, share and collaborate" }, { icon: Handshake, label: "Schools & institutions", value: "Programs, labs and curriculum alignment" }, { icon: Microscope, label: "Technical collaboration", value: "Research, code and simulations" }].map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"><Icon className="h-4 w-4 text-primary" /><div><p className="text-sm font-medium text-foreground">{label}</p><p className="mt-0.5 text-xs text-muted-foreground">{value}</p></div></div>)}</div></div><InquiryForm kind="contact" /></div></section></PageShell>;
}

function InquiryForm({ kind }: { kind: "school" | "contact" }) {
  const [status, setStatus] = useState<"idle" | "submitted">("idle");
  const createInquiry = trpc.inquiry.create.useMutation({
    onSuccess: () => {
      setStatus("submitted");
      toast.success(kind === "school" ? "School inquiry received" : "Inquiry received", {
        description: "Thank you—our team will review the details and respond by email.",
      });
    },
    onError: error => {
      toast.error("We could not send your inquiry", {
        description: error.message || "Please check your connection and try again.",
      });
    },
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    createInquiry.mutate(
      {
        kind,
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        organisation: String(data.get("organisation") ?? ""),
        topic: String(data.get("topic") ?? ""),
        message: String(data.get("message") ?? ""),
      },
      { onSuccess: () => form.reset() }
    );
  };
  return <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="grid gap-4 sm:grid-cols-2"><Field label="Your name" name="name" placeholder="Full name" required /><Field label="Email address" name="email" type="email" placeholder="you@example.com" required /><Field label={kind === "school" ? "School / organization" : "Organization (optional)"} name="organisation" placeholder={kind === "school" ? "School name" : "Organization or team"} /><Field label="Topic" name="topic" placeholder={kind === "school" ? "Workshop, camp, space club..." : "Partnership, research, support..."} /></div><label className="mt-4 block"><span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground">How can we help?</span><textarea name="message" required minLength={10} rows={6} placeholder="Share enough context for us to point you to the right next step." className="mt-2.5 w-full resize-y rounded-xl border border-border bg-secondary/35 px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></label><button type="submit" disabled={createInquiry.isPending || status === "submitted"} className="press mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-mono text-[0.64rem] font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-70"><Send className="h-3.5 w-3.5" />{createInquiry.isPending ? "Sending inquiry…" : status === "submitted" ? "Inquiry sent" : "Send inquiry"}</button><p className="mt-3 text-xs leading-5 text-muted-foreground">By sending, you agree that Project Polaris may use this information solely to respond to your request. See our <Link href="/privacy" className="text-primary hover:text-gold">Privacy Policy</Link>.</p></form>;
}

function Field({ label, name, type = "text", placeholder, required = false }: { label: string; name: string; type?: string; placeholder: string; required?: boolean }) {
  return <label className="block"><span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground">{label}{required && <span className="text-primary"> *</span>}</span><input name={name} type={type} required={required} placeholder={placeholder} className="mt-2.5 h-11 w-full rounded-xl border border-border bg-secondary/35 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></label>;
}

const policies = {
  privacy: {
    eyebrow: "Privacy policy",
    title: "Your learning record is yours.",
    description: "This policy explains what Project Polaris collects, why we collect it, and the choices you have over your account, subscription, and learning activity.",
    sections: [
      ["Information we collect", "We collect the account information you provide, including your name and email address; subscription transaction identifiers supplied by Razorpay; and the learning activity needed to deliver the workspace, such as saved AeroForge trials, enrollments and certificates."],
      ["How we use information", "We use your information to authenticate your session, provide subscriptions and gated learning access, preserve your saved simulations, issue verified certificates, and respond to enquiries. We do not sell personal information."],
      ["Payments", "Payments are processed only through Razorpay. Project Polaris stores payment references and subscription status, not card, UPI PIN, or bank credential data. Razorpay's own privacy practices apply to payment processing."],
      ["Cookies & security", "Authentication is stored in secure, httpOnly JWT cookies. We do not store session tokens in localStorage. Reasonable technical safeguards are used to protect user data and payment webhooks."],
      ["Your choices", "You may request account-data access, correction, deletion, or cancellation of an active subscription through the contact route. Deleting an account may remove saved trials, enrolments, and workspace history that are not required for financial recordkeeping."],
    ],
  },
  terms: {
    eyebrow: "Terms & conditions",
    title: "Clear terms for a serious learning space.",
    description: "These terms govern access to Project Polaris, the AeroForge simulation environment, membership plans, community participation, and payments through Razorpay.",
    sections: [
      ["Platform use", "Project Polaris provides educational tools, learning content, and engineering simulations. AeroForge outputs are reduced-order educational estimates and must not be used as the sole basis for flight, safety, medical, financial, or other high-consequence decisions."],
      ["Accounts", "You are responsible for maintaining the confidentiality of your account access and for providing accurate registration information. You must not share accounts, attempt to bypass membership gates, or interfere with platform security."],
      ["Memberships & billing", "Explorer is free. Builder, Builder Annual, and Squad Pro are paid memberships in INR and are processed through Razorpay. Benefits remain available for the paid period shown in your workspace, subject to successful payment verification."],
      ["Cancellations", "You may request cancellation through your workspace once subscriptions are enabled. Cancellation prevents renewal where applicable; completed billing periods and fulfilled digital access are handled according to the refund policy presented at checkout and applicable law."],
      ["Community standards", "Treat peers and mentors with respect; publish original work or credit sources; do not submit malicious code, plagiarize research, or misrepresent verification. We may limit access for material breaches of these standards."],
    ],
  },
};

export function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const policy = policies[type];
  return <PageShell><PageHero eyebrow={policy.eyebrow} title={policy.title} description={policy.description} /><section className="container px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 sm:p-9"><p className="font-mono text-[0.59rem] uppercase tracking-[0.1em] text-primary">Effective date: August 20, 2026</p><div className="mt-8 space-y-8">{policy.sections.map(([heading, body], index) => <section key={heading}><div className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-[0.55rem] text-primary">{index + 1}</span><h2 className="font-display text-2xl font-bold text-foreground">{heading}</h2></div><p className="mt-3 pl-9 text-sm leading-7 text-muted-foreground">{body}</p></section>)}</div><div className="mt-10 rounded-2xl border border-primary/15 bg-primary/6 p-4"><p className="text-sm leading-6 text-muted-foreground">Questions about this policy? Use the <Link href="/contact" className="text-primary hover:text-gold">contact form</Link> and choose the topic that best describes your request.</p></div></div></section></PageShell>;
}
