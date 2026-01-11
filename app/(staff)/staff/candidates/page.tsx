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

const emptyForm = (): CandidateForm => ({
  fullName: "",
  email: "",
  education: "",
  birthDate: "",
});

const toDateInputValue = (value: string) => value.split("T")[0] ?? value;

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
    <Box
      sx={{ py: { xs: 3, md: 5 } }}
      data-testid="staff-candidates-page"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              候補者管理
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
              候補者情報の登録・検索・編集を行います。
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 320px) 1fr" },
              gap: 3,
              alignItems: "start",
            }}
          >
            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
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
                    <Button
                      variant="contained"
                      onClick={fetchCandidates}
                      data-testid="staff-candidates-search-submit"
                      sx={{ fontWeight: 700 }}
                    >
                      検索
                    </Button>
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

                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  候補者一覧 ({candidates.length}件)
                </Typography>
                {listError && <Alert severity="error">{listError}</Alert>}
                <Stack
                  spacing={1}
                  sx={{ maxHeight: 360, overflowY: "auto" }}
                  data-testid="staff-candidates-list"
                >
                  {candidates.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      候補者が登録されていません。
                    </Typography>
                  ) : (
                    candidates.map((candidate) => (
                      <Paper
                        key={candidate.candidateId}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          cursor: "pointer",
                          borderColor:
                            candidate.candidateId === selectedCandidateId
                              ? "#137fec"
                              : "#e2e8f0",
                          bgcolor:
                            candidate.candidateId === selectedCandidateId
                              ? "rgba(19, 127, 236, 0.08)"
                              : "#ffffff",
                        }}
                        onClick={() =>
                          handleSelectCandidate(candidate.candidateId)
                        }
                        data-testid="staff-candidates-item"
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {candidate.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {candidate.candidateId}
                        </Typography>
                        {candidate.email && (
                          <Typography variant="caption" color="text.secondary">
                            {candidate.email}
                          </Typography>
                        )}
                      </Paper>
                    ))
                  )}
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {isCreating
                      ? "新規候補者の登録"
                      : selectedCandidate
                        ? "候補者詳細"
                        : "候補者を選択"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isCreating
                      ? "候補者情報を入力して登録します。"
                      : "候補者の情報を確認・編集します。"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    候補者の作成・編集は ADMIN のみが実行できます。
                  </Typography>
                </Box>

                {selectedCandidate && !isCreating && (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Paper sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                      <Typography variant="overline" sx={{ color: "#64748b" }}>
                        Candidate ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedCandidate.candidateId}
                      </Typography>
                    </Paper>
                    <Paper sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                      <Typography variant="overline" sx={{ color: "#64748b" }}>
                        更新日時
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                      </Typography>
                    </Paper>
                  </Stack>
                )}

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
                    inputProps={{ "data-testid": "staff-candidate-full-name" }}
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
                    inputProps={{ "data-testid": "staff-candidate-education" }}
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
                  <Alert severity="error" data-testid="staff-candidate-error">
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

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={isSaveDisabled}
                    data-testid="staff-candidate-save"
                    sx={{ fontWeight: 700 }}
                  >
                    保存
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
