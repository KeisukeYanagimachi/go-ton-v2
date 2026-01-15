"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

type ExamDialogsProps = {
  isSectionConfirmOpen: boolean;
  isSubmitConfirmOpen: boolean;
  onCloseSectionConfirm: () => void;
  onAdvanceSection: () => void;
  onCloseSubmitConfirm: () => void;
  onSubmit: () => void;
};

const ConfirmActions = styled(DialogActions)(({ theme }) => ({
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  paddingBottom: theme.spacing(2),
}));

const ConfirmText = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const SectionAdvanceButton = styled(Button)({
  backgroundColor: "#137fec",
});

const SubmitConfirmButton = styled(Button)({
  backgroundColor: "#111418",
});

/** 試験画面の確認ダイアログ群を表示する。 */
export default function ExamDialogs({
  isSectionConfirmOpen,
  isSubmitConfirmOpen,
  onCloseSectionConfirm,
  onAdvanceSection,
  onCloseSubmitConfirm,
  onSubmit,
}: ExamDialogsProps) {
  return (
    <>
      <Dialog
        open={isSectionConfirmOpen}
        onClose={onCloseSectionConfirm}
        data-testid="candidate-section-confirm"
      >
        <DialogTitle>次のセクションへ進みますか？</DialogTitle>
        <DialogContent>
          <ConfirmText variant="body2">
            次のセクションに進むと、前のセクションには戻れません。
          </ConfirmText>
        </DialogContent>
        <ConfirmActions>
          <Button
            variant="outlined"
            onClick={onCloseSectionConfirm}
            data-testid="candidate-section-confirm-cancel"
          >
            キャンセル
          </Button>
          <SectionAdvanceButton
            variant="contained"
            onClick={onAdvanceSection}
            data-testid="candidate-section-confirm-advance"
          >
            進む
          </SectionAdvanceButton>
        </ConfirmActions>
      </Dialog>

      <Dialog
        open={isSubmitConfirmOpen}
        onClose={onCloseSubmitConfirm}
        data-testid="candidate-submit-confirm"
      >
        <DialogTitle>試験を提出しますか？</DialogTitle>
        <DialogContent>
          <ConfirmText variant="body2">
            提出すると回答は確定され、再編集はできません。
          </ConfirmText>
        </DialogContent>
        <ConfirmActions>
          <Button
            variant="outlined"
            onClick={onCloseSubmitConfirm}
            data-testid="candidate-submit-confirm-cancel"
          >
            キャンセル
          </Button>
          <SubmitConfirmButton
            variant="contained"
            onClick={onSubmit}
            data-testid="candidate-submit-confirm-submit"
          >
            提出する
          </SubmitConfirmButton>
        </ConfirmActions>
      </Dialog>
    </>
  );
}
