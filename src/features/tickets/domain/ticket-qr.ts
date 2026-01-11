import { createHmac, timingSafeEqual } from "crypto";

const signTicketCode = (ticketCode: string, secret: string) =>
  createHmac("sha256", secret).update(ticketCode).digest("base64url");

const buildTicketQrPayload = (ticketCode: string, secret: string) =>
  `${ticketCode}.${signTicketCode(ticketCode, secret)}`;

const parseTicketQrPayload = (payload: string, secret: string) => {
  const trimmed = payload.trim();
  const [ticketCode, signature, extra] = trimmed.split(".");

  if (!ticketCode || !signature || extra) {
    return null;
  }

  const expected = signTicketCode(ticketCode, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  return ticketCode;
};

export { buildTicketQrPayload, parseTicketQrPayload };
