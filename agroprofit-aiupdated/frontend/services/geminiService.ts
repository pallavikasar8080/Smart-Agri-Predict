import type { AnalysisResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function predictCropPrices(location: string, mode: 'ML' | 'AI'): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ location, mode }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Prediction request failed');
  }

  const data = await response.json();
  return data;
}
