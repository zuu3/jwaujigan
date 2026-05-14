import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
      <AppFooter />
    </>
  );
}
