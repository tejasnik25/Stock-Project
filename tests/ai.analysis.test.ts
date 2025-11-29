import { describe, it, expect } from 'vitest';
import { runAiAnalysis } from '../src/lib/ai';

describe('runAiAnalysis variability', () => {
  it('returns distinct results for different image inputs (swing)', async () => {
    const inputsA = { fifteenMin: 'data:image/png;base64,AAAAA', oneHour: undefined, fiveMin: undefined };
    const inputsB = { fifteenMin: 'data:image/png;base64,BBBBB', oneHour: undefined, fiveMin: undefined };
    const resA = await runAiAnalysis('swing', inputsA);
    const resB = await runAiAnalysis('swing', inputsB);
    // At least one field should differ (summary or tradeSetup)
    const different = resA.summary !== resB.summary || resA.tradeSetup !== resB.tradeSetup || resA.entryZone !== resB.entryZone;
    expect(different).toBe(true);
  });
});
