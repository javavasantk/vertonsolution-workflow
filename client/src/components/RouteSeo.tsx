import { useEffect } from "react";
import { useLocation } from "wouter";

type Metadata = { title: string; description: string; indexable?: boolean };

const DEFAULT: Metadata = {
  title: "Project Polaris — Experiential Learning Platform",
  description: "Hands-on aerospace learning, engineering projects, and the AeroForge simulation laboratory.",
};

const ROUTE_METADATA: Record<string, Metadata> = {
  "/": DEFAULT,
  "/courses": { title: "Courses | Project Polaris", description: "Explore hands-on aerospace, astronomy, physics, engineering, programming, and AI learning experiences." },
  "/projects": { title: "Build Squads | Project Polaris", description: "Collaborate on practical aerospace and engineering build squads with Project Polaris." },
  "/aeroforge": { title: "AeroForge Simulation Lab | Project Polaris", description: "Explore analytical aerospace challenges with the AeroForge engineering simulation laboratory." },
  "/pricing": { title: "Membership Plans | Project Polaris", description: "Compare Explorer, Builder, Builder Annual, and Squad Pro learning memberships." },
  "/programs": { title: "Programs & Cohorts | Project Polaris", description: "Discover Project Polaris workshops, mini-courses, bootcamps, and engineering programs." },
  "/showcase": { title: "Student Showcase | Project Polaris", description: "Explore public engineering artifacts and learning outcomes from the Project Polaris community." },
  "/research": { title: "Technical Research | Project Polaris", description: "Read accessible technical research and learning notes from Project Polaris." },
  "/resources": { title: "Learning Resources | Project Polaris", description: "Access public primers, guides, and tools for aerospace and engineering learning." },
  "/schools": { title: "For Schools | Project Polaris", description: "Bring experiential science and engineering learning to your school with Project Polaris." },
  "/about": { title: "About Project Polaris", description: "Learn about Project Polaris and its approach to evidence-based science and engineering learning." },
  "/contact": { title: "Contact Project Polaris", description: "Contact the Project Polaris team about learning programs, schools, and aerospace education." },
  "/privacy": { title: "Privacy Policy | Project Polaris", description: "Read the Project Polaris privacy policy.", indexable: false },
  "/terms": { title: "Terms & Conditions | Project Polaris", description: "Read the Project Polaris terms and conditions.", indexable: false },
  "/auth": { title: "Sign In | Project Polaris", description: "Sign in or create a Project Polaris learning account.", indexable: false },
  "/portal": { title: "Student Workspace | Project Polaris", description: "Private Project Polaris learner workspace.", indexable: false },
};

export function getRouteMetadata(location: string): Metadata {
  return ROUTE_METADATA[location] ?? { title: "Page Not Found | Project Polaris", description: "The requested Project Polaris page could not be found.", indexable: false };
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
    const canonicalUrl = `${window.location.origin}${location === "/" ? "/" : location}`;
    document.title = metadata.title;
    upsertMeta('meta[name="description"]', { name: "description", content: metadata.description });
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
  }, [location]);

  return null;
}
