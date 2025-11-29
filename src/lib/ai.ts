import type { NextRequest } from 'next/server';
// Import image dimension checker for server-side validation
// We use a dynamic import to avoid importing in client-side bundles
let sizeOf: any;
try { sizeOf = require('image-size'); } catch { /* ignore if not available (dev env) */ }

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

  // Validate images (Mock implementation - structure for future AI check)
  const validateImage = (base64Image: string | undefined) => {
    if (!base64Image) return true;
    // Basic header check
    if (!/data:image\/(png|jpe?g|webp|svg\+xml);base64,/.test(base64Image)) {
      throw new Error('Only PNG, JPG, WebP, or SVG images are supported.');
    }
    // If we can check dimensions, enforce a minimum chart size
    try {
      if (sizeOf && typeof Buffer !== 'undefined') {
        const base64Data = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        const buf = Buffer.from(base64Data, 'base64');
        const dims = sizeOf(buf);
        const width = dims.width || 0;
        const height = dims.height || 0;
        // Require reasonable chart dimensions
        if (width < 300 || height < 150) {
          throw new Error('Uploaded image appears too small to be a chart. Please upload a larger image.');
        }
      }
    } catch (err) {
      // If any validation error occurs, throw
      if (err instanceof Error && err.message) throw err;
      throw new Error('Uploaded image failed validation.');
    }
    // TODO: Integrate with OpenAI/Gemini Vision API to check if image is a stock chart.
    // For now, we assume it's valid if it's a valid base64 string.
    // In a real scenario, you would send this to an AI model with a prompt like:
    // "Is this image a financial trading chart? Answer YES or NO."

    // Example of how to reject non-chart images (commented out until AI key is available):
    // const isChart = await checkWithAI(base64Image);
    // if (!isChart) throw new Error('Uploaded image does not appear to be a trading chart.');

    return true;
  };

  validateImage(inputs.fifteenMin);
  validateImage(inputs.oneHour);
  validateImage(inputs.fiveMin);

  // Helper to create a deterministic seed from input images
  const seedFromInputs = (i: MultiTfInputs) => {
    const s = `${i.fifteenMin || ''}|${i.oneHour || ''}|${i.fiveMin || ''}`;
    let h = 0;
    for (let j = 0; j < s.length; j++) {
      h = ((h << 5) - h) + s.charCodeAt(j);
      h |= 0;
    }
    return Math.abs(h);
  };

  const seed = seedFromInputs(inputs);
  const pick = (arr: any[]) => arr[seed % arr.length];

  // Mock output tailored per strategy but depending on image fingerprints
  if (strategy === 'swing') {
    return {
      strategy,
      summary: pick([
        'Swing analysis using Daily/4H trend with a visible breakout.',
        'Swing analysis with a retest to EMA and liquidity cluster.',
        'Swing analysis showing range expansion and possible reversal.'
      ]) + ' (seeded)',
      tradeSetup: pick(['Buy', 'Sell', 'Neutral']),
      entryZone: pick([
        'Pullback to 20/50 EMA confluence near prior sweep',
        'Breakout and retest area near previous highs',
        'Range support area at swing low'
      ]),
      stopLoss: 'Below recent swing low / sweep wick',
      takeProfit: pick([
        'TP1: recent high; TP2: next major resistance',
        'TP1: fib 0.618; TP2: swing high',
        'TP1: session high; TP2: prev day high'
      ]),
      riskReward: pick(['≈ 1:2 – 1:2.5', '1:1.5', '≥ 1:2']),
      reasons: [
        pick(['HTF uptrend (HH/HL)', 'HTF downtrend (LH/LL)', 'Possible reversal after liquidity sweep']),
        pick(['Liquidity sweep with strong rejection', 'FVG fill with momentum', 'EMA confluence and rejection']),
        pick(['BoS + EMA pullback entry trigger', 'Clean retest + momentum', 'Volume spike and breakout'])
      ],
      chartInsights: [
        { label: 'Trend Confidence', value: (seed % 60) + 20 },
        { label: 'Liquidity Context', value: (seed % 50) + 10 },
        { label: 'Entry Quality', value: (seed % 40) + 20 },
      ],
    };
  }

  if (strategy === 'scalp') {
    return {
      strategy,
      summary: pick([
        'Scalp with 1H trend filter and fast momentum taps',
        'Scalp showing multiple EMA taps and price rotations',
      ]) + ' (seeded)',
      tradeSetup: pick(['Buy','Sell','Neutral']),
      entryZone: pick(['1–5m EMA tap after liquidity grab', 'Micro-range breakout and retest', 'Quick pullback to EMA with confirmation']),
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
    summary: pick([
      'Intraday bias from 4H→1H with session liquidity and FVG.',
      'Intraday continuation pattern with session level interactions.'
    ]) + ' (seeded)',
    tradeSetup: pick(['Buy','Sell','Neutral']),
    entryZone: pick(['15m BoS or FVG retest', 'Retest of session high/low', 'Impulse move and micro pullback']),
    stopLoss: 'Below sweep wick / last swing',
    takeProfit: 'TP1: session high; TP2: prev day high; TP3: opposite liquidity',
    riskReward: '≥ 1:2',
    reasons: [
      pick(['4H/1H alignment with EMAs','4H trend divergence','1H consolidation']),
      pick(['Session high/low liquidity context','Large order execution zone','Sweep into previous highs']),
      pick(['Continuation after clean breakout & retest','Failure of breakout and mean reversion'])
    ],
    chartInsights: [
      { label: 'HTF Bias', value: 40 },
      { label: 'Session Levels', value: 30 },
      { label: 'Trigger Quality', value: 30 },
    ],
  };
}

