/** 開発用スタッフセッションを発行・検証する実装。 */

import { createHmac, timingSafeEqual } from "crypto";

type DevStaffSessionPayload = {
  staffUserId: string;
  email: string;
  roleCodes: string[];
  issuedAt: number;
  expiresAt: number;
};

const DEV_STAFF_SESSION_COOKIE = "dev_staff_session";
const DEV_STAFF_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const encodeBase64Url = (value: string) =>
  Buffer.from(value).toString("base64url");

const decodeBase64Url = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const signPayload = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

const createDevStaffSessionToken = (
  payload: Omit<DevStaffSessionPayload, "issuedAt" | "expiresAt">,
  secret: string,
  now = Date.now(),
) => {
  const issuedAt = now;
  const expiresAt = now + DEV_STAFF_SESSION_TTL_MS;
  const body = JSON.stringify({ ...payload, issuedAt, expiresAt });
  const encoded = encodeBase64Url(body);
  const signature = signPayload(encoded, secret);
  return `${encoded}.${signature}`;
};

const parseDevStaffSessionToken = (
  token: string,
  secret: string,
  now = Date.now(),
): DevStaffSessionPayload | null => {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = signPayload(encoded, secret);
  const validSignature = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );

  if (!validSignature) {
    return null;
  }

  const payload = JSON.parse(
    decodeBase64Url(encoded),
  ) as DevStaffSessionPayload;

  if (payload.expiresAt <= now) {
    return null;
  }

  return payload;
};

/** Cookieヘッダーから開発用スタッフセッショントークンを取得する。 */
const extractDevStaffSessionToken = (cookieHeader: string) =>
  cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${DEV_STAFF_SESSION_COOKIE}=`))
    ?.split("=")[1];

export {
  createDevStaffSessionToken,
  DEV_STAFF_SESSION_COOKIE,
  extractDevStaffSessionToken,
  parseDevStaffSessionToken,
};
