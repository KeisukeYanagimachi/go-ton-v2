"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

type CandidateAssignment = {
  candidateId: string;
  fullName: string;
  assignment: {
    slotId: string;
    startsAt: string;
    endsAt: string;
  } | null;
};

type VisitSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
};

const baseStyles = {
  minHeight: "100vh",
  bgcolor: "#f6f7f8",
  color: "#111418",
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function StaffVisitAssignmentsPage() {
  const [candidates, setCandidates] = useState<CandidateAssignment[]>([]);
  const [slots, setSlots] = useState<VisitSlot[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.candidateId === candidateId),
    [candidates, candidateId],
  );

  const loadData = async () => {
    setListError(null);
    try {
      const response = await fetch("/api/staff/visit-assignments");
      if (!response.ok) {
        setListError("来社割当の取得に失敗しました。");
        return;
      }
      const payload = (await response.json()) as {
        candidates: CandidateAssignment[];
        slots: VisitSlot[];
      };
      setCandidates(
        payload.candidates.map((candidate) => ({
          ...candidate,
          assignment: candidate.assignment
            ? {
                ...candidate.assignment,
                startsAt: new Date(candidate.assignment.startsAt).toISOString(),
                endsAt: new Date(candidate.assignment.endsAt).toISOString(),
              }
            : null,
        })),
      );
      setSlots(
        payload.slots.map((slot) => ({
          ...slot,
          startsAt: new Date(slot.startsAt).toISOString(),
          endsAt: new Date(slot.endsAt).toISOString(),
        })),
      );
    } catch {
      setListError("通信に失敗しました。");
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!selectedCandidate) {
      return;
    }
    setSlotId(selectedCandidate.assignment?.slotId ?? "");
  }, [selectedCandidate]);

  const handleSelectCandidate = (id: string) => {
    setCandidateId(id);
    setFormError(null);
    setMessage(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    setMessage(null);

    if (!candidateId) {
      setFormError("受験者を選択してください。");
      return;
    }
    if (!slotId) {
      setFormError("来社枠を選択してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/staff/visit-assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ candidateId, visitSlotId: slotId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setFormError(payload.message ?? "割当の保存に失敗しました。");
        return;
      }

      setMessage("来社枠を割り当てました。");
      await loadData();
    } catch {
      setFormError("通信に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={baseStyles}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              ホーム
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              /
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              来社割当
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" },
              gap: 3,
            }}
          >
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    受験者一覧
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    {candidates.length} 件
                  </Typography>
                </Stack>
                {listError ? <Alert severity="error">{listError}</Alert> : null}
                <Table size="small" data-testid="visit-assignment-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>受験者</TableCell>
                      <TableCell>来社枠</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow
                        key={candidate.candidateId}
                        hover
                        selected={candidate.candidateId === candidateId}
                        onClick={() =>
                          handleSelectCandidate(candidate.candidateId)
                        }
                        data-testid={`visit-assignment-row-${candidate.candidateId}`}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{candidate.fullName}</TableCell>
                        <TableCell>
                          {candidate.assignment
                            ? `${formatDateTime(
                                candidate.assignment.startsAt,
                              )} - ${formatDateTime(candidate.assignment.endsAt)}`
                            : "未割当"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {candidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" sx={{ color: "#64748b" }}>
                            受験者が登録されていません。
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  来社枠の割当
                </Typography>
                {message ? <Alert severity="success">{message}</Alert> : null}
                {formError ? <Alert severity="error">{formError}</Alert> : null}
                <TextField
                  select
                  label="受験者"
                  value={candidateId}
                  onChange={(event) => setCandidateId(event.target.value)}
                  inputProps={{ "data-testid": "visit-assignment-candidate" }}
                >
                  {candidates.map((candidate) => (
                    <MenuItem
                      key={candidate.candidateId}
                      value={candidate.candidateId}
                    >
                      {candidate.fullName}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="来社枠"
                  value={slotId}
                  onChange={(event) => setSlotId(event.target.value)}
                  inputProps={{ "data-testid": "visit-assignment-slot" }}
                >
                  {slots.map((slot) => (
                    <MenuItem key={slot.id} value={slot.id}>
                      {formatDateTime(slot.startsAt)} -{" "}
                      {formatDateTime(slot.endsAt)}（定員 {slot.capacity}）
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  data-testid="visit-assignment-submit"
                  sx={{ fontWeight: 700 }}
                >
                  {isSubmitting ? "保存中..." : "割当を保存"}
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
