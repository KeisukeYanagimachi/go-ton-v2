"use client";

import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Link from "next/link";

import MutedText from "@app/ui/MutedText";
import Panel from "@app/ui/Panel";
import SectionTitle from "@app/ui/SectionTitle";

import type {
  ExamSummary,
  ExamVersionSummary,
  ModuleMaster,
  QuestionSummary,
} from "./types";

type ExamVersionOption = {
  examVersionId: string;
  label: string;
  status: string;
  modules: ExamVersionSummary["modules"];
};

type AssignmentQuestion = {
  examVersionQuestionId: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  questionId: string;
  questionStem: string;
  position: number;
  points: number;
};

type ExamListPanelProps = {
  examSearch: string;
  filteredExams: ExamSummary[];
  selectedExamId: string;
  onExamSearchChange: (value: string) => void;
  onSelectExam: (examId: string) => void;
};

type ExamDetailPanelProps = {
  selectedExam: ExamSummary | null;
  visibleVersions: ExamVersionSummary[];
  selectedVersionId: string;
  showAllVersions: boolean;
  onToggleShowAllVersions: () => void;
  onSelectVersion: (examVersionId: string) => void;
  onPublishVersion: (examVersionId: string) => void;
  onArchiveVersion: (examVersionId: string) => void;
};

type ExamVersionFormProps = {
  exams: ExamSummary[];
  selectedExamId: string;
  versionNumber: number;
  requiredModules: ModuleMaster[];
  moduleMinutes: Record<string, number>;
  onSelectExam: (examId: string) => void;
  onVersionNumberChange: (value: number) => void;
  onModuleMinutesChange: (moduleId: string, minutes: number) => void;
  onCreateVersion: () => void;
};

type ExamAssignmentPanelProps = {
  assignmentError: string | null;
  assignmentMessage: string | null;
  versionOptions: ExamVersionOption[];
  selectedVersionId: string;
  selectedModuleId: string;
  selectedVersionModules: ExamVersionSummary["modules"];
  questionSearch: string;
  filteredQuestions: QuestionSummary[];
  selectedQuestionId: string;
  questionPosition: number;
  questionPoints: number;
  assignedQuestions: AssignmentQuestion[];
  selectedVersionStatus?: string;
  selectedQuestionStem: string | null;
  onSelectVersionId: (value: string) => void;
  onSelectModuleId: (value: string) => void;
  onQuestionSearchChange: (value: string) => void;
  onSelectQuestionId: (value: string) => void;
  onQuestionPositionChange: (value: number) => void;
  onQuestionPointsChange: (value: number) => void;
  onAssignQuestion: () => void;
  onRemoveQuestion: (examVersionQuestionId: string) => void;
};

type ExamCreatePanelProps = {
  examName: string;
  examDescription: string;
  onExamNameChange: (value: string) => void;
  onExamDescriptionChange: (value: string) => void;
  onCreateExam: () => void;
};

const SidebarPanel = styled(Panel)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(2.5),
  display: "flex",
  flexDirection: "column",
  [theme.breakpoints.up("lg")]: {
    width: 360,
    minHeight: "calc(100vh - 280px)",
  },
}));

const SidebarContent = styled(Stack)({
  flex: 1,
  minHeight: 0,
});

const ExamListScroll = styled(Stack)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingRight: theme.spacing(1),
  maxHeight: 420,
  [theme.breakpoints.up("lg")]: {
    maxHeight: "calc(100vh - 360px)",
  },
}));

const ExamCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
  borderColor: selected ? "#1d4ed8" : undefined,
  backgroundColor: selected ? "#eff6ff" : "#fff",
}));

const ExamCardTitle = styled(SectionTitle)({
  fontWeight: 700,
});

const ExamSelectButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const DetailTitle = styled(SectionTitle)({
  fontWeight: 700,
});

const DetailDescription = styled(MutedText)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const InlineNote = styled(MutedText)(({ theme }) => ({
  display: "block",
  marginTop: theme.spacing(1),
}));

