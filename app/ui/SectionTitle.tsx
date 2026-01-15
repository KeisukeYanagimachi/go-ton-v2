"use client";

import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

type SectionTitleProps = {
  weight?: 700 | 800 | 900;
};

const SectionTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "weight",
})<SectionTitleProps>(({ weight = 700 }) => ({
  fontWeight: weight,
}));

/** セクション見出しとして使う太字タイトル。 */
export default SectionTitle;
