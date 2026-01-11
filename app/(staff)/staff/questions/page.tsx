"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ModuleCategory = {
  categoryId: string;
  code: string;
  name: string;
};

type Subcategory = {
  categoryId: string;
  parentCategoryId: string;
  name: string;
};

type QuestionSummary = {
  questionId: string;
  stem: string;
  isActive: boolean;
  updatedAt: string;
  moduleCode: string | null;
  moduleName: string | null;
  subcategoryName: string | null;
};

type QuestionOptionInput = {
  optionText: string;
  isCorrect: boolean;
};

type QuestionDetail = {
  questionId: string;
  stem: string;
  explanation: string | null;
  isActive: boolean;
  moduleCategoryId: string | null;
  subcategoryId: string | null;
  options: {
    optionText: string;
    isCorrect: boolean;
    position: number;
  }[];
};

const emptyOptions = () =>
  Array.from({ length: 4 }).map(() => ({
    optionText: "",
    isCorrect: false,
  }));

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

export default function StaffQuestionManagementPage() {
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [modules, setModules] = useState<ModuleCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
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

  const handleRemoveOption = (index: number) => {
    setFormState((previous) => {
      if (previous.options.length <= 2) {
        return previous;
      }
      const nextOptions = previous.options.filter(
        (_, optionIndex) => optionIndex !== index,
      );
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
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7f8", color: "#111418" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Staff / 問題管理
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  問題管理
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  問題の検索・作成・編集をここで行います。
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={handleNewQuestion}
                data-testid="question-create-start"
              >
                新規問題作成
              </Button>
            </Stack>
          </Paper>

          <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
            <Paper
              sx={{
                width: { xs: "100%", lg: 380 },
                p: 2.5,
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                minHeight: { xs: "auto", lg: "calc(100vh - 240px)" },
              }}
            >
              <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  問題一覧
                </Typography>
                <TextField
                  label="キーワード/IDで検索"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  fullWidth
                  inputProps={{ "data-testid": "question-search" }}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(["all", "active", "inactive"] as const).map((status) => (
                    <Button
                      key={status}
                      size="small"
                      variant={
                        statusFilter === status ? "contained" : "outlined"
                      }
                      onClick={() => setStatusFilter(status)}
                      data-testid={`question-status-${status}`}
                    >
                      {status === "all"
                        ? "すべて"
                        : status === "active"
                          ? "有効"
                          : "無効"}
                    </Button>
                  ))}
                </Stack>
                <FormControl fullWidth>
                  <InputLabel id="question-module-filter-label">
                    モジュールで絞り込み
                  </InputLabel>
                  <Select
                    labelId="question-module-filter-label"
                    label="モジュールで絞り込み"
                    value={moduleFilter}
                    onChange={(event) => setModuleFilter(event.target.value)}
                    data-testid="question-filter-module"
                  >
                    {moduleOptions.map((module) => (
                      <MenuItem
                        key={module.categoryId}
                        value={module.categoryId}
                      >
                        {module.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {listError && <Alert severity="error">{listError}</Alert>}
                <Stack
                  spacing={1}
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    pr: 1,
                    maxHeight: { xs: 420, lg: "calc(100vh - 420px)" },
                  }}
                >
                  {questions.map((question) => {
                    const isSelected =
                      question.questionId === selectedQuestionId;
                    return (
                      <Paper
                        key={question.questionId}
                        variant={isSelected ? "outlined" : "elevation"}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          borderColor: isSelected ? "#1d4ed8" : undefined,
                          bgcolor: isSelected ? "#eff6ff" : "#fff",
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                          >
                            <Chip
                              label={question.moduleName ?? "未分類"}
                              size="small"
                              color={
                                question.moduleName ? "primary" : "default"
                              }
                              variant="outlined"
                            />
                            {!question.isActive && (
                              <Chip label="無効" size="small" color="default" />
                            )}
                          </Stack>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700 }}
                          >
                            {question.stem}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#64748b" }}
                          >
                            ID: {question.questionId}
                          </Typography>
                        </Stack>
                        <Button
                          size="small"
                          variant={isSelected ? "contained" : "outlined"}
                          sx={{ mt: 1 }}
                          onClick={() =>
                            handleSelectQuestion(question.questionId)
                          }
                          data-testid={`question-select-${question.questionId}`}
                        >
                          {isSelected ? "選択中" : "詳細を見る"}
                        </Button>
                      </Paper>
                    );
                  })}
                  {questions.length === 0 && (
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      該当する問題がありません。
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ flex: 1, p: 3, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {isCreating ? "新規問題作成" : "問題詳細"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    {isCreating
                      ? "新しい問題を登録します。"
                      : selectedQuestionId
                        ? `ID: ${selectedQuestionId}`
                        : "左の一覧から問題を選択してください。"}
                  </Typography>
                </Stack>

                {(formError || formMessage) && (
                  <Alert severity={formError ? "error" : "success"}>
                    {formError ?? formMessage}
                  </Alert>
                )}

                <Stack spacing={2}>
                  <TextField
                    label="問題文"
                    value={formState.stem}
                    onChange={(event) =>
                      setFormState((previous) => ({
                        ...previous,
                        stem: event.target.value,
                      }))
                    }
                    fullWidth
                    multiline
                    minRows={3}
                    error={Boolean(fieldErrors.stem)}
                    helperText={fieldErrors.stem}
                    inputProps={{ "data-testid": "question-stem" }}
                  />
                  <TextField
                    label="解説（任意）"
                    value={formState.explanation ?? ""}
                    onChange={(event) =>
                      setFormState((previous) => ({
                        ...previous,
                        explanation: event.target.value,
                      }))
                    }
                    fullWidth
                    multiline
                    minRows={2}
                    inputProps={{ "data-testid": "question-explanation" }}
                  />
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="question-module-label">
                        モジュール
                      </InputLabel>
                      <Select
                        labelId="question-module-label"
                        label="モジュール"
                        value={detailModuleId}
                        onChange={(event) =>
                          setFormState((previous) => ({
                            ...previous,
                            moduleCategoryId: event.target.value,
                          }))
                        }
                        error={Boolean(fieldErrors.module)}
                        data-testid="question-module"
                      >
                        {modules.map((module) => (
                          <MenuItem
                            key={module.categoryId}
                            value={module.categoryId}
                          >
                            {module.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldErrors.module && (
                        <Typography variant="caption" color="error">
                          {fieldErrors.module}
                        </Typography>
                      )}
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="question-subcategory-label">
                        サブカテゴリ（任意）
                      </InputLabel>
                      <Select
                        labelId="question-subcategory-label"
                        label="サブカテゴリ（任意）"
                        value={formState.subcategoryId ?? ""}
                        onChange={(event) =>
                          setFormState((previous) => ({
                            ...previous,
                            subcategoryId:
                              event.target.value === ""
                                ? null
                                : event.target.value,
                          }))
                        }
                        data-testid="question-subcategory"
                      >
                        <MenuItem value="">なし</MenuItem>
                        {availableSubcategories.map((subcategory) => (
                          <MenuItem
                            key={subcategory.categoryId}
                            value={subcategory.categoryId}
                          >
                            {subcategory.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formState.isActive}
                        onChange={(event) =>
                          setFormState((previous) => ({
                            ...previous,
                            isActive: event.target.checked,
                          }))
                        }
                      />
                    }
                    label="有効"
                  />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      選択肢（正解は1つ）
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      2択以上・正解は1つのみ保存できます。
                    </Typography>
                    {formState.options.map((option, index) => (
                      <Stack
                        key={`option-${index}`}
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        alignItems={{ xs: "flex-start", md: "center" }}
                      >
                        <Radio
                          checked={option.isCorrect}
                          onChange={() => handleCorrectChange(index)}
                          inputProps={{
                            "data-testid": `question-option-correct-${index}`,
                          }}
                        />
                        <TextField
                          label={`選択肢 ${index + 1}`}
                          value={option.optionText}
                          onChange={(event) =>
                            handleOptionTextChange(index, event.target.value)
                          }
                          fullWidth
                          inputProps={{
                            "data-testid": `question-option-${index}`,
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={() => handleRemoveOption(index)}
                          disabled={formState.options.length <= 2}
                          data-testid={`question-option-remove-${index}`}
                          sx={{ minWidth: 96 }}
                        >
                          削除
                        </Button>
                      </Stack>
                    ))}
                    {fieldErrors.options && (
                      <Typography variant="caption" color="error">
                        {fieldErrors.options}
                      </Typography>
                    )}
                    <Button
                      variant="outlined"
                      onClick={handleAddOption}
                      data-testid="question-option-add"
                      sx={{ alignSelf: "flex-start" }}
                    >
                      選択肢を追加
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      data-testid="question-save"
                      disabled={!canSubmit}
                    >
                      {isCreating ? "作成" : "変更を保存"}
                    </Button>
                    {!isCreating && (
                      <Button
                        variant="outlined"
                        onClick={resetForm}
                        data-testid="question-reset"
                      >
                        編集内容をリセット
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
