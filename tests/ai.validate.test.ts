import { describe, it, expect } from 'vitest';
import { validateVisionImage } from '../src/lib/ai';

describe('validateVisionImage', () => {
  it('rejects tiny 1x1 PNG image', async () => {
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8BPfT4p8sAAAAASUVORK5CYII=';
    const res = await validateVisionImage(tinyPng);
    expect(res.isChart).toBe(false);
  });

  it('rejects invalid base64', async () => {
    const invalid = 'data:image/png;base64,notbase64';
    const res = await validateVisionImage(invalid);
    expect(res.isChart).toBe(false);
  });
});
