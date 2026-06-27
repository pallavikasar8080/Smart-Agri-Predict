import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import { CropPrediction } from '../types';

interface ChartsProps {
  predictions: CropPrediction[];
}

export const PriceComparisonChart: React.FC<ChartsProps> = ({ predictions }) => {
  const data = predictions.map(p => ({
    name: p.cropName,
    Current: p.currentPrice,
    Predicted: p.predictedPrice,
  }));

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Price Prediction Comparison</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{fontSize: 12}} />
          <YAxis />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Bar dataKey="Current" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Predicted" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ProfitabilityChart: React.FC<ChartsProps> = ({ predictions }) => {
  const data = predictions.map(p => ({
    name: p.cropName,
    Score: p.profitabilityScore,
  }));

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Profitability Index (0-100)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          layout="vertical"
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid stroke="#f5f5f5" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
          <Tooltip />
          <Bar dataKey="Score" barSize={20} fill="#f59e0b" radius={[0, 4, 4, 0]} background={{ fill: '#eee' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FutureTrendsChart: React.FC<ChartsProps> = ({ predictions }) => {
  // Transform data for Recharts: Needs to be [{ name: '2025', Rice: 2000, Wheat: 1500 }, ...]
  
  // 1. Collect all unique years
  const years = new Set<string>();
  predictions.forEach(p => {
    if (p.yearlyForecast) {
      p.yearlyForecast.forEach(f => years.add(f.year));
    }
  });
  const sortedYears = Array.from(years).sort();

  // 2. Build data structure
  const data = sortedYears.map(year => {
    const entry: any = { name: year };
    predictions.forEach(p => {
      const forecast = p.yearlyForecast?.find(f => f.year === year);
      if (forecast) {
        entry[p.cropName] = forecast.price;
      }
    });
    return entry;
  });

  const colors = ["#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Future Price Forecast (Year-wise)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          {predictions.slice(0, 5).map((p, index) => (
            <Line 
              key={p.cropName} 
              type="monotone" 
              dataKey={p.cropName} 
              stroke={colors[index % colors.length]} 
              strokeWidth={2} 
              dot={{r: 4}} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};