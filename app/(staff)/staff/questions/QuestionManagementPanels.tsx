"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import MutedText from "@/app/ui/MutedText";
import Panel from "@/app/ui/Panel";
import SectionTitle from "@/app/ui/SectionTitle";

import type {
  ModuleCategory,
  QuestionDetail,
  QuestionStatusFilter,
  QuestionSummary,
  Subcategory,
} from "./types";

type QuestionHeaderPanelProps = {
  onCreateQuestion: () => void;
};

type QuestionListPanelProps = {
  keyword: string;
  moduleFilter: string;
  statusFilter: QuestionStatusFilter;
  showIds: boolean;
  listError: string | null;
  moduleOptions: ModuleCategory[];
  questions: QuestionSummary[];
  selectedQuestionId: string;
  onKeywordChange: (value: string) => void;
  onModuleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: QuestionStatusFilter) => void;
  onToggleShowIds: (value: boolean) => void;
  onSelectQuestion: (questionId: string) => void;
  formatUpdatedAt: (value: string) => string;
};

type QuestionDetailPanelProps = {
  isCreating: boolean;
  selectedQuestionId: string;
  formState: QuestionDetail;
  modules: ModuleCategory[];
  availableSubcategories: Subcategory[];
  detailModuleId: string;
  formError: string | null;
  formMessage: string | null;
  fieldErrors: {
    stem?: string;
    module?: string;
    options?: string;
  };
  canSubmit: boolean;
  onStemChange: (value: string) => void;
  onExplanationChange: (value: string) => void;
  onModuleChange: (value: string) => void;
  onSubcategoryChange: (value: string | null) => void;
  onActiveChange: (value: boolean) => void;
  onCorrectChange: (index: number) => void;
  onOptionTextChange: (index: number, value: string) => void;
  onMoveOption: (index: number, direction: "up" | "down") => void;
  onRemoveOption: (index: number) => void;
  onAddOption: () => void;
  onSubmit: () => void;
  onReset: () => void;
};

const HeaderPanel = styled(Panel)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));

const HeaderLabel = styled(MutedText)({
  display: "block",
});

const SidebarPanel = styled(Panel)(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  [theme.breakpoints.up("lg")]: {
    width: 380,
    minHeight: "calc(100vh - 240px)",
  },
}));

const SidebarContent = styled(Stack)({
  flex: 1,
  minHeight: 0,
});

const SidebarTitle = styled(SectionTitle)({
  fontWeight: 700,
});

const ListScroll = styled(Stack)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingRight: theme.spacing(1),
  maxHeight: 420,
  [theme.breakpoints.up("lg")]: {
    maxHeight: "calc(100vh - 420px)",
  },
}));

const QuestionCard = styled(Panel, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
  border: "1px solid",
  borderColor: selected ? "#1d4ed8" : theme.palette.divider,
  backgroundColor: selected ? "#eff6ff" : "#fff",
}));

const QuestionTitle = styled(SectionTitle)({
  fontWeight: 700,
});

const QuestionMeta = styled(MutedText)({
  display: "block",
});

const QuestionIdText = styled(MutedText)(({ theme }) => ({
  color: theme.palette.grey[400],
  display: "block",
}));

const QuestionSelectButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const DetailPanel = styled(Panel)({
  flex: 1,
});

const DetailDescription = styled(MutedText)({
  display: "block",
});

const OptionTitle = styled(SectionTitle)({
  fontWeight: 700,
});

const OptionHint = styled(MutedText)({
  display: "block",
});

const OptionNote = styled(MutedText)({
  display: "block",
});

const RemoveOptionButton = styled(Button)({
  minWidth: 96,
});

const AddOptionButton = styled(Button)({
  alignSelf: "flex-start",
});

const EmptyNotice = styled(MutedText)({
  display: "block",
});

const StatusFilterRow = styled(Stack)({
  flexWrap: "wrap",
});

const OptionRow = styled(Stack)({
  flexWrap: "wrap",
});

const OptionActionRow = styled(Stack)({
  flexWrap: "wrap",
});