const PanelTitle = styled(SectionTitle)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const SectionDescription = styled(MutedText)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const AlignStartButton = styled(Button)({
  alignSelf: "flex-start",
});

const AssignmentAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const VersionCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  borderColor: selected ? "#1d4ed8" : theme.palette.divider,
}));

const VersionTitle = styled(SectionTitle)({
  fontWeight: 700,
});

const ArchiveButton = styled(Button)({
  backgroundColor: "#111418",
});

const ModuleBadgeRow = styled(Stack)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
}));

const ModuleBadge = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  borderRadius: 999,
  backgroundColor: "#f1f5f9",
  fontSize: 12,
}));

const AssignmentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
}));

const SearchRow = styled(Stack)({
  flexWrap: "wrap",
});

const SearchField = styled(TextField)({
  flex: 1,
  minWidth: 240,
});

const ClearButton = styled(Button)({
  height: 56,
  whiteSpace: "nowrap",
});

const AssignButton = styled(Button)({
  minWidth: 120,
});

const SelectedQuestionBox = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  backgroundColor: "#f8fafc",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
}));

const ModulePanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
}));

const ModuleTitle = styled(SectionTitle)({
  fontWeight: 700,
});

const ModuleQuestionStack = styled(Stack)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
}));

const QuestionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
}));

const QuestionTitle = styled(SectionTitle)({
  fontWeight: 700,
});

/** 試験マスタを新規作成するフォーム。 */
const ExamCreatePanel = ({
  examName,
  examDescription,
  onExamNameChange,
  onExamDescriptionChange,
  onCreateExam,
}: ExamCreatePanelProps) => (
  <Panel>
    <SectionTitle variant="h6" weight={700}>
      新規作成
    </SectionTitle>
    <SectionDescription variant="body2">
      既存の試験に関係なく、新しく試験マスタを作成します。
    </SectionDescription>
    <Stack spacing={2}>
      <TextField
        label="試験名"
        value={examName}
        onChange={(event) => onExamNameChange(event.target.value)}
        fullWidth
        inputProps={{ "data-testid": "exam-create-name" }}
      />
      <TextField
        label="説明（任意）"
        value={examDescription}
        onChange={(event) => onExamDescriptionChange(event.target.value)}
        fullWidth
        inputProps={{ "data-testid": "exam-create-description" }}
      />
      <AlignStartButton
        variant="contained"
        onClick={onCreateExam}
        data-testid="exam-create-submit"
      >
        作成
      </AlignStartButton>
    </Stack>
  </Panel>
);

/** 試験一覧の検索と選択を行うパネル。 */
const ExamListPanel = ({
  examSearch,
  filteredExams,
  selectedExamId,
  onExamSearchChange,
  onSelectExam,
}: ExamListPanelProps) => (
  <SidebarPanel>
    <SidebarContent spacing={2}>
      <SectionTitle variant="subtitle1" weight={700}>
        試験一覧
      </SectionTitle>
      <TextField
        label="試験名・IDで検索"
        value={examSearch}
        onChange={(event) => onExamSearchChange(event.target.value)}
        fullWidth
        inputProps={{ "data-testid": "exam-search" }}
      />
      <ExamListScroll spacing={1}>
        {filteredExams.map((exam) => {
          const isSelected = exam.examId === selectedExamId;
          return (
            <ExamCard
              key={exam.examId}
              variant={isSelected ? "outlined" : "elevation"}
              selected={isSelected}
            >
              <Stack spacing={0.5}>
                <ExamCardTitle variant="subtitle2">{exam.name}</ExamCardTitle>
                <MutedText variant="caption">ID: {exam.examId}</MutedText>
                <MutedText variant="caption">
                  バージョン数: {exam.versions.length}
                </MutedText>
              </Stack>
              <ExamSelectButton
                size="small"
                variant={isSelected ? "contained" : "outlined"}
                onClick={() => onSelectExam(exam.examId)}
                data-testid={`exam-select-${exam.examId}`}
              >
                {isSelected ? "選択中" : "詳細を見る"}
              </ExamSelectButton>
            </ExamCard>
          );
        })}
        {filteredExams.length === 0 && (
          <MutedText variant="body2">該当する試験がありません。</MutedText>
        )}
      </ExamListScroll>
    </SidebarContent>
  </SidebarPanel>
);

