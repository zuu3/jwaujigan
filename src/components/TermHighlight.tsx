"use client";

import { useEffect, useRef, useState } from "react";
import styled from "@/lib/styled";
import { GLOSSARY } from "@/lib/glossary";

const LS_KEY = "jwj_understood_terms";

function getUnderstood(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveUnderstood(term: string) {
  try {
    const set = getUnderstood();
    set.add(term);
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch {}
}

const TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
const PATTERN = new RegExp(`(${TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");

function TermSpan({ term, definition }: { term: string; definition: string }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (getUnderstood().has(term)) setDismissed(true);
  }, [term]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (dismissed) return <>{term}</>;

  const handleUnderstood = () => {
    saveUnderstood(term);
    setDismissed(true);
    setOpen(false);
  };

  return (
    <TermRoot ref={rootRef}>
      <TermWord
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((v) => !v); }}
      >
        {term}
      </TermWord>
      {open && (
        <Tooltip role="tooltip">
          <TooltipTerm>{term}</TooltipTerm>
          <TooltipDef>{definition}</TooltipDef>
          <UnderstoodBtn onClick={handleUnderstood}>이해했어요</UnderstoodBtn>
        </Tooltip>
      )}
    </TermRoot>
  );
}

type Props = { text: string };

export function TermHighlight({ text }: Props) {
  if (TERMS.length === 0) return <>{text}</>;

  const parts = text.split(PATTERN);

  return (
    <>
      {parts.map((part, i) =>
        GLOSSARY[part] ? (
          <TermSpan key={i} term={part} definition={GLOSSARY[part]} />
        ) : (
          part
        ),
      )}
    </>
  );
}

const TermRoot = styled.span`
  position: relative;
  display: inline;
`;

const TermWord = styled.span`
  background: #e8f3ff;
  color: #3182f6;
  border-radius: 3px;
  padding: 0 3px;
  cursor: pointer;
  transition: background 150ms;

  &:hover {
    background: #cce0ff;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  min-width: 200px;
  max-width: 260px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #191f28;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.2);
  animation: tooltipIn 150ms cubic-bezier(0.0, 0.0, 0.2, 1);

  @keyframes tooltipIn {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @media (max-width: 480px) {
    left: 0;
    transform: none;
    min-width: 180px;
    max-width: 240px;

    @keyframes tooltipIn {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  }
`;

const TooltipTerm = styled.div`
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const TooltipDef = styled.div`
  color: #b0b8c1;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.6;
  word-break: keep-all;
`;

const UnderstoodBtn = styled.button`
  display: block;
  margin-top: 10px;
  width: 100%;
  padding: 6px 0;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }
`;
