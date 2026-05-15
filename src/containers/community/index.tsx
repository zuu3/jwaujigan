"use client";

import { useState, useId } from "react";
import styled from "@/lib/styled";
import Link from "next/link";
import { Plus, Trash2, X } from "lucide-react";
import {
  usePollsQuery,
  useCreatePollMutation,
} from "@/services/community/community.queries";
import type { PollOption } from "@/services/community/community.api";
import { POINTS } from "@/services/points/points";

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "마감";
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}일 남음`;
  if (hours > 0) return `${hours}시간 남음`;
  const mins = Math.floor(diff / 60_000);
  return `${mins}분 남음`;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export function CommunityContainer() {
  const [sort, setSort] = useState<"latest" | "hot">("latest");
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<PollOption[]>([
    { id: randomId(), text: "" },
    { id: randomId(), text: "" },
  ]);
  const [expireDays, setExpireDays] = useState<1 | 3 | 7>(7);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: polls, isLoading, error } = usePollsQuery(sort);
  const createMutation = useCreatePollMutation();

  const uid = useId();

  function addOption() {
    if (options.length >= 4) return;
    setOptions((prev) => [...prev, { id: randomId(), text: "" }]);
  }

  function removeOption(id: string) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  function updateOption(id: string, text: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  }

  function resetForm() {
    setQuestion("");
    setOptions([{ id: randomId(), text: "" }, { id: randomId(), text: "" }]);
    setExpireDays(7);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!question.trim()) {
      setFormError("질문을 입력해주세요.");
      return;
    }
    for (const opt of options) {
      if (!opt.text.trim()) {
        setFormError("선택지를 모두 입력해주세요.");
        return;
      }
    }

    try {
      await createMutation.mutateAsync({
        question: question.trim(),
        options: options.map((o) => ({ id: o.id, text: o.text.trim() })),
        expires_in_days: expireDays,
      });
      resetForm();
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "투표 생성에 실패했습니다.");
    }
  }

  return (
    <Page>
      <Shell>
        <PageHeader>
          <PageTitle>민심투표</PageTitle>
          <CreateBtn type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} />
            투표 만들기
          </CreateBtn>
        </PageHeader>

        <SortTabs>
          <SortTab
            type="button"
            $active={sort === "latest"}
            onClick={() => setSort("latest")}
          >
            최신
          </SortTab>
          <SortTab
            type="button"
            $active={sort === "hot"}
            onClick={() => setSort("hot")}
          >
            핫
          </SortTab>
        </SortTabs>

        {showForm && (
          <FormCard>
            <FormHeader>
              <FormTitle>새 투표 만들기</FormTitle>
              <CloseBtn type="button" onClick={() => { setShowForm(false); resetForm(); }}>
                <X size={18} />
              </CloseBtn>
            </FormHeader>
            <CostNote>생성에 {POINTS.POLL_CREATE}pt가 소모돼요</CostNote>
            <form onSubmit={(e) => { void handleSubmit(e); }}>
              <FieldGroup>
                <Label htmlFor={`${uid}-question`}>질문</Label>
                <QuestionInput
                  id={`${uid}-question`}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="여러분의 생각을 물어보세요."
                  maxLength={100}
                />
              </FieldGroup>

              <FieldGroup>
                <Label>선택지 (2~4개)</Label>
                <OptionList>
                  {options.map((opt, idx) => (
                    <OptionRow key={opt.id}>
                      <OptionInput
                        value={opt.text}
                        onChange={(e) => updateOption(opt.id, e.target.value)}
                        placeholder={`선택지 ${idx + 1}`}
                        maxLength={50}
                      />
                      {options.length > 2 && (
                        <RemoveBtn type="button" onClick={() => removeOption(opt.id)}>
                          <Trash2 size={14} />
                        </RemoveBtn>
                      )}
                    </OptionRow>
                  ))}
                  {options.length < 4 && (
                    <AddOptionBtn type="button" onClick={addOption}>
                      <Plus size={14} />
                      선택지 추가
                    </AddOptionBtn>
                  )}
                </OptionList>
              </FieldGroup>

              <FieldGroup>
                <Label>마감일</Label>
                <DayGroup>
                  {([1, 3, 7] as const).map((d) => (
                    <DayChip
                      key={d}
                      type="button"
                      $active={expireDays === d}
                      onClick={() => setExpireDays(d)}
                    >
                      {d}일
                    </DayChip>
                  ))}
                </DayGroup>
              </FieldGroup>

              {formError && <ErrorText>{formError}</ErrorText>}

              <SubmitBtn type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "생성 중…" : "투표 만들기"}
              </SubmitBtn>
            </form>
          </FormCard>
        )}

        {isLoading && (
          <SkeletonList>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </SkeletonList>
        )}

        {error && (
          <EmptyPanel>
            <EmptyTitle>투표 목록을 불러오지 못했어요</EmptyTitle>
            <EmptyBody>잠시 후 다시 시도해주세요.</EmptyBody>
          </EmptyPanel>
        )}

        {!isLoading && !error && polls && polls.length === 0 && (
          <EmptyPanel>
            <EmptyTitle>아직 민심투표가 없어요</EmptyTitle>
            <EmptyBody>첫 번째 투표를 만들어 민심을 물어보세요.</EmptyBody>
          </EmptyPanel>
        )}

        {polls && polls.length > 0 && (
          <PollList>
            {polls.map((poll) => {
              const expired = new Date(poll.expires_at) < new Date();
              return (
                <PollCard key={poll.id} href={`/community/polls/${poll.id}`}>
                  <PollQuestion>{poll.question}</PollQuestion>
                  <PollMeta>
                    <MetaItem>{poll.total_count.toLocaleString()}명 참여</MetaItem>
                    <MetaDot />
                    <MetaItem $muted={expired}>{timeLeft(poll.expires_at)}</MetaItem>
                    {poll.user_option_id && (
                      <>
                        <MetaDot />
                        <MyVoteBadge>참여함</MyVoteBadge>
                      </>
                    )}
                  </PollMeta>
                  <OptionPreview>
                    {poll.options.slice(0, 3).map((opt) => (
                      <OptionTag
                        key={opt.id}
                        $mine={poll.user_option_id === opt.id}
                      >
                        {opt.text}
                      </OptionTag>
                    ))}
                    {poll.options.length > 3 && (
                      <OptionTag $mine={false}>+{poll.options.length - 3}</OptionTag>
                    )}
                  </OptionPreview>
                </PollCard>
              );
            })}
          </PollList>
        )}
      </Shell>
    </Page>
  );
}

/* ── Styles ──────────────────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 80px;
`;

