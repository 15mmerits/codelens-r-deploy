import React, { useState } from 'react';
import { 
  GraduationCap, AlertTriangle, CheckCircle, XCircle, Lightbulb, 
  RotateCcw, ChevronDown, ChevronRight, Loader2, RefreshCw, Check, Copy, RotateCw, Brain
} from 'lucide-react';
import { AnalysisResult, ExecutionResult, PracticeResponse, ExplanationMode } from '../types';

// --- Subcomponents ---

const CodeBlock = ({ 
  code, 
  title, 
  highlightLines = [], 
  icon,
  enableCopy = false,
  highlightColor = 'red'
}: { 
  code: string, 
  title: string, 
  highlightLines?: number[], 
  icon?: React.ReactNode,
  enableCopy?: boolean,
  highlightColor?: 'red' | 'green'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        alert("Couldn’t copy. Please select and copy manually.");
      });
  };

  return (
    <div className="flex flex-col h-full border border-gray-700 dark:border-gray-600 rounded-lg overflow-hidden bg-[#2D2D2D] dark:bg-[#1e1e1e] transition-opacity duration-300 animate-in fade-in">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-200 dark:bg-[#2D2D2D] border-b border-gray-300 dark:border-gray-600">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
          {icon} {title}
        </span>
        {enableCopy && (
           <button 
             onClick={handleCopy}
             className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300 active:scale-95"
             title="Copy corrected code"
           >
             {copied ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
             <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
           </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-2 bg-[#F8F9FA] dark:bg-[#121212] relative">
        <pre className="font-mono text-sm leading-6">
          {code.split('\n').map((line, i) => {
            const lineNum = i + 1;
            const isHighlighted = highlightLines.includes(lineNum);
            
            let bgClass = '';
            let textClass = 'text-gray-800 dark:text-gray-300';
            
            if (isHighlighted) {
              if (highlightColor === 'green') {
                bgClass = 'bg-green-100 dark:bg-green-900/30';
                textClass = 'text-green-800 dark:text-green-200';
              } else {
                bgClass = 'bg-red-100 dark:bg-red-900/30';
                textClass = 'text-red-800 dark:text-red-200';
              }
            }

            return (
              <div 
                key={i} 
                className={`flex ${bgClass}`}
              >
                <span className="w-8 text-right mr-3 text-gray-400 select-none text-xs pt-1">{lineNum}</span>
                <span className={`flex-1 whitespace-pre-wrap ${textClass}`}>
                  {line}
                </span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};

// --- Main OutputPanel Component ---

interface OutputPanelProps {
  analysis: AnalysisResult | null;
  code: string;
  isAnalyzing: boolean;
  isRunning: boolean;
  execResult: ExecutionResult | null;
  practiceData: PracticeResponse | null;
  isPracticeExpanded: boolean;
  onTogglePractice: () => void;
  isPracticeLoading: boolean;
  isRegenerating: boolean;
  practiceCount: number;
  mode: ExplanationMode;
  practiceAnswer: string;
  setPracticeAnswer: (val: string) => void;
  practiceFeedback: { type: 'success' | 'error', msg: string } | null;
  onCheckPractice: () => void;
  onRegeneratePractice: () => void;
  showHint: boolean;
  setShowHint: (show: boolean) => void;
  showDetailedTraces: boolean;
  isMathMode: boolean;
  onSetExample: () => void;
  isExampleActive: boolean;
  isMobile: boolean;
  showReasoningSteps?: boolean;
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  analysis,
  code,
  isAnalyzing,
  isRunning,
  execResult,
  practiceData,
  isPracticeExpanded,
  onTogglePractice,
  isPracticeLoading,
  isRegenerating,
  practiceCount,
  mode,
  practiceAnswer,
  setPracticeAnswer,
  practiceFeedback,
  onCheckPractice,
  onRegeneratePractice,
  showHint,
  setShowHint,
  showDetailedTraces,
  isMathMode,
  onSetExample,
  isExampleActive,
  isMobile,
  showReasoningSteps = true
}) => {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(mode === 'advanced');

  return (
    <div className="flex flex-col gap-4 relative min-h-full flex-1">
          
      {/* Minimal Rotating Arrow Loader */}
      {isAnalyzing && (
        <div className="flex justify-center pt-24 animate-in fade-in zoom-in duration-300">
           <RotateCw className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '1.3s' }} />
        </div>
      )}

      {/* Loading Indicator for Execution (Overlay) */}
      {isRunning && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl animate-in fade-in">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <span className="text-sm font-bold bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-lg">Running Sandbox...</span>
            </div>
        </div>
      )}

      {/* Initial State / Welcome */}
      {!analysis && !isAnalyzing && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 md:p-8 animate-in fade-in zoom-in duration-500">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-6 rounded-full mb-6">
            <GraduationCap className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">Upload code to get started</h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4 leading-relaxed">
            Snap a photo of your code or paste it. CodeLens supports R, Python, C++, JavaScript, and Java. Get instant debugging help with language-specific explanations—in plain English.
          </p>

          {/* Language Support Badges */}
          <div className="flex gap-2 justify-center flex-wrap mb-8">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">R</span>
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">Python</span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">C++</span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">JavaScript</span>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">Java</span>
            
          </div>
          
          <button 
            onClick={onSetExample}

            className="group flex items-center gap-3 px-6 py-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
              <div className="scale-x-[-1] text-lg">📝</div>
            </div>
            <div className="text-left">
              <div className="font-bold text-sm text-gray-900 dark:text-white">
                {!isExampleActive 
                  ? "Or try an example" 
                  : (isMobile ? "Tap Analyze above to debug" : "← Click Analyze on the left to debug")
                }
              </div>
              <div className="text-xs text-gray-500">
                {!isExampleActive 
                  ? "Generates a bug based on Language & Mode" 
                  : (isMobile ? "Code generated. Tap Analyze above." : "Code generated. Click Analyze on the left.")
                }
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isAnalyzing && (
        <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-6 duration-700 fade-in">
          
          {/* Summary Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                  <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                    Analysis Report
                    {isMathMode && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Math Mode 🔢
                      </span>
                    )}
                    {analysis.isMock && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                        DEMO MODE
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{new Date().toLocaleTimeString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide 
                ${analysis.errorAnalysis?.errors.length ? 'bg-error' : 'bg-success'}
              `}>
                {analysis.errorAnalysis?.errors.length ? "Error Found" : "Looks Good!"}
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-primary">
                <h4 className="font-bold text-primary text-sm mb-1 uppercase">What I Found</h4>
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                  {analysis.explanation?.text || analysis.errorAnalysis?.short_overlay}
                </p>
              </div>

              {/* 🧠 How CodeLens Reasoned */}
              {showReasoningSteps && analysis.reasoningSteps && analysis.reasoningSteps.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">How CodeLens Reasoned</span>
                    </div>
                    {isReasoningExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </button>
                  {isReasoningExpanded && (
                    <div className="px-4 py-3 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-700">
                      <ol className="list-decimal list-inside space-y-2">
                        {analysis.reasoningSteps.map((step, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 pl-1 leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
              
              {analysis.errorAnalysis?.errors.map((err, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-red-50 dark:bg-red-900/10 p-3 rounded-lg animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms` }}>
                  <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 px-1.5 rounded">Line {err.line}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">The Issue</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{err.root_cause}</p>
                    {showDetailedTraces && (
                      <p className="text-xs text-gray-500 mt-1 font-mono">Confidence: {(err.confidence * 100).toFixed(0)}% • Kind: {err.kind}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code Debugger */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            <h3 className="font-bold text-lg mb-4">Code Debugger</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
              <CodeBlock 
                title="Your Input" 
                code={code} 
                highlightLines={analysis.errorAnalysis?.errors.map(e => e.line)}
                icon={<XCircle className="w-4 h-4 text-error" />}
                highlightColor="red"
              />
              <CodeBlock 
                title="Corrected" 
                code={analysis.correction?.corrected_code || ""} 
                highlightLines={analysis.correction?.fixed_lines || analysis.errorAnalysis?.errors.map(e => e.line)} 
                icon={<CheckCircle className="w-4 h-4 text-success" />}
                enableCopy={true}
                highlightColor="green"
              />
            </div>
            
            <div className="flex flex-col gap-2 mt-4">
              {analysis.correction?.patch_summary && (
                  <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg text-sm text-gray-800 dark:text-gray-200">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0" />
                    <span><strong>Fix:</strong> {analysis.correction.patch_summary}</span>
                  </div>
              )}
              
              {/* Follow-up Suggestion */}
              {analysis.followUpSuggestion && (
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg text-sm text-gray-800 dark:text-gray-200 animate-in fade-in slide-in-from-top-1">
                   <div className="bg-blue-200 dark:bg-blue-800/50 p-1 rounded-full">
                     <Lightbulb className="w-3 h-3 text-blue-700 dark:text-blue-300" />
                   </div>
                   <span><strong>💡 Next improvement:</strong> {analysis.followUpSuggestion}</span>
                </div>
              )}
            </div>
          </div>
          {/* ASCII Flow Diagram */}
          {analysis.flowDiagram && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom-4 duration-700 delay-150">
              <details className="group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900 dark:text-white">Execution Flow</h3>
                      <p className="text-xs text-gray-500">See how your code runs step-by-step</p>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1e1e1e]">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre leading-loose shadow-inner">
{analysis.flowDiagram.ascii}
                  </pre>
                  {analysis.flowDiagram.caption && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center italic">
                      {analysis.flowDiagram.caption}
                    </p>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Test Results */}
          {execResult && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gray-100 dark:bg-[#1e1e1e] px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-base">Test Execution Results</h3>
                <div className="text-xs text-gray-500">Generated by Sandbox</div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Test Case</th>
                      <th className="px-4 py-3">Output</th>
                      <th className="px-4 py-3">Expected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {execResult.test_results.length > 0 ? (
                      execResult.test_results.map((test, i) => (
                        <tr key={i} className={`border-b dark:border-gray-700 ${test.status === 'pass' ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-red-50/50 dark:bg-red-900/10'}`}>
                          <td className="px-4 py-3 font-bold">
                            {test.status === 'pass' ? <span className="text-success">PASS</span> : <span className="text-error">FAIL</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{test.id}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{test.output}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{test.expected}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-center text-gray-500">No tests available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-black text-gray-300 font-mono text-xs p-4 max-h-32 overflow-y-auto">
                <div className="text-gray-500 select-none">$ stdout &gt;</div>
                <pre>{execResult.stdout || "No output"}</pre>
                {execResult.stderr && (
                  <>
                    <div className="text-red-500 select-none mt-2">$ stderr &gt;</div>
                    <pre className="text-red-400">{execResult.stderr}</pre>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Practice Section */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <button 
              onClick={onTogglePractice}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                    <RotateCcw className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">Practice This Concept</h3>
                    <p className="text-xs text-gray-500">Get a quick exercise on {analysis.conceptLabel || analysis.errorAnalysis?.errors[0]?.kind || "this"}</p>
                </div>
              </div>
              {isPracticeExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            
            {isPracticeExpanded && (
              <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1e1e1e]">
                {isPracticeLoading ? (
                    <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" /> 
                      <span className="animate-pulse">Generating problem...</span>
                    </div>
                ) : practiceData?.problems[0] ? (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Problem {practiceCount}</span>
                        <div className="flex text-yellow-400 text-xs gap-0.5">
                          {mode === 'beginner' ? '⭐⭐' : '⭐⭐⭐⭐'}
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 mb-4 font-medium leading-relaxed">
                        {practiceData.problems[0].prompt}
                      </p>
                      
                      <div className="mb-4">
                        <textarea
                          value={practiceAnswer}
                          onChange={(e) => setPracticeAnswer(e.target.value)}
                          className="w-full h-24 rounded-lg bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                          placeholder="Type your answer here...(e.g., 'for (i in 1:length(vec))')"
                        />
                      </div>

                      {practiceFeedback && (
                        <div className={`mb-4 p-3 rounded-lg text-sm flex gap-2 items-start animate-in fade-in slide-in-from-top-1 ${practiceFeedback.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                          {practiceFeedback.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
                          <div>{practiceFeedback.msg}</div>
                        </div>
                      )}

                      <div className="flex gap-3 flex-wrap">
                        <button 
                          onClick={onCheckPractice}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        >
                          Check Answer
                        </button>
                        <button 
                          onClick={onRegeneratePractice}
                          disabled={isRegenerating}
                          className="px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-bold rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        >
                          {isRegenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              <span>New Problem</span>
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => setShowHint(true)}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-bold rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        >
                          Show Hint
                        </button>
                      </div>

                      {showHint && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold mr-1">Hint:</span>
                            {practiceData.problems[0].hint}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">Unable to load practice problems.</div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default OutputPanel;