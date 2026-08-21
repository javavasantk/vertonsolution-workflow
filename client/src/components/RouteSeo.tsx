import { useEffect } from "react";
import { useLocation } from "wouter";

type Metadata = { title: string; description: string; keywords: string; indexable?: boolean };

const DEFAULT: Metadata = {
  title: "Project Polaris — Experiential Learning Platform",
  description: "Hands-on aerospace learning, engineering projects, and the AeroForge simulation laboratory.",
  keywords: "aerospace education, aerospace engineering courses, science learning platform, computational physics, engineering projects",
};

export const PRIMARY_SEO_ORIGIN = "https://projectpolaris.live";

const ROUTE_METADATA: Record<string, Metadata> = {
  "/": DEFAULT,
  "/courses": { title: "Aerospace Engineering Courses | Project Polaris", description: "Explore hands-on aerospace, astronomy, physics, engineering, programming, and AI learning experiences.", keywords: "aerospace engineering courses, science courses, STEM learning, computational physics" },
  "/projects": { title: "Aerospace Engineering Projects & Build Squads | Project Polaris", description: "Collaborate on practical aerospace and engineering build squads with Project Polaris.", keywords: "aerospace engineering projects, student engineering projects, build squads" },
  "/aeroforge": { title: "AeroForge Aerospace Simulation Lab | Project Polaris", description: "Explore analytical aerospace challenges with the AeroForge engineering simulation laboratory.", keywords: "aerospace simulation, airfoil simulation, computational physics, engineering simulation, AeroForge" },
  "/pricing": { title: "Aerospace Learning Membership Plans | Project Polaris", description: "Compare Explorer, Builder, Builder Annual, and Squad Pro learning memberships.", keywords: "aerospace education membership, engineering learning plans, STEM courses" },
  "/programs": { title: "STEM Programs & Engineering Cohorts | Project Polaris", description: "Discover Project Polaris workshops, mini-courses, bootcamps, and engineering programs.", keywords: "STEM programs, engineering bootcamps, aerospace workshops" },
  "/showcase": { title: "Student Engineering Showcase | Project Polaris", description: "Explore public engineering artifacts and learning outcomes from the Project Polaris community.", keywords: "student engineering projects, aerospace showcase, STEM portfolio" },
  "/research": { title: "Aerospace & Engineering Research | Project Polaris", description: "Read accessible technical research and learning notes from Project Polaris.", keywords: "aerospace research, engineering research, computational physics notes" },
  "/resources": { title: "Free Aerospace & Engineering Learning Resources | Project Polaris", description: "Access public primers, guides, and tools for aerospace and engineering learning.", keywords: "aerospace learning resources, engineering guides, physics primers" },
  "/schools": { title: "Aerospace STEM Programs for Schools | Project Polaris", description: "Bring experiential science and engineering learning to your school with Project Polaris.", keywords: "STEM programs for schools, aerospace education for students, engineering workshops" },
  "/about": { title: "About Project Polaris Aerospace Education", description: "Learn about Project Polaris and its approach to evidence-based science and engineering learning.", keywords: "about Project Polaris, aerospace education, engineering learning platform" },
  "/contact": { title: "Contact Project Polaris Aerospace Education", description: "Contact the Project Polaris team about learning programs, schools, and aerospace education.", keywords: "contact aerospace education, STEM programs, engineering workshops" },
  "/privacy": { title: "Privacy Policy | Project Polaris", description: "Read the Project Polaris privacy policy.", keywords: "Project Polaris privacy", indexable: false },
  "/terms": { title: "Terms & Conditions | Project Polaris", description: "Read the Project Polaris terms and conditions.", keywords: "Project Polaris terms", indexable: false },
  "/auth": { title: "Sign In | Project Polaris", description: "Sign in or create a Project Polaris learning account.", keywords: "Project Polaris sign in", indexable: false },
  "/portal": { title: "Student Workspace | Project Polaris", description: "Private Project Polaris learner workspace.", keywords: "Project Polaris student workspace", indexable: false },
};

export function getRouteMetadata(location: string): Metadata {
  return ROUTE_METADATA[location] ?? { title: "Page Not Found | Project Polaris", description: "The requested Project Polaris page could not be found.", keywords: "Project Polaris", indexable: false };
}

function upsertJsonLd(id: string, data: unknown) {
  let element = document.head.querySelector<HTMLScriptElement>(`script#${id}`);
  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.id = id;
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

export function getCanonicalUrl(location: string) {
  return `${PRIMARY_SEO_ORIGIN}${location === "/" ? "/" : location}`;
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

export default function RouteSeo() {
  const [location] = useLocation();

  useEffect(() => {
    const metadata = getRouteMetadata(location);
    const indexable = metadata.indexable !== false;
    const canonicalUrl = getCanonicalUrl(location);
    document.title = metadata.title;
    upsertMeta('meta[name="description"]', { name: "description", content: metadata.description });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: metadata.keywords });
    upsertMeta('meta[name="robots"]', { name: "robots", content: indexable ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" : "noindex,nofollow,noarchive" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: metadata.title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: metadata.description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: metadata.title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: metadata.description });
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
    if (indexable) {
      upsertJsonLd("polaris-route-schema", {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        isPartOf: { "@id": `${PRIMARY_SEO_ORIGIN}/#website` },
        about: { "@id": `${PRIMARY_SEO_ORIGIN}/#organization` },
        inLanguage: "en",
      });
    }
  }, [location]);

  return null;
}
