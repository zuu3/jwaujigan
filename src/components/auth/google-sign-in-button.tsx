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

    await signIn("google", {
      callbackUrl,
    });
  };

  return <button {...props} type={type} onClick={(event) => void handleClick(event)} />;
}
