
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Activity, Search, TrendingUp, Droplets, Thermometer, Globe, Loader2, Database, Clock, Calendar, Trash2, ArrowRight, ShieldCheck, ExternalLink, FileText, Mic, MicOff } from 'lucide-react';
import Header from './Header';
import { PriceComparisonChart, ProfitabilityChart, FutureTrendsChart } from './Charts';
import { predictCropPrices } from '../services/geminiService';
import { AnalysisResult, AnalysisStatus, HistoryItem } from '../types';

const INDIAN_LOCATIONS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Bangalore', 'Mysore', 'Chennai', 'Coimbatore', 
  'Kolkata', 'Hyderabad', 'Jaipur', 'Lucknow', 'Patna', 'Bhopal', 'Indore', 'Ahmedabad', 
  'Surat', 'Chandigarh', 'Ludhiana', 'Raipur', 'Ranchi', 'Shimla', 'Srinagar', 
  'Thiruvananthapuram', 'Bhubaneswar', 'Dehradun', 'Guwahati'
];

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<'analysis' | 'history'>('analysis');
  const [location, setLocation] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loadingButton, setLoadingButton] = useState<'ML' | 'AI' | null>(null);
  
  // Voice Search State
  const [isListening, setIsListening] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Load history
    const savedHistory = localStorage.getItem('agroHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value;
    updateLocation(userInput);
  };

  const updateLocation = (value: string) => {
    setLocation(value);
    if (value.length > 0) {
      const filtered = INDIAN_LOCATIONS.filter(
        (loc) => loc.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-IN'; // Set to Indian English
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Remove trailing punctuation often added by voice input
      const cleanTranscript = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]$/, "");
      updateLocation(cleanTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone permission denied. Please allow microphone access in your browser settings to use voice search.");
      } else if (event.error === 'no-speech') {
        // No speech detected, simple return
      } else {
        alert("Voice search error: " + event.error);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition", err);
      setIsListening(false);
    }
  };

  const selectLocation = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowSuggestions(false);
  };

  const saveToHistory = (newResult: AnalysisResult, loc: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      location: loc,
      result: newResult
    };
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('agroHistory', JSON.stringify(updatedHistory));
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('agroHistory', JSON.stringify(updated));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setLocation(item.location);
    setCurrentView('analysis');
  };

  const handlePredict = async (mode: 'ML' | 'AI') => {
    if (!location) {
      alert("Please enter a location");
      return;
    }

    try {
      setLoadingButton(mode);
      setResult(null); // Clear previous result
      setStatus(AnalysisStatus.ANALYZING_LOCATION);
      await new Promise(r => setTimeout(r, 500));
      
      setStatus(AnalysisStatus.RUNNING_ML_MODEL);
      
      // Call service with specific mode
      const predictionData = await predictCropPrices(location, mode);
      
      setResult(predictionData);
      setStatus(AnalysisStatus.COMPLETE);
      saveToHistory(predictionData, location);
    } catch (error: any) {
      console.error(error);
      // Handle explicit backend errors intended for user display
      if (error.message && error.message.includes("No internal data found")) {
        alert(error.message);
      } else {
        alert("Prediction failed. Please try again or switch prediction modes.");
      }
      setStatus(AnalysisStatus.ERROR);
    } finally {
      setLoadingButton(null);
    }
  };

  const getRecommendedProfitabilityScore = () => {
    if (!result || !result.predictions) return 90;
    const crop = result.predictions.find(p => p.cropName === result.recommendedCrop);
    return crop ? crop.profitabilityScore : 90;
  };

  const predictions = result?.predictions || [];
  
  const isLoading = status === AnalysisStatus.ANALYZING_LOCATION || 
                    status === AnalysisStatus.PROCESSING_FILE ||
                    status === AnalysisStatus.RUNNING_ML_MODEL;

  // RENDER HELPERS
  const renderAnalysisView = () => (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Inputs */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Search className="w-5 h-5 mr-2 text-emerald-600" />
            Location Analysis
          </h2>
          
          <div className="space-y-6">
            <div className="relative" ref={suggestionsRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  onFocus={() => location && setShowSuggestions(true)}
                  placeholder="e.g. Punjab, Mandi, Nashik"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  autoComplete="off"
                />
                <button
                  onClick={handleVoiceSearch}
                  className={`absolute right-2 top-2 p-1 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-100'}`}
                  title="Search by voice"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              
              {showSuggestions && filteredLocations.length > 0 && (
                <ul className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredLocations.map((loc, index) => (
                    <li 
                      key={index}
                      onClick={() => selectLocation(loc)}
                      className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-gray-700 text-sm transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Select Prediction Method:</p>
              
              <button
                onClick={() => handlePredict('ML')}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-50 flex justify-center items-center"
              >
                {loadingButton === 'ML' ? <Loader2 className="animate-spin w-5 h-5" /> : <Database className="w-5 h-5 mr-2" />}
                Predict using Internal Data (ML)
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-3 text-gray-400 text-xs">OR</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                onClick={() => handlePredict('AI')}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-50 flex justify-center items-center"
              >
                {loadingButton === 'AI' ? <Loader2 className="animate-spin w-5 h-5" /> : <Globe className="w-5 h-5 mr-2" />}
                Predict using AI Search
              </button>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
              <strong>Note:</strong> Internal Data provides regression analysis on historical records. AI Search uses live web data for current market trends.
            </div>
          </div>
        </div>

        {/* Soil Card */}
        {result && !isLoading && (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 animate-fade-in-up">
            <h3 className="font-semibold text-gray-800 mb-4">Environmental Analysis</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-amber-100 p-2 rounded-lg mr-3">
                  <div className="w-5 h-5 bg-amber-500 rounded-full"></div> 
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Soil Type</p>
                  <p className="font-medium text-gray-800">{result.soilType}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Droplets className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Rainfall</p>
                  <p className="font-medium text-gray-800">{result.rainfall}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-red-100 p-2 rounded-lg mr-3">
                  <Thermometer className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Temperature</p>
                  <p className="font-medium text-gray-800">{result.temperature}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Results & Charts */}
      <div className="lg:col-span-2 space-y-6">
        {isLoading ? (
          <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-12 min-h-[500px]">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-6" />
            <h3 className="text-xl font-bold text-gray-800">Processing Request</h3>
            <p className="text-gray-500 mt-2 text-center max-w-md">
              {loadingButton === 'ML' 
                ? "Training Random Forest Regression Model on historical data..." 
                : "Analyzing live market trends using Gemini AI..."}
            </p>
          </div>
        ) : !result ? (
          <div className="h-full bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-12 min-h-[400px]">
            <Activity className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Ready to Predict</p>
            <p className="text-sm">Choose a method to generate crop price forecasts.</p>
          </div>
        ) : (
          <>
            {/* Recommendation Card */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Recommended: {result.recommendedCrop}</h2>
                  <p className="text-emerald-100 text-sm opacity-90">Based on profitability and soil suitability.</p>
                </div>
                <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-center">
                  <span className="block text-xs uppercase tracking-wide opacity-80">Profitability</span>
                  <span className="text-2xl font-bold">
                    {getRecommendedProfitabilityScore()}/100
                  </span>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-sm">
                <p><span className="font-bold text-emerald-200">Alternative:</span> {result.alternativeCrop} is also viable.</p>
              </div>
            </div>

            {/* Prediction Table */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Crop Predictions</h3>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  result.predictions[0]?.isAiGenerated 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {result.predictions[0]?.isAiGenerated ? 'Source: AI Web Search' : 'Source: Internal ML Model'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase bg-gray-50">
                      <th className="px-6 py-3">Crop</th>
                      <th className="px-6 py-3">Current Price</th>
                      <th className="px-6 py-3">Next Season</th>
                      <th className="px-6 py-3">Accuracy</th>
                      <th className="px-6 py-3">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {predictions && predictions.length > 0 ? (
                      predictions.map((crop, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-medium text-gray-800">
                            <div className="flex items-center">
                              {crop.cropName}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            ₹{crop.currentPrice} <span className="text-xs text-gray-400">/ {crop.unit}</span>
                          </td>
                          <td className={`px-6 py-4 font-bold ${crop.predictedPrice > crop.currentPrice ? 'text-emerald-600' : 'text-red-500'}`}>
                            ₹{crop.predictedPrice} <span className="text-xs text-emerald-400 opacity-70">/ {crop.unit}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-12 bg-gray-200 rounded-full h-1.5 mr-2">
                                <div 
                                  className={`h-1.5 rounded-full ${crop.accuracy > 80 ? 'bg-emerald-500' : crop.accuracy > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                  style={{ width: `${crop.accuracy}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 font-medium">{crop.accuracy}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {crop.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                            {crop.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />}
                            {crop.trend === 'stable' && <span className="text-gray-400 text-xs">Stable</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No predictions found. Try a different location or method.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts Section */}
            {predictions && predictions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PriceComparisonChart predictions={predictions} />
                <ProfitabilityChart predictions={predictions} />
                <div className="md:col-span-2">
                  <FutureTrendsChart predictions={predictions} />
                </div>
              </div>
            )}

            {/* ML Summary Footer */}
            <div className="bg-slate-800 text-slate-300 rounded-xl p-6 text-sm">
              <h4 className="text-white font-semibold mb-2">Analysis Summary</h4>
              
              {result.primaryDataSource && (
                <div className="mb-4 pb-4 border-b border-slate-700">
                   <span className="text-slate-400 text-xs uppercase font-bold tracking-wider flex items-center mb-1">
                     <Database className="w-3 h-3 mr-1" />
                     Primary Data Source
                   </span>
                   <p className="text-emerald-400 font-medium text-lg">
                     {result.primaryDataSource}
                   </p>
                </div>
              )}
              
              <p>{result.analysisSummary}</p>
              
              {/* Web Sources Display */}
              {result.webSources && result.webSources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h5 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center">
                    <Globe className="w-3 h-3 mr-1" /> 
                    Verified Links
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {result.webSources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center bg-slate-700 hover:bg-slate-600 hover:text-white text-emerald-400 text-xs px-3 py-1 rounded-full transition border border-slate-600"
                      >
                        {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-4 text-xs text-slate-500 pt-2 border-t border-slate-700 flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                AgroProfit AI System
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );

  const renderHistoryView = () => (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-emerald-600" />
          Prediction History
        </h2>
        {history.length > 0 && (
          <span className="text-sm text-gray-500">{history.length} saved reports</span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
           <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
             <Clock className="w-10 h-10 text-gray-300" />
           </div>
           <h3 className="text-lg font-medium text-gray-700">No History Yet</h3>
           <p className="text-gray-500 mb-6 max-w-md mx-auto">
             Your past analyses will appear here.
           </p>
           <button 
             onClick={() => setCurrentView('analysis')}
             className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2 rounded-lg transition"
           >
             Start New Analysis
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => loadHistoryItem(item)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{item.location}</h3>
                  <button 
                    onClick={(e) => deleteHistoryItem(e, item.id)}
                    className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50"
                    title="Delete from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center text-xs text-gray-500 mb-4">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(item.timestamp).toLocaleDateString()}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Top Crop:</span>
                    <span className="font-medium text-emerald-700">{item.result.recommendedCrop}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Source:</span>
                    <span className="font-medium text-gray-700">
                      {item.result.predictions[0]?.isAiGenerated ? 'AI Search' : 'Internal ML'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center text-emerald-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  View Full Report <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        onLogout={onLogout} 
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        {currentView === 'analysis' ? renderAnalysisView() : renderHistoryView()}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm flex flex-col md:flex-row justify-center items-center gap-2">
          <p>&copy; 2025 AgroProfit AI. Empowering Farmers with Intelligence.</p>
          <span className="hidden md:inline text-gray-300">|</span>
          <p className="flex items-center text-emerald-600">
             <ShieldCheck className="w-4 h-4 mr-1" /> Secure Prediction
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
