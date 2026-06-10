import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { AreaNudgeFloat } from "@/components/AreaNudgeFloat";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
      <AppFooter />
      <PwaInstallBanner />
      <AreaNudgeFloat />
    </>
  );
}
