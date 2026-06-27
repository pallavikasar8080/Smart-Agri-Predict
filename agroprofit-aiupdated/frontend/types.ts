
export interface YearlyForecast {
  year: string;
  price: number;
}

export interface WebSource {
  title: string;
  uri: string;
}

export interface CropPrediction {
  cropName: string;
  currentPrice: number;
  predictedPrice: number;
  unit: string; // e.g., 'kg', 'quintal', 'ton'
  yearlyForecast: YearlyForecast[];
  profitabilityScore: number; // 0-100
  accuracy: number; // 0-100% confidence score
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
  isAiGenerated?: boolean; // True if from Gemini, False if from Internal ML
}

export interface AnalysisResult {
  location: string;
  soilType: string;
  rainfall: string;
  temperature: string;
  predictions: CropPrediction[];
  recommendedCrop: string;
  alternativeCrop: string;
  analysisSummary: string;
  webSources?: WebSource[];
  primaryDataSource?: string;
}

export interface HistoricalDataPoint {
  year: number;
  price: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  location: string;
  result: AnalysisResult;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING_LOCATION = 'ANALYZING_LOCATION',
  PROCESSING_FILE = 'PROCESSING_FILE',
  RUNNING_ML_MODEL = 'RUNNING_ML_MODEL',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
