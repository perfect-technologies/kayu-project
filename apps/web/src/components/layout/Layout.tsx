import { Footer } from "./Footer";
import { FooterSwitch } from "./FooterSwitch";
import { MaintenanceBanner } from "./MaintenanceBanner";
import { MobileNav } from "./MobileNav";
import { Navbar } from "./Navbar";
import { ScreenTransition } from "./ScreenTransition";

/** The one chrome: sticky navbar, screen transition, compact footer on public routes, mobile dock. */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Navbar />
      <MaintenanceBanner />
      <main className="app-content flex-1">
        <ScreenTransition>{children}</ScreenTransition>
      </main>
      <FooterSwitch>
        <Footer />
      </FooterSwitch>
      <MobileNav />
    </div>
  );
}
