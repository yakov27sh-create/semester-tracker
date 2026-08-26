/**
 * Randomly shuffles an array in-place using the Fisher–Yates algorithm.
 * Returns the same array instance, now randomized.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]; // copy to avoid mutating the original array
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [result[i], result[j]] = [result[j], result[i]]; // swap elements
  }
  return result;
}
