"use client";

import { useEffect, useRef, useState } from "react";
import styled from "@/lib/styled";
import { GLOSSARY } from "@/lib/glossary";

const TERMS = Object.keys(GLOSSARY);
const PATTERN = new RegExp(`(${TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");

function TermSpan({ term, definition }: { term: string; definition: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

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
  border-bottom: 1.5px dotted #8b95a1;
  cursor: pointer;
  transition: border-color 150ms, color 150ms;

  &:hover {
    border-color: #3182f6;
    color: #3182f6;
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
  pointer-events: none;

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
