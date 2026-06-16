"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { signIn } from "next-auth/react";

type GoogleSignInButtonProps = ComponentPropsWithoutRef<"button"> & {
  callbackUrl?: string;
};

export function GoogleSignInButton({
  callbackUrl = "/onboarding",
  onClick,
  type = "button",
  ...props
}: GoogleSignInButtonProps) {
  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    // middleware가 보존한 ?next= 경로가 있으면 우선 (데모 QR 답안 등)
    let target = callbackUrl;
    if (typeof window !== "undefined") {
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/")) {
        target = next;
      }
    }

    await signIn("google", {
      callbackUrl: target,
    });
  };

  return <button {...props} type={type} onClick={(event) => void handleClick(event)} />;
}
