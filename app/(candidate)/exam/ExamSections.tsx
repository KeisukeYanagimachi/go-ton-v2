"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

type ExamSectionSnapshot = {
  sectionId: string;
  code: string;
  name: string;
  position: number;
  durationSeconds: number;
};

type ExamOption = {
  id: string;
  position: number;
  optionText: string;
};

type ExamQuestionItem = {
  attemptItemId: string;
  question: {
    stem: string;
    options: ExamOption[];
  };
};

type ExamFrameProps = {
  header: ReactNode;
  children: ReactNode;
};

type ExamHeaderProps = {
  sectionLabel: string;
  timerLabel: string;
  showTimeWarning: boolean;
};

type ExamSidebarProps = {
  sections: ExamSectionSnapshot[];
  sectionIndex: number;
};

type ExamMainPanelProps = {
  activeItem: ExamQuestionItem;
  activeIndex: number;
  sectionItemsCount: number;
  progressValue: number;
  isLocked: boolean;
  lockedMessage: string;
  showAnswerRequired: boolean;
  saveMessage: string | null;
  answers: Record<string, string | null>;
  isSaving: boolean;
  isSubmitting: boolean;
  isLastQuestion: boolean;
  isLastSection: boolean;
  onSelectOption: (optionId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenSubmitConfirm: () => void;
};

const Root = styled(Box)({
  height: "100vh",
  backgroundColor: "#f6f7f8",
  color: "#111418",
  overflow: "hidden",
});

const Header = styled(Box)(({ theme }) => ({
  position: "sticky",
  top: 0,
  zIndex: 10,
  display: "grid",
  alignItems: "center",
  gridTemplateColumns: "1fr",
  columnGap: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e2e8f0",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
  width: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "1fr auto 1fr",
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
}));

const HeaderLeft = styled(Stack)({
  minWidth: 0,
});

const BrandBadge = styled(Box)({
  width: 40,
  height: 40,
  borderRadius: 8,
  backgroundColor: "rgba(19, 127, 236, 0.12)",
  display: "grid",
  placeItems: "center",
  color: "#137fec",
  fontWeight: 700,
});

const HeaderTitle = styled(Typography)({
  fontWeight: 700,
  whiteSpace: "nowrap",
});

const HeaderSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 220,
  display: "block",
  [theme.breakpoints.up("md")]: {
    maxWidth: 360,
  },
}));

const HeaderCenter = styled(Box)(({ theme }) => ({
  display: "none",
  alignItems: "center",
  gap: theme.spacing(2),
  flexShrink: 0,
  justifySelf: "center",
  [theme.breakpoints.up("md")]: {
    display: "flex",
  },
}));

const TimerChip = styled(Paper)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(0.75),
  paddingBottom: theme.spacing(0.75),
  borderRadius: 999,
  backgroundColor: "#f1f5f9",
  border: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  flexShrink: 0,
}));

const TimerLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  whiteSpace: "nowrap",
}));

const TimerValue = styled(Typography)({
  fontWeight: 700,
  letterSpacing: 1,
  whiteSpace: "nowrap",
});

const WarningChip = styled(Chip)({
  backgroundColor: "rgba(251, 146, 60, 0.15)",
  color: "#c2410c",
  fontWeight: 700,
});

const HeaderSpacer = styled(Box)(({ theme }) => ({
  display: "none",
  [theme.breakpoints.up("md")]: {
    display: "block",
  },
}));

const MainShell = styled(Box)({
  height: "calc(100vh - 72px)",
  overflow: "hidden",
  boxSizing: "border-box",
});

const MainContent = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  height: "100%",
  boxSizing: "border-box",
  [theme.breakpoints.up("md")]: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
    paddingTop: theme.spacing(3),
  },
  [theme.breakpoints.up("lg")]: {
    paddingLeft: theme.spacing(6),
    paddingRight: theme.spacing(6),
  },
}));

const MainStack = styled(Stack)({
  height: "100%",
});

const ExamLayout = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(2),
  height: "100%",
  minHeight: 0,
  [theme.breakpoints.up("lg")]: {
    gridTemplateColumns: "320px minmax(0, 1fr)",
    gap: theme.spacing(3),
  },
}));

const SectionPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(3),
  height: "100%",
}));

const SectionTitle = styled(Typography)({
  fontWeight: 700,
});

const SectionCount = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const SectionRow = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "status",
})<{ status: "current" | "complete" | "pending" }>(({ status, theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  borderRadius: theme.spacing(2),
  backgroundColor:
    status === "current" ? "rgba(19, 127, 236, 0.08)" : "#f8fafc",
  border: "1px solid #e2e8f0",
}));

