"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";

type CandidateSummary = {
  candidateId: string;
  fullName: string;
  email: string | null;
  education: string | null;
  birthDate: string;
  updatedAt: string;
};

type CandidateDetail = CandidateSummary;

type CandidateForm = {
  fullName: string;
  email: string;
  education: string;
  birthDate: string;
};

const Root = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(5),
  },
}));

const PageTitle = styled(Typography)({
  fontWeight: 900,
});

const PageSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  marginTop: theme.spacing(1),
}));

const ContentGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(3),
  alignItems: "start",
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "minmax(0, 320px) 1fr",
  },
}));

const SearchPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(3),
}));

const SearchActionButton = styled(Button)({
  fontWeight: 700,
});

const CandidateListTitle = styled(Typography)({
  fontWeight: 700,
});

const CandidateList = styled(Stack)({
  maxHeight: 360,
  overflowY: "auto",
});

const CandidateCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
  cursor: "pointer",
  borderColor: selected ? "#137fec" : theme.palette.grey[300],
  backgroundColor: selected ? "rgba(19, 127, 236, 0.08)" : "#ffffff",
}));

const DetailPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(3.5),
  },
}));

const SectionTitle = styled(Typography)({
  fontWeight: 800,
});

const EmptyStateCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  backgroundColor: "rgba(148, 163, 184, 0.08)",
}));

const EmptyActionButton = styled(Button)({
  alignSelf: "flex-start",
  fontWeight: 700,
});

const InfoCard = styled(Paper)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const InfoValue = styled(Typography)({
  fontWeight: 600,
});

const SummaryCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
}));

const SummaryTitle = styled(Typography)({
  fontWeight: 700,
});

const SaveActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

const SaveButton = styled(Button)({
  fontWeight: 700,
});

/** 候補者フォームの初期値を返す。 */
const emptyForm = (): CandidateForm => ({
  fullName: "",
  email: "",
  education: "",
  birthDate: "",
});

/** DateTime文字列から日付入力用の値を取り出す。 */
const toDateInputValue = (value: string) => value.split("T")[0] ?? value;