/** 試験詳細とバージョン操作を表示するパネル。 */
const ExamDetailPanel = ({
  selectedExam,
  visibleVersions,
  selectedVersionId,
  showAllVersions,
  onToggleShowAllVersions,
  onSelectVersion,
  onPublishVersion,
  onArchiveVersion,
}: ExamDetailPanelProps) => (
  <Panel>
    <PanelTitle variant="h6" weight={700}>
      試験詳細
    </PanelTitle>
    {selectedExam ? (
      <Stack spacing={2}>
        <Box>
          <DetailTitle variant="subtitle1">{selectedExam.name}</DetailTitle>
          <MutedText variant="caption">ID: {selectedExam.examId}</MutedText>
          {selectedExam.description && (
            <DetailDescription variant="body2">
              {selectedExam.description}
            </DetailDescription>
          )}
          <InlineNote variant="caption">
            編集は新しいバージョンを追加する操作です。
          </InlineNote>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <DetailTitle variant="subtitle2">バージョン</DetailTitle>
          <Button
            size="small"
            variant="outlined"
            onClick={onToggleShowAllVersions}
          >
            {showAllVersions ? "過去バージョンを隠す" : "過去バージョンを表示"}
          </Button>
        </Stack>
        <Stack spacing={1.5}>
          {visibleVersions.map((version) => (
            <VersionCard
              key={version.examVersionId}
              variant="outlined"
              selected={version.examVersionId === selectedVersionId}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <VersionTitle variant="body1">
                    Version {version.versionNumber}
                  </VersionTitle>
                  <MutedText variant="body2">状態: {version.status}</MutedText>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant={
                      version.examVersionId === selectedVersionId
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => onSelectVersion(version.examVersionId)}
                  >
                    {version.examVersionId === selectedVersionId
                      ? "選択中"
                      : "割当対象にする"}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onPublishVersion(version.examVersionId)}
                    disabled={version.status !== "DRAFT"}
                  >
                    公開
                  </Button>
                  <ArchiveButton
                    size="small"
                    variant="contained"
                    onClick={() => onArchiveVersion(version.examVersionId)}
                    disabled={version.status !== "PUBLISHED"}
                  >
                    アーカイブ
                  </ArchiveButton>
                </Stack>
              </Stack>
              <ModuleBadgeRow
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
              >
                {version.modules.map((module) => (
                  <ModuleBadge key={module.moduleId}>
                    {module.code} · {Math.round(module.durationSeconds / 60)}分
                  </ModuleBadge>
                ))}
              </ModuleBadgeRow>
            </VersionCard>
          ))}
          {selectedExam.versions.length === 0 && (
            <MutedText variant="body2">
              該当するバージョンがありません。
            </MutedText>
          )}
        </Stack>
      </Stack>
    ) : (
      <MutedText variant="body2">
        左の一覧から試験を選択してください。
      </MutedText>
    )}
  </Panel>
);

