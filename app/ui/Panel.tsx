"use client";

import { Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

type PanelSize = "sm" | "md" | "lg";

type PanelProps = {
  size?: PanelSize;
};

const sizePadding: Record<PanelSize, number> = {
  sm: 2,
  md: 3,
  lg: 4,
};

const Panel = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "size",
})<PanelProps>(({ theme, size = "md" }) => ({
  padding: theme.spacing(sizePadding[size]),
  borderRadius: theme.spacing(3),
}));

/** 画面内のセクションを包む共通パネル。 */
export default Panel;