/** 候補者管理の一覧と詳細フォームを表示する。 */
export default function StaffCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [candidateIdQuery, setCandidateIdQuery] = useState("");
  const [formState, setFormState] = useState<CandidateForm>(emptyForm());
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const isSaveDisabled =
    (!isCreating && !selectedCandidateId) ||
    !formState.fullName.trim() ||
    !formState.birthDate.trim();
  const isFormActive = isCreating || Boolean(selectedCandidateId);

  const selectedCandidate = useMemo(
    () =>
      candidates.find(
        (candidate) => candidate.candidateId === selectedCandidateId,
      ) ?? null,
    [candidates, selectedCandidateId],
  );

  const fetchCandidates = async () => {
    setListError(null);
    try {
      const params = new URLSearchParams();
      if (nameQuery.trim()) {
        params.set("name", nameQuery.trim());
      }
      if (candidateIdQuery.trim()) {
        params.set("candidateId", candidateIdQuery.trim());
      }
      const response = await fetch(
        `/api/staff/candidates?${params.toString()}`,
        { credentials: "include" },
      );
      if (!response.ok) {
        setListError(
          response.status === 403
            ? "候補者一覧の権限がありません。"
            : "候補者一覧の取得に失敗しました。",
        );
        return;
      }
      const payload = (await response.json()) as {
        candidates: CandidateSummary[];
      };
      setCandidates(payload.candidates);
    } catch {
      setListError("通信に失敗しました。");
    }
  };

  const loadCandidateDetail = async (candidateId: string) => {
    setFormError(null);
    try {
      const response = await fetch(`/api/staff/candidates/${candidateId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        setFormError(
          response.status === 404
            ? "候補者が見つかりません。"
            : response.status === 403
              ? "候補者の権限がありません。"
              : "候補者の取得に失敗しました。",
        );
        return;
      }
      const payload = (await response.json()) as { candidate: CandidateDetail };
      setFormState({
        fullName: payload.candidate.fullName,
        email: payload.candidate.email ?? "",
        education: payload.candidate.education ?? "",
        birthDate: toDateInputValue(payload.candidate.birthDate),
      });
    } catch {
      setFormError("通信に失敗しました。");
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!selectedCandidateId) {
      return;
    }
    loadCandidateDetail(selectedCandidateId);
  }, [selectedCandidateId]);

  const handleSelectCandidate = (candidateId: string) => {
    setIsCreating(false);
    setFormError(null);
    setFormMessage(null);
    setSelectedCandidateId(candidateId);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setSelectedCandidateId(null);
    setFormError(null);
    setFormMessage(null);
    setFormState(emptyForm());
  };

  const handleSave = async () => {
    setFormError(null);
    setFormMessage(null);

    const payload = {
      fullName: formState.fullName.trim(),
      email: formState.email.trim() || null,
      education: formState.education.trim() || null,
      birthDate: formState.birthDate.trim(),
    };

    if (!payload.fullName || !payload.birthDate) {
      setFormError("氏名と生年月日は必須です。");
      return;
    }

    const endpoint = isCreating
      ? "/api/staff/candidates"
      : `/api/staff/candidates/${selectedCandidateId}`;
    const method = isCreating ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setFormError("候補者情報の保存に失敗しました。");
        return;
      }
      const result = (await response.json()) as { candidateId: string };
      setFormMessage(isCreating ? "候補者を登録しました。" : "更新しました。");
      await fetchCandidates();
      setIsCreating(false);
      setSelectedCandidateId(result.candidateId);
    } catch {
      setFormError("通信に失敗しました。");
    }
  };

  return (
    <Root
      data-testid="staff-candidates-page"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <PageTitle variant="h4">候補者管理</PageTitle>
            <PageSubtitle variant="body1">
              候補者情報の登録・検索・編集を行います。
            </PageSubtitle>
          </Box>

          <ContentGrid>
            <SearchPanel>
              <Stack spacing={2}>
                <Stack spacing={1.5}>
                  <TextField
                    label="氏名"
                    value={nameQuery}
                    onChange={(event) => setNameQuery(event.target.value)}
                    fullWidth
                    size="small"
                    inputProps={{
                      "data-testid": "staff-candidates-search-name",
                    }}
                  />
                  <TextField
                    label="Candidate ID"
                    value={candidateIdQuery}
                    onChange={(event) =>
                      setCandidateIdQuery(event.target.value)
                    }
                    fullWidth
                    size="small"
                    inputProps={{
                      "data-testid": "staff-candidates-search-id",
                    }}
                  />
                  <Stack direction="row" spacing={1.5}>
                    <SearchActionButton
                      variant="contained"
                      onClick={fetchCandidates}
                      data-testid="staff-candidates-search-submit"
                    >
                      検索
                    </SearchActionButton>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setNameQuery("");
                        setCandidateIdQuery("");
                        fetchCandidates();
                      }}
                      data-testid="staff-candidates-search-clear"
                    >
                      クリア
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                <Button
                  variant="outlined"
                  onClick={handleCreate}
                  data-testid="staff-candidates-new"
                >
                  新規作成
                </Button>

                <CandidateListTitle variant="subtitle2">
                  候補者一覧 ({candidates.length}件)
                </CandidateListTitle>
                {listError && <Alert severity="error">{listError}</Alert>}
                <CandidateList spacing={1} data-testid="staff-candidates-list">
                  {candidates.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      候補者が登録されていません。
                    </Typography>
                  ) : (
                    candidates.map((candidate) => (
                      <CandidateCard
                        key={candidate.candidateId}
                        variant="outlined"
                        selected={candidate.candidateId === selectedCandidateId}
                        onClick={() =>
                          handleSelectCandidate(candidate.candidateId)
                        }
                        data-testid="staff-candidates-item"
                      >
                        <CandidateListTitle variant="subtitle2">
                          {candidate.fullName}
                        </CandidateListTitle>
                        <Typography variant="caption" color="text.secondary">
                          {candidate.candidateId}
                        </Typography>
                        {candidate.email && (
                          <Typography variant="caption" color="text.secondary">
                            {candidate.email}
                          </Typography>
                        )}
                      </CandidateCard>
                    ))
                  )}
                </CandidateList>
              </Stack>
            </SearchPanel>

            <DetailPanel>
              <Stack spacing={2.5}>
                <Box>
                  <SectionTitle variant="h6">
                    {isCreating
                      ? "新規候補者の登録"
                      : selectedCandidate
                        ? "候補者詳細"
                        : "候補者を選択"}
                  </SectionTitle>
                  <Typography variant="body2" color="text.secondary">
                    {isCreating
                      ? "候補者情報を入力して登録します。"
                      : selectedCandidate
                        ? "候補者の情報を確認・編集します。"
                        : "一覧から候補者を選ぶか、新規作成を開始してください。"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    候補者の作成・編集は ADMIN のみが実行できます。
                  </Typography>
                </Box>

                {!isFormActive && (
                  <EmptyStateCard variant="outlined">
                    <Stack spacing={2}>
                      <Typography variant="body2" color="text.secondary">
                        候補者が選択されていません。
                      </Typography>
                      <EmptyActionButton
                        variant="contained"
                        onClick={handleCreate}
                        data-testid="staff-candidates-empty-create"
                      >
                        新規候補者を登録する
                      </EmptyActionButton>
                    </Stack>
                  </EmptyStateCard>
                )}

                {selectedCandidate && !isCreating && (
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <InfoCard>
                        <InfoLabel variant="overline">Candidate ID</InfoLabel>
                        <InfoValue variant="body2">
                          {selectedCandidate.candidateId}
                        </InfoValue>
                      </InfoCard>
                      <InfoCard>
                        <InfoLabel variant="overline">更新日時</InfoLabel>
                        <InfoValue variant="body2">
                          {new Date(selectedCandidate.updatedAt).toLocaleString(
                            "ja-JP",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </InfoValue>
                      </InfoCard>
                    </Stack>
                    <SummaryCard>
                      <Stack spacing={1}>
                        <SummaryTitle variant="subtitle2">
                          登録情報
                        </SummaryTitle>
                        <Typography variant="body2">
                          氏名: {formState.fullName || "-"}
                        </Typography>
                        <Typography variant="body2">
                          生年月日: {formState.birthDate || "-"}
                        </Typography>
                        <Typography variant="body2">
                          メール: {formState.email || "-"}
                        </Typography>
                        <Typography variant="body2">
                          学歴: {formState.education || "-"}
                        </Typography>
                      </Stack>
                    </SummaryCard>
                  </Stack>
                )}

                {isFormActive && (
                  <>
                    <Stack spacing={2}>
                      <TextField
                        label="氏名"
                        value={formState.fullName}
                        onChange={(event) =>
                          setFormState((previous) => ({
                            ...previous,
                            fullName: event.target.value,
                          }))
                        }
                        fullWidth
                        required
                        inputProps={{
                          "data-testid": "staff-candidate-full-name",
                        }}
                      />
                      <TextField
                        label="メールアドレス"
                        value={formState.email}
                        onChange={(event) =>
                          setFormState((previous) => ({
                            ...previous,
                            email: event.target.value,
                          }))
                        }
                        fullWidth
                        inputProps={{ "data-testid": "staff-candidate-email" }}
                      />
                      <TextField
                        label="学歴"
                        value={formState.education}
                        onChange={(event) =>
                          setFormState((previous) => ({
                            ...previous,
                            education: event.target.value,
                          }))
                        }
                        fullWidth
                        inputProps={{
                          "data-testid": "staff-candidate-education",
                        }}
                      />
                      <TextField
                        label="生年月日"
                        type="date"
                        value={formState.birthDate}
                        onChange={(event) =>
                          setFormState((previous) => ({
                            ...previous,
                            birthDate: event.target.value,
                          }))
                        }
                        fullWidth
                        required
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          "data-testid": "staff-candidate-birth-date",
                        }}
                      />
                    </Stack>

                    {formError && (
                      <Alert
                        severity="error"
                        data-testid="staff-candidate-error"
                      >
                        {formError}
                      </Alert>
                    )}
                    {formMessage && (
                      <Alert
                        severity="success"
                        data-testid="staff-candidate-message"
                      >
                        {formMessage}
                      </Alert>
                    )}

                    <SaveActions>
                      <SaveButton
                        variant="contained"
                        onClick={handleSave}
                        disabled={isSaveDisabled}
                        data-testid="staff-candidate-save"
                      >
                        保存
                      </SaveButton>
                    </SaveActions>
                  </>
                )}
              </Stack>
            </DetailPanel>
          </ContentGrid>
        </Stack>
      </Container>
    </Root>
  );
}
