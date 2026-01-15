"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

type ExamDialogsProps = {
  isModuleConfirmOpen: boolean;
  isSubmitConfirmOpen: boolean;
  onCloseModuleConfirm: () => void;
  onAdvanceModule: () => void;
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

const ModuleAdvanceButton = styled(Button)({
  backgroundColor: "#137fec",
});

const SubmitConfirmButton = styled(Button)({
  backgroundColor: "#111418",
});

/** 試験画面の確認ダイアログ群を表示する。 */
export default function ExamDialogs({
  isModuleConfirmOpen,
  isSubmitConfirmOpen,
  onCloseModuleConfirm,
  onAdvanceModule,
  onCloseSubmitConfirm,
  onSubmit,
}: ExamDialogsProps) {
  return (
    <>
      <Dialog
        open={isModuleConfirmOpen}
        onClose={onCloseModuleConfirm}
        data-testid="candidate-module-confirm"
      >
        <DialogTitle>次のモジュールへ進みますか？</DialogTitle>
        <DialogContent>
          <ConfirmText variant="body2">
            次のモジュールに進むと、前のモジュールには戻れません。
          </ConfirmText>
        </DialogContent>
        <ConfirmActions>
          <Button
            variant="outlined"
            onClick={onCloseModuleConfirm}
            data-testid="candidate-module-confirm-cancel"
          >
            キャンセル
          </Button>
          <ModuleAdvanceButton
            variant="contained"
            onClick={onAdvanceModule}
            data-testid="candidate-module-confirm-advance"
          >
            進む
          </ModuleAdvanceButton>
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
