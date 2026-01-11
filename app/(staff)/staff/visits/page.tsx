"use client";

import {
  Alert,
  Box,
  Button,
  Container,
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

type VisitSlotRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  updatedAt: string;
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

const toInputValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function StaffVisitSlotsPage() {
  const [slots, setSlots] = useState<VisitSlotRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("10");
  const [message, setMessage] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedId) ?? null,
    [slots, selectedId],
  );

  const loadSlots = async () => {
    setListError(null);
    try {
      const response = await fetch("/api/staff/visit-slots");
      if (!response.ok) {
        setListError("来社枠の取得に失敗しました。");
        return;
      }
      const payload = (await response.json()) as { slots: VisitSlotRow[] };
      setSlots(
        payload.slots.map((slot) => ({
          ...slot,
          startsAt: new Date(slot.startsAt).toISOString(),
          endsAt: new Date(slot.endsAt).toISOString(),
          updatedAt: new Date(slot.updatedAt).toISOString(),
        })),
      );
    } catch {
      setListError("通信に失敗しました。");
    }
  };

  useEffect(() => {
    void loadSlots();
  }, []);

  useEffect(() => {
    if (!selectedSlot) {
      setStartsAt("");
      setEndsAt("");
      setCapacity("10");
      return;
    }
    setStartsAt(toInputValue(selectedSlot.startsAt));
    setEndsAt(toInputValue(selectedSlot.endsAt));
    setCapacity(String(selectedSlot.capacity));
  }, [selectedSlot]);

  const handleSelectSlot = (slotId: string) => {
    setMessage(null);
    setFormError(null);
    setSelectedId(slotId);
  };

  const resetForm = () => {
    setSelectedId(null);
    setStartsAt("");
    setEndsAt("");
    setCapacity("10");
    setFormError(null);
    setMessage(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    setMessage(null);

    const capacityValue = Number(capacity);
    if (!startsAt || !endsAt) {
      setFormError("開始日時と終了日時を入力してください。");
      return;
    }
    if (!Number.isInteger(capacityValue) || capacityValue < 0) {
      setFormError("定員は0以上の整数で入力してください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        capacity: capacityValue,
      };
      const response = await fetch(
        selectedId
          ? `/api/staff/visit-slots/${selectedId}`
          : "/api/staff/visit-slots",
        {
          method: selectedId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        setFormError(result.message ?? "保存に失敗しました。");
        return;
      }

      setMessage(
        selectedId ? "来社枠を更新しました。" : "来社枠を作成しました。",
      );
      await loadSlots();
      if (!selectedId) {
        resetForm();
      }
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
              来社枠管理
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
                    来社枠一覧
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    {slots.length} 件
                  </Typography>
                </Stack>
                {listError ? <Alert severity="error">{listError}</Alert> : null}
                <Table size="small" data-testid="visit-slot-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>開始</TableCell>
                      <TableCell>終了</TableCell>
                      <TableCell>定員</TableCell>
                      <TableCell>更新</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow
                        key={slot.id}
                        hover
                        selected={slot.id === selectedId}
                        onClick={() => handleSelectSlot(slot.id)}
                        data-testid={`visit-slot-row-${slot.id}`}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{formatDateTime(slot.startsAt)}</TableCell>
                        <TableCell>{formatDateTime(slot.endsAt)}</TableCell>
                        <TableCell>{slot.capacity}</TableCell>
                        <TableCell>{formatDateTime(slot.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                    {slots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="body2" sx={{ color: "#64748b" }}>
                            来社枠が登録されていません。
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
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedId ? "来社枠の編集" : "来社枠の新規作成"}
                  </Typography>
                  {selectedId ? (
                    <Button
                      variant="text"
                      onClick={resetForm}
                      data-testid="visit-slot-reset"
                      sx={{ fontWeight: 700 }}
                    >
                      新規作成に切り替え
                    </Button>
                  ) : null}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  来社枠の作成・編集は ADMIN のみが実行できます。
                </Typography>

                {message ? <Alert severity="success">{message}</Alert> : null}
                {formError ? <Alert severity="error">{formError}</Alert> : null}

                <TextField
                  type="datetime-local"
                  label="開始日時"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ "data-testid": "visit-slot-starts-at" }}
                />
                <TextField
                  type="datetime-local"
                  label="終了日時"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ "data-testid": "visit-slot-ends-at" }}
                />
                <TextField
                  label="定員"
                  type="number"
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  inputProps={{ min: 0, "data-testid": "visit-slot-capacity" }}
                />
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  data-testid="visit-slot-submit"
                  sx={{ fontWeight: 700 }}
                >
                  {isSubmitting ? "保存中..." : "保存する"}
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
