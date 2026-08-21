import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 640);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll back to top"
      className="press fixed bottom-5 right-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-card/85 text-primary shadow-xl shadow-black/25 backdrop-blur-xl transition-transform hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground sm:bottom-7 sm:right-7"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
