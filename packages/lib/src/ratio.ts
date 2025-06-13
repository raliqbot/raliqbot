import assert from "assert";
import { isNumber } from "lodash";

type RatioValue = `${number}/${number}` | number;

export class Ratio {
  readonly #a: number;
  readonly #b: number;

  constructor(a: RatioValue, b: RatioValue) {
    this.#a = Ratio.parseValue(a);
    this.#b = Ratio.parseValue(b);
    assert(
      this.sum === 1 || this.sum === 100,
      "expected ratio sum up to 1 or 100"
    );
  }

  private get sum() {
    return this.#a + this.#b;
  }

  get a() {
    if (this.sum === 1) return this.#a * 100;
    return this.#a;
  }

  get b() {
    if (this.sum === 1) return this.#b * 100;
    return this.#b;
  }

  static parseValue(value: RatioValue) {
    if (isNumber(value)) return value;
    const [numerator, denominator] = value
      .split(/\//)
      .map(parseFloat)
      .filter((value) => !Number.isNaN(value));

    assert(numerator, "expected a numerator.");
    assert(denominator, "expected a denomator.");

    return numerator / denominator;
  }
}
