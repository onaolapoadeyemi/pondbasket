import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";
import Cart from "@/pages/Cart";
import CustomerHub from "@/pages/CustomerHub";
import FarmerPortal from "@/pages/FarmerPortal";
import Favorites from "@/pages/Favorites";
import LegalCenter from "@/pages/LegalCenter";
import ProductDetail from "@/pages/ProductDetail";
import Shop from "@/pages/Shop";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { PondShell } from "./components/PondShell";
import { QueryRecoveryBanner } from "./components/QueryRecoveryBanner";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <PondShell><Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/shop/:id"} component={ProductDetail} />
      <Route path={"/shop"} component={Shop} />
      <Route path={"/cart"} component={Cart} />
      <Route path={"/favorites"} component={Favorites} />
      <Route path={"/orders"} component={CustomerHub} />
      <Route path={"/notifications"} component={CustomerHub} />
      <Route path={"/addresses"} component={CustomerHub} />
      <Route path={"/profile"} component={CustomerHub} />
      <Route path={"/farm"} component={FarmerPortal} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/legal"} component={LegalCenter} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch></PondShell>
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
        <TooltipProvider>
          <Toaster />
          <QueryRecoveryBanner />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
