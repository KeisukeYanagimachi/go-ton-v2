import { createHash } from "crypto";

const hashPin = (pin: string) =>
  createHash("sha256").update(pin).digest("hex");

export { hashPin };
