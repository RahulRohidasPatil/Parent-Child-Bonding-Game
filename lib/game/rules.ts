/** Catch the imposter: everyone else +1. Imposter escapes: imposter +2. */
export const roundPoints = (caught: boolean, isImposter: boolean) =>
  caught ? (isImposter ? 0 : 1) : isImposter ? 2 : 0;
