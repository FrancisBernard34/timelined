import { describe, expect, it } from "vitest";

import {
  clampVelocity,
  decayVelocity,
  MAX_VELOCITY,
  MIN_VELOCITY,
} from "@/lib/momentum";

describe("momentum", () => {
  it("decays velocity toward zero", () => {
    const decayed = decayVelocity(1, 16);
    expect(decayed).toBeLessThan(1);
    expect(decayed).toBeGreaterThan(0);
  });

  it("decays more over a longer frame", () => {
    expect(decayVelocity(1, 32)).toBeLessThan(decayVelocity(1, 16));
  });

  it("keeps the velocity sign", () => {
    expect(decayVelocity(-1, 16)).toBeLessThan(0);
  });

  it("clamps the velocity magnitude", () => {
    expect(clampVelocity(100)).toBe(MAX_VELOCITY);
    expect(clampVelocity(-100)).toBe(-MAX_VELOCITY);
    expect(clampVelocity(1)).toBe(1);
  });

  it("settles below the stop threshold in a finite number of frames", () => {
    let velocity = 1;
    let frames = 0;
    while (Math.abs(velocity) >= MIN_VELOCITY && frames < 1000) {
      velocity = decayVelocity(velocity, 16);
      frames += 1;
    }
    expect(frames).toBeLessThan(400);
    expect(Math.abs(velocity)).toBeLessThan(MIN_VELOCITY);
  });
});
