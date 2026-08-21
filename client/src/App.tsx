import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { ProgramsPage, ResearchPage, ResourcesPage, ShowcasePage } from "@/pages/CommunityPages";
import { AboutPage, ContactPage, LegalPage, SchoolsPage } from "@/pages/InfoPages";
import CoursesPage from "@/pages/Courses";
import ProjectsPage from "@/pages/Projects";
import AuthPage from "@/pages/Auth";
import PortalPage from "@/pages/Portal";
import AeroForgePage from "@/pages/AeroForge";
import PricingPage from "@/pages/Pricing";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/aeroforge" component={AeroForgePage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/programs" component={ProgramsPage} />
      <Route path="/showcase" component={ShowcasePage} />
      <Route path="/research" component={ResearchPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/schools" component={SchoolsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/portal" component={PortalPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy" component={() => <LegalPage type="privacy" />} />
      <Route path="/terms" component={() => <LegalPage type="terms" />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