const Shell = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 24px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #191f28;
`;

const CreateBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #3182f6;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms;

  &:hover {
    background: #2272eb;
  }
`;

const FormCard = styled.div`
  padding: 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
`;

const FormHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const FormTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #191f28;
`;

const CloseBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8b95a1;
  cursor: pointer;

  &:hover {
    background: #f2f4f6;
    color: #191f28;
  }
`;

const CostNote = styled.p`
  margin: 0 0 16px;
  font-size: 12px;
  font-weight: 400;
  color: #8b95a1;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #4e5968;
`;

const QuestionInput = styled.textarea`
  width: 100%;
  min-height: 72px;
  padding: 10px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: #f2f4f6;
  color: #191f28;
  font-size: 14px;
  font-weight: 400;
  font-family: inherit;
  resize: none;
  box-sizing: border-box;

  &::placeholder {
    color: #b0b8c1;
  }

  &:focus {
    outline: none;
    border-color: #3182f6;
    background: #ffffff;
  }
`;

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OptionInput = styled.input`
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: #f2f4f6;
  color: #191f28;
  font-size: 14px;
  font-family: inherit;

  &::placeholder {
    color: #b0b8c1;
  }

  &:focus {
    outline: none;
    border-color: #3182f6;
    background: #ffffff;
  }
`;

const RemoveBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8b95a1;
  cursor: pointer;

  &:hover {
    background: #f2f4f6;
    color: #f04452;
  }
`;

const AddOptionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border: 1px dashed #e5e8eb;
  border-radius: 8px;
  background: transparent;
  color: #8b95a1;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;

  &:hover {
    border-color: #3182f6;
    color: #3182f6;
  }
`;

const DayGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const DayChip = styled.button<{ $active: boolean }>`
  height: 36px;
  padding: 0 16px;
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e5e8eb")};
  border-radius: 9999px;
  background: ${({ $active }) => ($active ? "#e8f3ff" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#3182f6" : "#6b7684")};
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: border-color 150ms, background 150ms, color 150ms;
`;

const ErrorText = styled.p`
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 400;
  color: #f04452;
`;

const SubmitBtn = styled.button`
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 8px;
  background: #3182f6;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms;

  &:hover:not(:disabled) {
    background: #2272eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SkeletonCard = styled.div`
  height: 100px;
  border-radius: 12px;
  background: #f2f4f6;
  animation: shimmer 1.2s linear infinite;

  @keyframes shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
`;

const EmptyPanel = styled.div`
  padding: 32px 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
  text-align: center;
`;

const EmptyTitle = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #191f28;
`;

const EmptyBody = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 400;
  color: #6b7684;
`;

const PollList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PollCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
  transition: border-color 150ms;

  &:hover {
    border-color: #b0b8c1;
  }
`;

const PollQuestion = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #191f28;
  line-height: 1.5;
  word-break: keep-all;
`;

const PollMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const MetaItem = styled.span<{ $muted?: boolean }>`
  font-size: 12px;
  font-weight: 400;
  color: ${({ $muted }) => ($muted ? "#b0b8c1" : "#8b95a1")};
  font-variant-numeric: tabular-nums;
`;

const MetaDot = styled.span`
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #b0b8c1;
  flex-shrink: 0;
`;

const MyVoteBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 11px;
  font-weight: 600;
`;

const OptionPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const OptionTag = styled.span<{ $mine: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  border: 1px solid ${({ $mine }) => ($mine ? "#3182f6" : "#e5e8eb")};
  background: ${({ $mine }) => ($mine ? "#e8f3ff" : "#f9fafb")};
  color: ${({ $mine }) => ($mine ? "#3182f6" : "#6b7684")};
  font-size: 12px;
  font-weight: ${({ $mine }) => ($mine ? 600 : 400)};
`;

const SortTabs = styled.div`
  display: flex;
  gap: 8px;
`;

const SortTab = styled.button<{ $active: boolean }>`
  height: 32px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? "#191f28" : "#f2f4f6")};
  color: ${({ $active }) => ($active ? "#ffffff" : "#4e5968")};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms, color 150ms;

  &:hover {
    background: ${({ $active }) => ($active ? "#191f28" : "#e5e8eb")};
  }
`;
