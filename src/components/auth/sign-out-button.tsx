"use client";

import styled from "@emotion/styled";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <Button
      type="button"
      onClick={() =>
        void signOut({
          callbackUrl: "/",
        })
      }
    >
      로그아웃
    </Button>
  );
}

const Button = styled.button`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  color: #191f28;
  background: rgba(49, 130, 246, 0.08);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
`;
