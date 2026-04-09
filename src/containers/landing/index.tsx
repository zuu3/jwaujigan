"use client";

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
  return (
    <Page>
      <LandingHeader isAuthenticated={isAuthenticated} />
      <HeroSection isAuthenticated={isAuthenticated} />
      <OverviewSection />
      <LocalInfoSection />
      <ArenaSection />
      <AnalysisSection />
      <EngagementSection />
      <LandingFooter />
    </Page>
  );
}
