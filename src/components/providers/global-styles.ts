import { css } from "@emotion/react";

export const globalStyles = css`
  :root {
    --background: #ffffff;
    --foreground: #171717;
  }

  * {
    box-sizing: border-box;
  }

  html {
    min-height: 100%;
    background: var(--background);
  }

  body {
    min-height: 100vh;
    margin: 0;
    color: var(--foreground);
    background: var(--background);
    font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
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