// Image validation helper: uses optional vision API (if key present) or fallbacks to a heuristic.
export async function validateVisionImage(base64Image?: string): Promise<{ isChart: boolean; confidence: number; reason?: string }> {
  if (!base64Image) return { isChart: false, confidence: 0, reason: 'No image provided' };

  const visionApiKey = process.env.VISION_API_KEY || process.env.OPENAI_API_KEY || '';
  if (visionApiKey) {
    // Call OpenAI / Responses API (vision-capable model) to classify image
    try {
      const prompt = `You are a classifier that decides whether an image is a financial trading chart. Answer only as JSON: {"isChart": boolean, "confidence": number (0-1), "reason": string}. Analyze the image shown: <img src="${base64Image}"/>`;
      const openaiModel = process.env.OPENAI_MODEL || process.env.VISION_MODEL || 'gpt-4o-mini';
      const openaiRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${visionApiKey}`
        },
        body: JSON.stringify({ model: openaiModel, input: [{ role: 'user', content: prompt }] })
      });

      if (!openaiRes.ok) {
        // Non-200 - fallback to heuristic
        console.warn('Vision API responded with status', openaiRes.status);
      } else {
        const json = await openaiRes.json().catch(() => null);
        if (json) {
          // Try to extract text output
          const outputText = (json.output?.[0]?.content?.[0]?.text) || (json?.choices?.[0]?.message?.content);
          if (outputText) {
            try {
              // Attempt to parse JSON from the model
              const parsed = JSON.parse(outputText.trim());
              if (typeof parsed.isChart === 'boolean') {
                return { isChart: parsed.isChart, confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7, reason: parsed.reason };
              }
            } catch (e) {
              // If model returned a text answer, attempt a simpler parse
              const lower = outputText.toLowerCase();
              if (lower.includes('yes')) return { isChart: true, confidence: 0.75, reason: 'Model positive' };
              if (lower.includes('no')) return { isChart: false, confidence: 0.75, reason: 'Model negative' };
            }
          }
        }
      }
    } catch (err) {
      console.error('OpenAI vision integration error:', err);
      // continue to heuristic fallback
    }
  }

  // Heuristic fallback: check image dimensions and simple non-white pixel ratio
  try {
    const base64Data = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const buf = Buffer.from(base64Data, 'base64');
    if (sizeOf) {
      const dims = sizeOf(buf);
      const width = dims.width || 0;
      const height = dims.height || 0;
      if (width < 300 || height < 150) return { isChart: false, confidence: 0.1, reason: 'Image too small' };
    }

    // Basic pixel content check: check how many pixels are not pure white
    let nonWhite = 0;
    for (let i = 0; i < Math.min(2000, buf.length); i += 4) {
      if (buf[i] !== 255 || buf[i + 1] !== 255 || buf[i + 2] !== 255) nonWhite++;
    }
    const ratio = nonWhite / (Math.min(2000, buf.length) / 4 || 1);
    if (ratio < 0.01) return { isChart: false, confidence: 0.1, reason: 'Mostly blank image' };
    if (ratio > 0.15) return { isChart: true, confidence: 0.6 };
  } catch (e) {
    return { isChart: false, confidence: 0.2, reason: 'Validation failed' };
  }

  return { isChart: false, confidence: 0.25 };
}

