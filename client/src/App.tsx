import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import CandidateChatPage from "./pages/CandidateChatPage";
import CandidateDetailPage from "./pages/CandidateDetailPage";
import CandidatesPage from "./pages/CandidatesPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";

function Router() {
  return (
    <Switch>
      <Route path={"/candidate-chat"} component={CandidateChatPage} />
      <Route path={"/"}><DashboardLayout><DashboardPage /></DashboardLayout></Route>
      <Route path={"/jobs"}><DashboardLayout><JobsPage /></DashboardLayout></Route>
      <Route path={"/candidates/:id"}><DashboardLayout><CandidateDetailPage /></DashboardLayout></Route>
      <Route path={"/candidates"}><DashboardLayout><CandidatesPage /></DashboardLayout></Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