/** 問題管理ヘッダーを表示する。 */
const QuestionHeaderPanel = ({
  onCreateQuestion,
}: QuestionHeaderPanelProps) => (
  <HeaderPanel>
    <Box>
      <HeaderLabel variant="body2">Staff / 問題管理</HeaderLabel>
      <SectionTitle variant="h4" weight={800}>
        問題管理
      </SectionTitle>
      <MutedText variant="body2">
        問題の検索・作成・編集をここで行います。
      </MutedText>
    </Box>
    <Button
      variant="contained"
      onClick={onCreateQuestion}
      data-testid="question-create-start"
    >
      新規問題作成
    </Button>
  </HeaderPanel>
);

/** 問題一覧の検索・選択を行うパネル。 */
const QuestionListPanel = ({
  keyword,
  moduleFilter,
  statusFilter,
  showIds,
  listError,
  moduleOptions,
  questions,
  selectedQuestionId,
  onKeywordChange,
  onModuleFilterChange,
  onStatusFilterChange,
  onToggleShowIds,
  onSelectQuestion,
  formatUpdatedAt,
}: QuestionListPanelProps) => (
  <SidebarPanel>
    <SidebarContent spacing={2}>
      <SidebarTitle variant="subtitle1">問題一覧</SidebarTitle>
      <TextField
        label="キーワード/IDで検索"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        fullWidth
        inputProps={{ "data-testid": "question-search" }}
      />
      <StatusFilterRow direction="row" spacing={1}>
        {(["all", "active", "inactive"] as const).map((status) => (
          <Button
            key={status}
            size="small"
            variant={statusFilter === status ? "contained" : "outlined"}
            onClick={() => onStatusFilterChange(status)}
            data-testid={`question-status-${status}`}
          >
            {status === "all"
              ? "すべて"
              : status === "active"
                ? "有効"
                : "無効"}
          </Button>
        ))}
      </StatusFilterRow>
      <FormControl fullWidth>
        <InputLabel id="question-module-filter-label">
          モジュールで絞り込み
        </InputLabel>
        <Select
          labelId="question-module-filter-label"
          label="モジュールで絞り込み"
          value={moduleFilter}
          onChange={(event) => onModuleFilterChange(event.target.value)}
          data-testid="question-filter-module"
        >
          {moduleOptions.map((module) => (
            <MenuItem key={module.categoryId} value={module.categoryId}>
              {module.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Switch
            checked={showIds}
            onChange={(event) => onToggleShowIds(event.target.checked)}
          />
        }
        label="IDを表示"
      />
      {listError && <Alert severity="error">{listError}</Alert>}
      <ListScroll spacing={1}>
        {questions.map((question) => {
          const isSelected = question.questionId === selectedQuestionId;
          return (
            <QuestionCard
              key={question.questionId}
              id={`question-row-${question.questionId}`}
              selected={isSelected}
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
                    color={question.moduleName ? "primary" : "default"}
                    variant="outlined"
                  />
                  {question.subcategoryName && (
                    <Chip
                      label={question.subcategoryName}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {!question.isActive && (
                    <Chip label="無効" size="small" color="default" />
                  )}
                </Stack>
                <QuestionTitle variant="subtitle2">
                  {question.stem}
                </QuestionTitle>
                <QuestionMeta variant="caption">
                  最終更新: {formatUpdatedAt(question.updatedAt)}
                </QuestionMeta>
                {showIds && (
                  <QuestionIdText variant="caption">
                    ID: {question.questionId}
                  </QuestionIdText>
                )}
              </Stack>
              <QuestionSelectButton
                size="small"
                variant={isSelected ? "contained" : "outlined"}
                onClick={() => onSelectQuestion(question.questionId)}
                data-testid={`question-select-${question.questionId}`}
              >
                {isSelected ? "選択中" : "詳細を見る"}
              </QuestionSelectButton>
            </QuestionCard>
          );
        })}
        {questions.length === 0 && (
          <EmptyNotice variant="body2">該当する問題がありません。</EmptyNotice>
        )}
      </ListScroll>
    </SidebarContent>
  </SidebarPanel>
);

/** 問題の作成・編集フォームを表示するパネル。 */
const QuestionDetailPanel = ({
  isCreating,
  selectedQuestionId,
  formState,
  modules,
  availableSubcategories,
  detailModuleId,
  formError,
  formMessage,
  fieldErrors,
  canSubmit,
  onStemChange,
  onExplanationChange,
  onModuleChange,
  onSubcategoryChange,
  onActiveChange,
  onCorrectChange,
  onOptionTextChange,
  onMoveOption,
  onRemoveOption,
  onAddOption,
  onSubmit,
  onReset,
}: QuestionDetailPanelProps) => (
  <DetailPanel>
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <SectionTitle variant="h6" weight={700}>
          {isCreating ? "新規問題作成" : "問題詳細"}
        </SectionTitle>
        <DetailDescription variant="body2">
          {isCreating
            ? "新しい問題を登録します。"
            : selectedQuestionId
              ? `ID: ${selectedQuestionId}`
              : "左の一覧から問題を選択してください。"}
        </DetailDescription>
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
          onChange={(event) => onStemChange(event.target.value)}
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
          onChange={(event) => onExplanationChange(event.target.value)}
          fullWidth
          multiline
          minRows={2}
          inputProps={{ "data-testid": "question-explanation" }}
        />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="question-module-label">モジュール</InputLabel>
            <Select
              labelId="question-module-label"
              label="モジュール"
              value={detailModuleId}
              onChange={(event) => onModuleChange(event.target.value)}
              error={Boolean(fieldErrors.module)}
              data-testid="question-module"
            >
              {modules.map((module) => (
                <MenuItem key={module.categoryId} value={module.categoryId}>
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
                onSubcategoryChange(
                  event.target.value === "" ? null : event.target.value,
                )
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
              onChange={(event) => onActiveChange(event.target.checked)}
            />
          }
          label="有効"
        />
        <Stack spacing={1}>
          <OptionTitle variant="subtitle2">選択肢（正解は1つ）</OptionTitle>
          <OptionHint variant="caption">
            2択以上・正解は1つのみ保存できます。
          </OptionHint>
          {formState.options.map((option, index) => (
            <OptionRow
              key={`option-${index}`}
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Radio
                checked={option.isCorrect}
                onChange={() => onCorrectChange(index)}
                inputProps={{
                  "data-testid": `question-option-correct-${index}`,
                }}
              />
              <TextField
                label={`選択肢 ${index + 1}`}
                value={option.optionText}
                onChange={(event) =>
                  onOptionTextChange(index, event.target.value)
                }
                fullWidth
                inputProps={{ "data-testid": `question-option-${index}` }}
              />
              <OptionActionRow direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => onMoveOption(index, "up")}
                  disabled={index === 0}
                  data-testid={`question-option-move-up-${index}`}
                >
                  上へ
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => onMoveOption(index, "down")}
                  disabled={index === formState.options.length - 1}
                  data-testid={`question-option-move-down-${index}`}
                >
                  下へ
                </Button>
              </OptionActionRow>
              <RemoveOptionButton
                variant="outlined"
                onClick={() => onRemoveOption(index)}
                disabled={formState.options.length <= 2}
                data-testid={`question-option-remove-${index}`}
              >
                削除
              </RemoveOptionButton>
            </OptionRow>
          ))}
          {fieldErrors.options && (
            <Typography variant="caption" color="error">
              {fieldErrors.options}
            </Typography>
          )}
          <OptionNote variant="caption">
            並び替えは保存時に反映されます。削除で正解が外れた場合は再指定してください。
          </OptionNote>
          <AddOptionButton
            variant="outlined"
            onClick={onAddOption}
            data-testid="question-option-add"
          >
            選択肢を追加
          </AddOptionButton>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={onSubmit}
            data-testid="question-save"
            disabled={!canSubmit}
          >
            {isCreating ? "作成" : "変更を保存"}
          </Button>
          {!isCreating && (
            <Button
              variant="outlined"
              onClick={onReset}
              data-testid="question-reset"
            >
              編集内容をリセット
            </Button>
          )}
        </Stack>
      </Stack>
    </Stack>
  </DetailPanel>
);

export { QuestionDetailPanel, QuestionHeaderPanel, QuestionListPanel };
