import { css } from "@emotion/react";
import {
  defaultTypographyRule,
  makeMobileTypographyVariables,
} from "@toss/tds-typography";

const mobileTypographyVariables = makeMobileTypographyVariables(
  defaultTypographyRule,
);
const mobileTypographyCSS = Object.entries(mobileTypographyVariables)
  .map(([name, value]) => `${name}: ${value};`)
  .join("\n");

export const globalStyles = css`
  :root {
    ${mobileTypographyCSS}
    --background: var(--adaptiveBackground);
    --foreground: var(--adaptiveGrey900);
    --muted-foreground: var(--adaptiveGrey600);
    --surface: var(--adaptiveLayeredBackground);
    --surface-muted: var(--adaptiveGreyBackground);
    --border-subtle: var(--adaptiveHairlineBorder);
    --brand: var(--adaptiveBlue500);
    --brand-pressed: var(--adaptiveBlue600);
    --danger: var(--adaptiveRed600);
    --success: var(--adaptiveGreen600);
    --shadow-card: 0 16px 40px rgba(0, 27, 55, 0.08);
    --radius-control: 16px;
    --radius-card: 24px;
  }

  * {
    box-sizing: border-box;
  }

  html {
    min-height: 100%;
    background: var(--background);
    scroll-behavior: smooth;
  }

  body {
    min-height: 100vh;
    margin: 0;
    color: var(--foreground);
    background: var(--background);
    font-family:
      var(--font-geist-sans),
      "Toss Product Sans",
      "SF Pro KR",
      "Apple SD Gothic Neo",
      Arial,
      Helvetica,
      sans-serif;
    overflow-x: hidden;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }
`;
