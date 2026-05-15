"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import styled from "@/lib/styled";
import { showToast } from "@/lib/toast";

export function DeleteAccountButton() {
  const [step, setStep] = useState<"idle" | "confirm" | "loading">("idle");

  const handleDelete = async () => {
    setStep("loading");
    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json() as { message?: string };
        showToast(data.message ?? "탈퇴에 실패했습니다.", "error");
        setStep("idle");
      }
    } catch {
      showToast("탈퇴에 실패했습니다.", "error");
      setStep("idle");
    }
  };

  return (
    <>
      <TriggerButton type="button" onClick={() => setStep("confirm")}>
        회원 탈퇴
      </TriggerButton>

      {(step === "confirm" || step === "loading") && (
        <>
          <Backdrop onClick={() => step !== "loading" && setStep("idle")} />
          <Modal>
            <ModalTitle>정말 탈퇴하시겠어요?</ModalTitle>
            <ModalText>
              탈퇴하면 투표 기록, 팔로우, 댓글 등 모든 데이터가 삭제되며 복구할 수 없습니다.
            </ModalText>
            <ModalActions>
              <CancelButton
                type="button"
                disabled={step === "loading"}
                onClick={() => setStep("idle")}
              >
                취소
              </CancelButton>
              <ConfirmButton
                type="button"
                disabled={step === "loading"}
                onClick={() => void handleDelete()}
              >
                {step === "loading" ? "처리 중…" : "탈퇴하기"}
              </ConfirmButton>
            </ModalActions>
          </Modal>
        </>
      )}
    </>
  );
}

const TriggerButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: #b0b8c1;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  font-family: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: #f04452;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(2, 9, 19, 0.5);
`;

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  background: #ffffff;
  border-radius: 16px;
  width: min(100% - 40px, 340px);
  padding: 24px 20px;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.16);
`;

const ModalTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: #191f28;
  letter-spacing: -0.02em;
`;

const ModalText = styled.p`
  margin: 0 0 20px;
  font-size: 13px;
  color: #6b7684;
  line-height: 1.6;
  word-break: keep-all;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px 0;
  border-radius: 8px;
  border: 1px solid #e5e8eb;
  background: #ffffff;
  color: #6b7684;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfirmButton = styled.button`
  flex: 1;
  padding: 12px 0;
  border-radius: 8px;
  border: none;
  background: #f04452;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
