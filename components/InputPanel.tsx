import React, { useRef } from 'react';
import { Camera, Upload, X, Loader2, AlertTriangle } from 'lucide-react';
import { Language, ExplanationMode } from '../types';

interface InputPanelProps {
  code: string;
  setCode: (code: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  mode: ExplanationMode;
  setMode: (mode: ExplanationMode) => void;
  imageFile: File | null;
  imagePreview: string | null;
  onClearImage: () => void;
  onCameraClick: () => void;
  onUploadClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onRunTest: () => void;
  isAnalyzing: boolean;
  isRunning: boolean;
  canRun: boolean;
  errorMsg: string | null;
  onErrorClose: () => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  code,
  setCode,
  language,
  setLanguage,
  mode,
  setMode,
  imageFile,
  imagePreview,
  onClearImage,
  onCameraClick,
  onUploadClick,
  onAnalyze,
  onRunTest,
  isAnalyzing,
  isRunning,
  canRun,
  errorMsg,
  onErrorClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
      
      {/* Input Source Card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 animate-in fade-in">
        <h2 className="text-center font-bold text-lg mb-4 text-gray-900 dark:text-white">Input Source</h2>
        <div className="flex gap-3 mb-2">
          <button 
            onClick={onCameraClick}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-[1.02] text-sm font-medium active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" /> Camera
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-[1.02] text-sm font-medium active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" /> Upload Image
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={onUploadClick}
          />
        </div>
        {imageFile && (
          <div className="flex items-center gap-3 mt-3 bg-gray-100 dark:bg-black/30 p-2 rounded-lg animate-in fade-in zoom-in">
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded" />
            )}
            <span className="text-xs text-gray-500 truncate flex-1">{imageFile.name}</span>
            <button onClick={onClearImage} className="text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Options */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 animate-in fade-in delay-75">
         <div className="flex-1 min-w-[120px]">
           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Language</label>
           <select 
             value={language}
             onChange={(e) => setLanguage(e.target.value)}
             className="w-full text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 py-1 focus:outline-none focus:border-primary transition-colors cursor-pointer"
           >
             <option>Auto-detect</option>
             <option>R</option>
             <option>Python</option>
             <option>C++</option>
             <option>JavaScript</option>
             <option>Java</option>
           </select>
         </div>
         <div className="flex-1 min-w-[140px] flex flex-col items-end">
           <div className="w-full max-w-[180px]">
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-center">Mode</label>
             <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 w-full relative h-9">
               <div 
                 className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-md shadow-sm border border-blue-400 dark:border-blue-300 transition-all duration-300 ease-in-out ${mode === 'advanced' ? 'translate-x-[100%] ml-1' : 'translate-x-0'}`}
               />
               <button 
                 onClick={() => setMode('beginner')} 
                 className={`flex-1 relative z-10 text-xs font-bold text-center py-1 transition-colors ${mode === 'beginner' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
               >
                 Beginner
               </button>
               <button 
                 onClick={() => setMode('advanced')} 
                 className={`flex-1 relative z-10 text-xs font-bold text-center py-1 transition-colors ${mode === 'advanced' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
               >
                 Advanced
               </button>
             </div>
           </div>
         </div>
      </div>
      {/* Language Support Indicators */}
        {language === 'unknown' && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>Supports:</span>
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-medium">R</span>
              <span className="px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-full text-[10px] font-medium">Python</span>
              <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-medium">C++</span>
              <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-[10px] font-medium">JavaScript</span>
              <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full text-[10px] font-medium">Java</span>
            </div>
          </div>
        )}

      {/* Code Editor */}
      <div className="flex-1 min-h-[300px] lg:min-h-[350px] flex flex-col animate-in fade-in delay-100">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`# Paste your code here (R, Python, C++, JS, Java)...\n\nOr snap a photo of your code.\n\nCodeLens auto-detects language and explains errors in plain English.`}
          className="flex-1 w-full p-4 rounded-xl font-mono text-sm bg-[#e5e5e5] dark:bg-[#121212] text-gray-800 dark:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 placeholder-gray-500 transition-all"
          spellCheck={false}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 animate-in fade-in delay-150">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || (!code.trim() && !imageFile)}
          className={`
            w-full py-3 rounded-xl font-bold text-white transition-all duration-200
            ${isAnalyzing || (!code.trim() && !imageFile) 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-primary hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] hover:scale-[1.02] active:scale-[0.98]'
            }
          `}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">Analyzing... <Loader2 className="w-5 h-5 animate-spin" /></span>
          ) : (
            <span>Analyze</span>
          )}
        </button>

        {canRun && (
          <button
            onClick={onRunTest}
            disabled={isRunning}
            className="w-full py-3 rounded-xl font-bold text-background-dark bg-warning hover:bg-amber-400 shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">Running tests... <Loader2 className="w-5 h-5 animate-spin" /></span>
            ) : (
              <span>Run & Test</span>
            )}
          </button>
        )}

        {errorMsg && (
          <div className={`
            px-4 py-3 rounded-lg text-sm flex items-start justify-between gap-2 animate-in fade-in slide-in-from-top-2
            ${errorMsg.includes("Demo") ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400' : 'bg-red-500/10 border border-red-500/30 text-red-500'}
          `}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
            <button onClick={onErrorClose} className="hover:opacity-70 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputPanel;