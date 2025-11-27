import type { NextRequest } from 'next/server';

export type StrategyKey = 'swing' | 'scalp' | 'day';

export type MultiTfInputs = {
  fifteenMin?: string; // base64 image
  oneHour?: string;    // base64 image
  fiveMin?: string;    // base64 image
};

export type AiAnalysis = {
  strategy: StrategyKey;
  summary: string;
  tradeSetup: 'Buy' | 'Sell' | 'Neutral';
  entryZone: string;
  stopLoss: string;
  takeProfit: string; // could contain TP1/TP2(/TP3)
  riskReward: string;
  reasons: string[];
  chartInsights: Array<{ label: string; value: number }>; // for pie/bar chart
};

// NOTE: This util is a stub. Replace with actual OpenAI/Gemini SDK calls.
export async function runAiAnalysis(
  strategy: StrategyKey,
  inputs: MultiTfInputs,
): Promise<AiAnalysis> {
  // Basic validation
  if (!inputs.fifteenMin && !inputs.oneHour && !inputs.fiveMin) {
    throw new Error('At least one chart must be uploaded');
  }

  // Mock output tailored per strategy prompt rubric
  if (strategy === 'swing') {
    return {
      strategy,
      summary: 'Swing analysis using Daily/4H trend and liquidity context.',
      tradeSetup: 'Buy',
      entryZone: 'Pullback to 20/50 EMA confluence near prior sweep',
      stopLoss: 'Below recent swing low / sweep wick',
      takeProfit: 'TP1: recent high; TP2: next major resistance / fib 1.272',
      riskReward: '≈ 1:2 – 1:2.5',
      reasons: [
        'HTF uptrend (HH/HL, above 200 EMA)',
        'Liquidity sweep with strong rejection',
        'BoS + EMA pullback entry trigger',
      ],
      chartInsights: [
        { label: 'Trend Confidence', value: 45 },
        { label: 'Liquidity Context', value: 35 },
        { label: 'Entry Quality', value: 20 },
      ],
    };
  }

  if (strategy === 'scalp') {
    return {
      strategy,
      summary: 'Scalp with 1H trend filter and 20/50 EMA bias.',
      tradeSetup: 'Buy',
      entryZone: '1–5m EMA tap after liquidity grab',
      stopLoss: '5–10 pips beyond sweep wick',
      takeProfit: 'TP1: 1R; TP2: 2R or trail',
      riskReward: '1:1 to 1:2',
      reasons: [
        '1H trend aligned',
        'Liquidity sweep + fast rejection',
        'EMA tap trigger',
      ],
      chartInsights: [
        { label: 'Trend Filter', value: 40 },
        { label: 'Micro-structure', value: 40 },
        { label: 'Momentum', value: 20 },
      ],
    };
  }

  // day strategy
  return {
    strategy,
    summary: 'Intraday bias from 4H→1H with session liquidity and FVG.',
    tradeSetup: 'Buy',
    entryZone: '15m BoS or FVG retest in trend direction',
    stopLoss: 'Below sweep wick / last swing',
    takeProfit: 'TP1: session high; TP2: prev day high; TP3: opposite liquidity',
    riskReward: '≥ 1:2',
    reasons: [
      '4H/1H alignment with EMAs',
      'Session high/low liquidity context',
      'Continuation after clean breakout & retest',
    ],
    chartInsights: [
      { label: 'HTF Bias', value: 40 },
      { label: 'Session Levels', value: 30 },
      { label: 'Trigger Quality', value: 30 },
    ],
  };
}