/** 既存試験に新しいバージョンを追加するフォーム。 */
const ExamVersionForm = ({
  exams,
  selectedExamId,
  versionNumber,
  requiredModules,
  moduleMinutes,
  onSelectExam,
  onVersionNumberChange,
  onModuleMinutesChange,
  onCreateVersion,
}: ExamVersionFormProps) => (
  <Panel>
    <SectionTitle variant="h6" weight={700}>
      既存試験の更新（バージョン追加）
    </SectionTitle>
    <SectionDescription variant="body2">
      試験詳細から対象試験を選択し、新しいバージョンを追加します。
    </SectionDescription>
    <Stack spacing={2}>
      <TextField
        select
        label="対象試験"
        value={selectedExamId}
        onChange={(event) => onSelectExam(event.target.value)}
        fullWidth
        inputProps={{ "data-testid": "exam-version-exam" }}
      >
        {exams.map((exam) => (
          <MenuItem key={exam.examId} value={exam.examId}>
            {exam.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="バージョン番号"
        type="number"
        value={versionNumber}
        onChange={(event) => onVersionNumberChange(Number(event.target.value))}
        fullWidth
        inputProps={{
          min: 1,
          "data-testid": "exam-version-number",
        }}
      />
      <Stack spacing={1}>
        {requiredModules.map((module) => (
          <TextField
            key={module.moduleId}
            label={`${module.name}（分）`}
            type="number"
            value={moduleMinutes[module.moduleId] ?? 30}
            onChange={(event) =>
              onModuleMinutesChange(module.moduleId, Number(event.target.value))
            }
            fullWidth
            inputProps={{
              min: 1,
              "data-testid": `exam-version-module-${module.code}`,
            }}
          />
        ))}
      </Stack>
      <AlignStartButton
        variant="contained"
        onClick={onCreateVersion}
        data-testid="exam-version-create-submit"
      >
        バージョン追加
      </AlignStartButton>
    </Stack>
  </Panel>
);

/** 出題割当の作成・削除を行うパネル。 */
const ExamAssignmentPanel = ({
  assignmentError,
  assignmentMessage,
  versionOptions,
  selectedVersionId,
  selectedModuleId,
  selectedVersionModules,
  questionSearch,
  filteredQuestions,
  selectedQuestionId,
  questionPosition,
  questionPoints,
  assignedQuestions,
  selectedVersionStatus,
  selectedQuestionStem,
  onSelectVersionId,
  onSelectModuleId,
  onQuestionSearchChange,
  onSelectQuestionId,
  onQuestionPositionChange,
  onQuestionPointsChange,
  onAssignQuestion,
  onRemoveQuestion,
}: ExamAssignmentPanelProps) => (
  <Panel>
    <PanelTitle variant="h6" weight={700}>
      出題割当（DRAFT のみ）
    </PanelTitle>
    {(assignmentError || assignmentMessage) && (
      <AssignmentAlert severity={assignmentError ? "error" : "success"}>
        {assignmentError ?? assignmentMessage}
      </AssignmentAlert>
    )}
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField
          select
          label="対象バージョン"
          value={selectedVersionId}
          onChange={(event) => onSelectVersionId(event.target.value)}
          fullWidth
          inputProps={{ "data-testid": "exam-question-version" }}
        >
          {versionOptions.map((version) => (
            <MenuItem key={version.examVersionId} value={version.examVersionId}>
              {version.label}（{version.status}）
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="モジュール"
          value={selectedModuleId}
          onChange={(event) => onSelectModuleId(event.target.value)}
          fullWidth
          inputProps={{ "data-testid": "exam-question-module" }}
        >
          {selectedVersionModules.map((module) => (
            <MenuItem key={module.moduleId} value={module.moduleId}>
              {module.code}（{module.name}）
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <AssignmentCard variant="outlined">
        <Stack spacing={2}>
          <SearchRow direction="row" spacing={2} alignItems="center">
            <SearchField
              label="問題を検索（選択モジュール内）"
              value={questionSearch}
              onChange={(event) => onQuestionSearchChange(event.target.value)}
              fullWidth
              inputProps={{ "data-testid": "exam-question-search" }}
            />
            <ClearButton
              variant="outlined"
              onClick={() => onQuestionSearchChange("")}
              data-testid="exam-question-search-clear"
            >
              検索をクリア
            </ClearButton>
          </SearchRow>
          <MutedText variant="caption">空欄で全件表示されます。</MutedText>
          <TextField
            select
            label="問題"
            value={selectedQuestionId || ""}
            onChange={(event) => onSelectQuestionId(event.target.value)}
            fullWidth
            disabled={filteredQuestions.length === 0}
            inputProps={{ "data-testid": "exam-question-id" }}
          >
            {filteredQuestions.length === 0 ? (
              <MenuItem value="" disabled>
                該当モジュールの問題がありません。
              </MenuItem>
            ) : (
              filteredQuestions.map((question) => (
                <MenuItem key={question.questionId} value={question.questionId}>
                  {question.stem.slice(0, 50)}
                </MenuItem>
              ))
            )}
          </TextField>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="順序"
              type="number"
              value={questionPosition}
              onChange={(event) =>
                onQuestionPositionChange(Number(event.target.value))
              }
              fullWidth
              inputProps={{
                min: 1,
                "data-testid": "exam-question-position",
              }}
            />
            <TextField
              label="配点"
              type="number"
              value={questionPoints}
              onChange={(event) =>
                onQuestionPointsChange(Number(event.target.value))
              }
              fullWidth
              inputProps={{
                min: 1,
                "data-testid": "exam-question-points",
              }}
            />
            <AssignButton
              variant="contained"
              onClick={onAssignQuestion}
              disabled={selectedVersionStatus !== "DRAFT"}
              data-testid="exam-question-assign"
            >
              追加
            </AssignButton>
          </Stack>
          {selectedQuestionId ? (
            <SelectedQuestionBox>
              <MutedText variant="caption">選択中の問題</MutedText>
              <Typography variant="body2" fontWeight={600}>
                {selectedQuestionStem ?? "問題が選択されていません。"}
              </Typography>
            </SelectedQuestionBox>
          ) : (
            <MutedText variant="body2">問題を選択してください。</MutedText>
          )}
        </Stack>
      </AssignmentCard>
      <Stack spacing={2}>
        {selectedVersionModules.map((module) => {
          const moduleQuestions = assignedQuestions
            .filter((question) => question.moduleId === module.moduleId)
            .sort((a, b) => a.position - b.position);
          return (
            <ModulePanel key={module.moduleId} variant="outlined">
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                justifyContent="space-between"
              >
                <Box>
                  <ModuleTitle variant="subtitle2">
                    {module.code}（{module.name}）
                  </ModuleTitle>
                  <MutedText variant="caption">
                    出題数: {moduleQuestions.length}
                  </MutedText>
                </Box>
              </Stack>
              <ModuleQuestionStack spacing={1}>
                {moduleQuestions.map((question) => (
                  <QuestionCard
                    key={question.examVersionQuestionId}
                    variant="outlined"
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      alignItems={{
                        xs: "flex-start",
                        md: "center",
                      }}
                      justifyContent="space-between"
                    >
                      <Box>
                        <QuestionTitle variant="body2">
                          問 {question.position}
                        </QuestionTitle>
                        <MutedText variant="body2">
                          {question.questionStem}
                        </MutedText>
                      </Box>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body2">
                          配点: {question.points}
                        </Typography>
                        <Button
                          size="small"
                          variant="text"
                          component={Link}
                          href={`/staff/questions?questionId=${question.questionId}`}
                          data-testid={`exam-question-detail-${question.examVersionQuestionId}`}
                        >
                          詳細
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={selectedVersionStatus !== "DRAFT"}
                          onClick={() =>
                            onRemoveQuestion(question.examVersionQuestionId)
                          }
                          data-testid={`exam-question-remove-${question.examVersionQuestionId}`}
                        >
                          削除
                        </Button>
                      </Stack>
                    </Stack>
                  </QuestionCard>
                ))}
                {moduleQuestions.length === 0 && (
                  <MutedText variant="body2">
                    出題がまだ割り当てられていません。
                  </MutedText>
                )}
              </ModuleQuestionStack>
            </ModulePanel>
          );
        })}
      </Stack>
    </Stack>
  </Panel>
);

export {
  ExamAssignmentPanel,
  ExamCreatePanel,
  ExamDetailPanel,
  ExamListPanel,
  ExamVersionForm,
};
export type { AssignmentQuestion, ExamVersionOption };
