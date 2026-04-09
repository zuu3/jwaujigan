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

export function LandingContainer() {
  return (
    <Page>
      <LandingHeader />
      <HeroSection />
      <OverviewSection />
      <LocalInfoSection />
      <ArenaSection />
      <AnalysisSection />
      <EngagementSection />
      <LandingFooter />
    </Page>
  );
}
