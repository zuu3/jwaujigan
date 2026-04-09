"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { signOut } from "next-auth/react";

type SignOutButtonProps = ComponentPropsWithoutRef<"button"> & {
  callbackUrl?: string;
};

export function SignOutButton({
  callbackUrl = "/",
  onClick,
  type = "button",
  ...props
}: SignOutButtonProps) {
  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    await signOut({
      callbackUrl,
    });
  };

  return (
    <button {...props} type={type} onClick={(event) => void handleClick(event)}>
      로그아웃
    </button>
  );
}
