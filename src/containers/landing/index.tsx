"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { showToast } from "@/lib/toast";
import { LandingFooter } from "./sections/footer";
import { LandingHeader } from "./sections/header";
import { HeroSection } from "./sections/hero";
import { OverviewSection } from "./sections/overview";
import { LocalInfoSection } from "./sections/local-info";
import { ArenaSection } from "./sections/arena";
import { AnalysisSection } from "./sections/analysis";
import { EngagementSection } from "./sections/engagement";
import { Page } from "./shared";

type LandingContainerProps = {
  isAuthenticated: boolean;
};

export function LandingContainer({ isAuthenticated }: LandingContainerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("referral_code", ref.trim().toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("unsubscribed") === "1") {
      showToast("뉴스레터 구독이 취소됐습니다.");
    }
  }, [searchParams]);

  return (
    <Page>
      <LandingHeader isAuthenticated={isAuthenticated} />
      <HeroSection isAuthenticated={isAuthenticated} />
      <OverviewSection />
      <LocalInfoSection />
      <ArenaSection />
      <AnalysisSection />
      <EngagementSection />
      <LandingFooter isAuthenticated={isAuthenticated} />
    </Page>
  );
}
