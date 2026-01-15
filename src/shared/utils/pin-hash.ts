/** PIN のハッシュ化と検証を行うユーティリティ。 */

import { createHash } from "crypto";

const hashPin = (pin: string) =>
  createHash("sha256").update(pin).digest("hex");

export { hashPin };
