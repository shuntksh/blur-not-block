import { describe, expect, it } from "vitest";

import { hashPassphrase } from "../use-config";

describe("hashPassphrase", () => {
  it("should hash a passphrase", async () => {
    const hash1 = await hashPassphrase("test");
    const hash2 = await hashPassphrase("test");
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe("test");
    expect(hash1.length).toBeGreaterThan(0);
  });
});