const SectionName = styled(Typography)({
  fontWeight: 700,
});

const SectionTime = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const SectionStatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "status",
})<{ status: "current" | "complete" | "pending" }>(({ status }) => ({
  backgroundColor:
    status === "current"
      ? "rgba(19, 127, 236, 0.12)"
      : status === "complete"
        ? "rgba(16, 185, 129, 0.12)"
        : "rgba(148, 163, 184, 0.2)",
  color:
    status === "current"
      ? "#137fec"
      : status === "complete"
        ? "#047857"
        : "#475569",
  fontWeight: 700,
}));

const ExamContent = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateRows: "auto auto auto 1fr auto",
  gap: theme.spacing(2),
  minHeight: 0,
}));

const ExitAlert = styled(Alert)(({ theme }) => ({
  borderRadius: theme.spacing(2),
}));

const ProgressTitle = styled(Typography)({
  fontWeight: 700,
});

const ProgressCount = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const ProgressText = styled(Typography)({
  color: "#137fec",
});

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  marginTop: theme.spacing(1),
  height: 8,
  borderRadius: 999,
  backgroundColor: "#e2e8f0",
  "& .MuiLinearProgress-bar": {
    backgroundColor: "#137fec",
  },
}));

const QuestionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(3),
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.08)",
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(3),
  },
}));

const QuestionTitle = styled(Typography)({
  fontWeight: 700,
});

const InstructionText = styled(Typography)({
  color: "#475569",
  lineHeight: 1.7,
});

const AnswerCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(3),
  border: "1px solid #e2e8f0",
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(3),
  },
}));

const AnswerLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const OptionCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "selected" && prop !== "locked",
})<{ selected: boolean; locked: boolean }>(({ theme, selected, locked }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  borderColor: selected ? "#137fec" : "#e2e8f0",
  backgroundColor: selected ? "rgba(19, 127, 236, 0.08)" : "#fff",
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "flex-start",
  cursor: locked ? "not-allowed" : "pointer",
  opacity: locked ? 0.6 : 1,
}));

const OptionIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ selected }) => ({
  width: 18,
  height: 18,
  borderRadius: "50%",
  border: "2px solid",
  borderColor: selected ? "#137fec" : "#cbd5f5",
  display: "grid",
  placeItems: "center",
  marginTop: 2,
}));

const OptionText = styled(Typography)({
  color: "#1f2937",
  lineHeight: 1.6,
});

const PrevButton = styled(Button)({
  borderColor: "#cbd5f5",
  color: "#1f2937",
  fontWeight: 700,
  "&:hover": {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
  },
});

const SubmitButton = styled(Button)({
  backgroundColor: "#111418",
  fontWeight: 700,
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#1f2937",
    boxShadow: "none",
  },
});

const NextButton = styled(Button)({
  backgroundColor: "#137fec",
  fontWeight: 700,
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#1068c2",
    boxShadow: "none",
  },
});

/** 試験全体のフレームを表示する。 */
const ExamFrame = ({ header, children }: ExamFrameProps) => (
  <Root data-testid="candidate-exam-page">
    {header}
    <MainShell>
      <MainContent component="main">
        <MainStack spacing={2}>{children}</MainStack>
      </MainContent>
    </MainShell>
  </Root>
);

/** 試験画面のヘッダーを表示する。 */
const ExamHeader = ({
  sectionLabel,
  timerLabel,
  showTimeWarning,
}: ExamHeaderProps) => (
  <Header component="header">
    <HeaderLeft direction="row" spacing={2} alignItems="center">
      <BrandBadge>SPI</BrandBadge>
      <Box>
        <HeaderTitle variant="subtitle1">SPI 採用適性検査</HeaderTitle>
        <HeaderSubtitle
          variant="caption"
          data-testid="candidate-current-section"
        >
          {sectionLabel}
        </HeaderSubtitle>
      </Box>
    </HeaderLeft>
    <HeaderCenter>
      <TimerChip elevation={0}>
        <TimerLabel variant="body2">残り時間</TimerLabel>
        <TimerValue variant="subtitle1">{timerLabel}</TimerValue>
      </TimerChip>
      {showTimeWarning && <WarningChip label="残り時間わずか" />}
    </HeaderCenter>
    <HeaderSpacer />
  </Header>
);

/** セクションの進行状況サイドバーを表示する。 */
const ExamSidebar = ({ sections, sectionIndex }: ExamSidebarProps) => (
  <SectionPanel>
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} alignItems="center">
        <SectionTitle variant="subtitle1">セクション構成</SectionTitle>
        <SectionCount variant="caption">全{sections.length}件</SectionCount>
      </Stack>
      <Stack spacing={1}>
        {sections.map((section, index) => {
          const isCurrent = index === sectionIndex;
          const isComplete = index < sectionIndex;
          const status = isCurrent
            ? "current"
            : isComplete
              ? "complete"
              : "pending";

          return (
            <SectionRow
              key={section.sectionId}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              status={status}
              data-testid={`candidate-section-${section.code}`}
            >
              <Stack>
                <SectionName>{section.name}</SectionName>
                <SectionTime variant="caption">
                  目安時間: {Math.ceil(section.durationSeconds / 60)}分
                </SectionTime>
              </Stack>
              <SectionStatusChip
                status={status}
                label={isCurrent ? "実施中" : isComplete ? "完了" : "未開始"}
              />
            </SectionRow>
          );
        })}
      </Stack>
    </Stack>
  </SectionPanel>
);

/** 問題と回答エリアを表示するメインパネル。 */
const ExamMainPanel = ({
  activeItem,
  activeIndex,
  sectionItemsCount,
  progressValue,
  isLocked,
  lockedMessage,
  showAnswerRequired,
  saveMessage,
  answers,
  isSaving,
  isSubmitting,
  isLastQuestion,
  isLastSection,
  onSelectOption,
  onPrev,
  onNext,
  onOpenSubmitConfirm,
}: ExamMainPanelProps) => (
  <ExamContent>
    <ExitAlert severity="info" data-testid="candidate-exit-warning">
      試験中は画面を閉じないでください。終了や移動を行うと、回答内容が失われる可能性があります。
    </ExitAlert>
    {isLocked && (
      <Alert severity="warning" data-testid="candidate-locked-alert">
        {lockedMessage}
      </Alert>
    )}
    <Box>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1} alignItems="baseline">
          <ProgressTitle variant="h5" data-testid="candidate-current-question">
            問 {activeIndex + 1}
          </ProgressTitle>
          <ProgressCount variant="body2">/ {sectionItemsCount}</ProgressCount>
        </Stack>
        <ProgressText variant="body2">{progressValue}% 完了</ProgressText>
      </Stack>
      <ProgressBar variant="determinate" value={progressValue} />
    </Box>

    <QuestionCard>
      <Stack spacing={2}>
        <QuestionTitle variant="h6" data-testid="candidate-question-stem">
          {activeItem.question.stem}
        </QuestionTitle>
        <InstructionText>
          問題文を読み、最も適切な選択肢を選んでください。
        </InstructionText>
      </Stack>
    </QuestionCard>

    <AnswerCard>
      <Stack spacing={2}>
        <AnswerLabel variant="caption">選択肢</AnswerLabel>
        {showAnswerRequired && (
          <Alert severity="warning">回答を選択してください。</Alert>
        )}
        {saveMessage && <Alert severity="success">{saveMessage}</Alert>}
        {activeItem.question.options.map((option) => {
          const isSelected = answers[activeItem.attemptItemId] === option.id;
          return (
            <OptionCard
              key={option.id}
              variant="outlined"
              selected={isSelected}
              locked={isLocked}
              data-testid={`candidate-option-${option.position}`}
              onClick={() => onSelectOption(option.id)}
            >
              <OptionIndicator selected={isSelected} />
              <OptionText>{option.optionText}</OptionText>
            </OptionCard>
          );
        })}
      </Stack>
    </AnswerCard>

    <Stack direction="row" spacing={2} justifyContent="flex-end">
      <PrevButton
        variant="outlined"
        data-testid="candidate-prev-question"
        onClick={onPrev}
        disabled={isSaving || activeIndex === 0 || isLocked}
      >
        {isSaving ? "保存中..." : "前の問題"}
      </PrevButton>
      {isLastQuestion && isLastSection ? (
        <SubmitButton
          variant="contained"
          data-testid="candidate-submit-exam"
          onClick={onOpenSubmitConfirm}
          disabled={isSaving || isSubmitting || isLocked}
        >
          {isSubmitting ? "提出中..." : "提出する"}
        </SubmitButton>
      ) : (
        <NextButton
          variant="contained"
          data-testid="candidate-next-question"
          onClick={onNext}
          disabled={isSaving || isLocked}
        >
          {isSaving
            ? "保存中..."
            : isLastQuestion
              ? "次のセクションへ"
              : "次の問題へ"}
        </NextButton>
      )}
    </Stack>
  </ExamContent>
);

export { ExamFrame, ExamHeader, ExamLayout, ExamMainPanel, ExamSidebar };
export type { ExamSectionSnapshot, ExamQuestionItem };
