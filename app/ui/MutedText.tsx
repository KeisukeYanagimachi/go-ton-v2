"use client";

import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const MutedText = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

/** 補足情報として使う控えめなテキスト。 */
export default MutedText;
