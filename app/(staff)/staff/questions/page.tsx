"use client";

import { Box, Container, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  QuestionDetailPanel,
  QuestionHeaderPanel,
  QuestionListPanel,
} from "./QuestionManagementPanels";
import type {
  ModuleCategory,
  QuestionDetail,
  QuestionStatusFilter,
  QuestionSummary,
  Subcategory,
} from "./types";

const Root = styled(Box)({
  minHeight: "100vh",
  backgroundColor: "#f6f7f8",
  color: "#111418",
});

const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(5),
  },
}));

const ContentGrid = styled(Stack)(({ theme }) => ({
  [theme.breakpoints.up("lg")]: {
    flexDirection: "row",
  },
}));

/** 選択肢入力の初期配列を返す。 */
const emptyOptions = () =>
  Array.from({ length: 4 }).map(() => ({
    optionText: "",
    isCorrect: false,
  }));

/** 新規作成時のフォーム初期値を返す。 */
const defaultFormState = (): QuestionDetail => ({
  questionId: "",
  stem: "",
  explanation: "",
  isActive: true,
  moduleCategoryId: null,
  subcategoryId: null,
  options: emptyOptions().map((option, index) => ({
    ...option,
    position: index + 1,
  })),
});

/** 問題管理の作成・編集・検索を行うスタッフ画面。 */
export default function StaffQuestionManagementPage() {
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [modules, setModules] = useState<ModuleCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<QuestionStatusFilter>("all");
  const [showIds, setShowIds] = useState(false);
  const [formState, setFormState] =
    useState<QuestionDetail>(defaultFormState());
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const canSubmit = isCreating || Boolean(selectedQuestionId);
  const [fieldErrors, setFieldErrors] = useState<{
    stem?: string;
    module?: string;
    options?: string;
  }>({});

  const moduleOptions = useMemo(
    () => [{ categoryId: "all", name: "すべて", code: "ALL" }, ...modules],
    [modules],
  );

  /** 更新日時を表示用に整形する。 */
  const formatUpdatedAt = (value: string) =>
    new Date(value).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const detailModuleId =
    formState.moduleCategoryId ?? modules[0]?.categoryId ?? "";
  const availableSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) => subcategory.parentCategoryId === detailModuleId,
      ),
    [subcategories, detailModuleId],
  );

  const fetchQuestions = async () => {
    setListError(null);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }
      if (moduleFilter !== "all") {
        params.set("moduleCategoryId", moduleFilter);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const response = await fetch(`/api/staff/questions?${params.toString()}`);
      if (!response.ok) {
        setListError("問題一覧の取得に失敗しました。");
        return;
      }
      const payload = (await response.json()) as {
        questions: QuestionSummary[];
        modules: ModuleCategory[];
        subcategories: Subcategory[];
      };
      setQuestions(
        payload.questions.map((question) => ({
          ...question,
          updatedAt: new Date(question.updatedAt).toISOString(),
        })),
      );
      setModules(payload.modules);
      setSubcategories(payload.subcategories);
    } catch {
      setListError("通信に失敗しました。");
    }
  };

  const loadQuestionDetail = async (questionId: string) => {
    setFormError(null);
    setFormMessage(null);
    try {
      const response = await fetch(`/api/staff/questions/${questionId}`);
      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setFormError(payload.message ?? "問題の取得に失敗しました。");
        return;
      }
      const payload = (await response.json()) as {
        question: QuestionDetail;
      };
      const options = payload.question.options
        .sort((a, b) => a.position - b.position)
        .map((option, index) => ({
          optionText: option.optionText,
          isCorrect: option.isCorrect,
          position: index + 1,
        }));
      setFormState({
        ...payload.question,
        options,
      });
    } catch {
      setFormError("通信に失敗しました。");
    }
  };

  const resetForm = () => {
    setFormState((previous) => ({
      ...defaultFormState(),
      moduleCategoryId: modules[0]?.categoryId ?? previous.moduleCategoryId,
    }));
  };

  const handleSelectQuestion = (questionId: string) => {
    setIsCreating(false);
    setSelectedQuestionId(questionId);
  };

  const handleNewQuestion = () => {
    setIsCreating(true);
    setSelectedQuestionId("");
    setFormError(null);
    setFormMessage(null);
    resetForm();
  };

  const handleOptionTextChange = (index: number, value: string) => {
    setFormState((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, optionText: value } : option,
      ),
    }));
  };

  const handleCorrectChange = (index: number) => {
    setFormState((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index,
      })),
    }));
  };

  const handleAddOption = () => {
    setFormState((previous) => ({
      ...previous,
      options: [
        ...previous.options,
        {
          optionText: "",
          isCorrect: false,
          position: previous.options.length + 1,
        },
      ],
    }));
  };

  const handleMoveOption = (fromIndex: number, direction: "up" | "down") => {
    setFormState((previous) => {
      const targetIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      if (targetIndex < 0 || targetIndex >= previous.options.length) {
        return previous;
      }
      const nextOptions = [...previous.options];
      const [moved] = nextOptions.splice(fromIndex, 1);
      nextOptions.splice(targetIndex, 0, moved);
      return {
        ...previous,
        options: nextOptions.map((option, index) => ({
          ...option,
          position: index + 1,
        })),
      };
    });
  };

  const handleRemoveOption = (index: number) => {
    setFormState((previous) => {
      if (previous.options.length <= 2) {
        return previous;
      }
      const removedWasCorrect = previous.options[index]?.isCorrect ?? false;
      const nextOptions = previous.options.filter(
        (_, optionIndex) => optionIndex !== index,
      );
      if (removedWasCorrect) {
        setFieldErrors((current) => ({
          ...current,
          options: "正解が未選択になりました。正解を再指定してください。",
        }));
        setFormError("入力内容を確認してください。");
      }
      return {
        ...previous,
        options: nextOptions.map((option, optionIndex) => ({
          ...option,
          position: optionIndex + 1,
          isCorrect: option.isCorrect && optionIndex !== index,
        })),
      };
    });
  };

  const validateForm = () => {
    const nextErrors: { stem?: string; module?: string; options?: string } = {};
    if (!formState.stem.trim()) {
      nextErrors.stem = "問題文を入力してください。";
    }
    if (!detailModuleId) {
      nextErrors.module = "モジュールを選択してください。";
    }
    const normalizedOptions = formState.options.map((option) =>
      option.optionText.trim(),
    );
    if (normalizedOptions.length < 2 || normalizedOptions.some((t) => !t)) {
      nextErrors.options = "選択肢は2つ以上入力してください。";
    }
    const correctCount = formState.options.filter((o) => o.isCorrect).length;
    if (correctCount === 0) {
      nextErrors.options = "正解を1つ選択してください。";
    }
    if (correctCount > 1) {
      nextErrors.options = "正解は1つだけ選択してください。";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("入力内容を確認してください。");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setFormError(null);
    setFormMessage(null);
    setFieldErrors({});

    if (!canSubmit) {
      setFormError("問題を選択してください。");
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload = {
      stem: formState.stem,
      explanation: formState.explanation,
      isActive: formState.isActive,
      moduleCategoryId: detailModuleId,
      subcategoryId: formState.subcategoryId,
      options: formState.options.map((option) => ({
        optionText: option.optionText,
        isCorrect: option.isCorrect,
      })),
    };

    try {
      const response = await fetch(
        isCreating
          ? "/api/staff/questions"
          : `/api/staff/questions/${selectedQuestionId}`,
        {
          method: isCreating ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorPayload = (await response.json()) as { message?: string };
        setFormError(errorPayload.message ?? "保存に失敗しました。");
        return;
      }

      const result = (await response.json()) as { questionId?: string };
      setFormMessage(
        isCreating ? "問題を作成しました。" : "変更を保存しました。",
      );
      await fetchQuestions();

      if (isCreating && result.questionId) {
        setIsCreating(false);
        setSelectedQuestionId(result.questionId);
      }
    } catch {
      setFormError("通信に失敗しました。");
    }
  };

  useEffect(() => {
    void fetchQuestions();
  }, [keyword, moduleFilter, statusFilter]);

  useEffect(() => {
    const selected = searchParams.get("questionId");
    if (selected) {
      setIsCreating(false);
      setSelectedQuestionId(selected);
      setStatusFilter("all");
      setModuleFilter("all");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedQuestionId || isCreating) {
      return;
    }
    void loadQuestionDetail(selectedQuestionId);
  }, [selectedQuestionId, isCreating]);

  useEffect(() => {
    if (!selectedQuestionId) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(
        `question-row-${selectedQuestionId}`,
      );
      element?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedQuestionId, questions.length]);

  useEffect(() => {
    if (!formState.moduleCategoryId && modules.length > 0) {
      setFormState((previous) => ({
        ...previous,
        moduleCategoryId: modules[0].categoryId,
      }));
    }
  }, [modules, formState.moduleCategoryId]);

  useEffect(() => {
    if (!formState.subcategoryId) {
      return;
    }
    const exists = subcategories.some(
      (subcategory) =>
        subcategory.categoryId === formState.subcategoryId &&
        subcategory.parentCategoryId === detailModuleId,
    );
    if (!exists) {
      setFormState((previous) => ({ ...previous, subcategoryId: null }));
    }
  }, [detailModuleId, formState.subcategoryId, subcategories]);

  return (
    <Root>
      <PageContainer maxWidth="xl">
        <Stack spacing={3}>
          <QuestionHeaderPanel onCreateQuestion={handleNewQuestion} />

          <ContentGrid direction={{ xs: "column", lg: "row" }} spacing={3}>
            <QuestionListPanel
              keyword={keyword}
              moduleFilter={moduleFilter}
              statusFilter={statusFilter}
              showIds={showIds}
              listError={listError}
              moduleOptions={moduleOptions}
              questions={questions}
              selectedQuestionId={selectedQuestionId}
              onKeywordChange={setKeyword}
              onModuleFilterChange={setModuleFilter}
              onStatusFilterChange={setStatusFilter}
              onToggleShowIds={setShowIds}
              onSelectQuestion={handleSelectQuestion}
              formatUpdatedAt={formatUpdatedAt}
            />

            <QuestionDetailPanel
              isCreating={isCreating}
              selectedQuestionId={selectedQuestionId}
              formState={formState}
              modules={modules}
              availableSubcategories={availableSubcategories}
              detailModuleId={detailModuleId}
              formError={formError}
              formMessage={formMessage}
              fieldErrors={fieldErrors}
              canSubmit={canSubmit}
              onStemChange={(value) =>
                setFormState((previous) => ({ ...previous, stem: value }))
              }
              onExplanationChange={(value) =>
                setFormState((previous) => ({
                  ...previous,
                  explanation: value,
                }))
              }
              onModuleChange={(value) =>
                setFormState((previous) => ({
                  ...previous,
                  moduleCategoryId: value,
                }))
              }
              onSubcategoryChange={(value) =>
                setFormState((previous) => ({
                  ...previous,
                  subcategoryId: value,
                }))
              }
              onActiveChange={(value) =>
                setFormState((previous) => ({ ...previous, isActive: value }))
              }
              onCorrectChange={handleCorrectChange}
              onOptionTextChange={handleOptionTextChange}
              onMoveOption={handleMoveOption}
              onRemoveOption={handleRemoveOption}
              onAddOption={handleAddOption}
              onSubmit={handleSubmit}
              onReset={resetForm}
            />
          </ContentGrid>
        </Stack>
      </PageContainer>
    </Root>
  );
}
