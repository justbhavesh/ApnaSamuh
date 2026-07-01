import { describe, it, expect } from "vitest";
import { sha256Hex } from "./sha256";

describe("sha256Hex matches standard SHA-256 vectors", () => {
  it("empty string", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it('"abc"', () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("a 4-digit PIN hashes deterministically", () => {
    expect(sha256Hex("1234")).toBe(
      "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"
    );
  });
});
