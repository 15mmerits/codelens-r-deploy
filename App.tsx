  /*/////////////////////////////////////////////////
  /*    CodeLens - AI Code Debugging Assistant     */
  /*   Built by Jay Praksh for Google DeepMind     */
  /*      Gemini 3 Hackathon (December 2025)       */
  /*  Kaggle: https://www.kaggle.com/godofoutcasts */
  /*       Powered by Gemini 3 Pro Preview         */
  ///////////////////////////////////////////////////
  
  import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Info, Palette, Sliders, ArrowUp, X, Activity, History, Trash2, Eraser, Maximize
} from 'lucide-react';
import { AppTheme, AnalysisResult, PracticeResponse, ExecutionResult, ExplanationMode, Language } from './types';
import * as GeminiService from './services/geminiService';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';

const App: React.FC = () => {
  // State: Theme & Preferences
  const [theme, setTheme] = useState<AppTheme>(AppTheme.DARK);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showDetailedTraces, setShowDetailedTraces] = useState(false);
  const [collapsePracticeByDefault, setCollapsePracticeByDefault] = useState(false);
  const [showReasoningSteps, setShowReasoningSteps] = useState(true);
  
  // Lazy init for fullscreen to ensure it defaults to FALSE and respects localStorage immediately
  const [startInFullscreen, setStartInFullscreen] = useState(() => {
    const saved = localStorage.getItem('codelens-fullscreen');
    return saved !== null ? saved === 'true' : false;
  });
  
  // State: Input
  const [code, setCode] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('unknown');
  const [mode, setMode] = useState<ExplanationMode>('beginner');
  const [isExampleActive, setIsExampleActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // State: Camera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // State: Logic
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // State: Execution
  const [isRunning, setIsRunning] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  
  // State: Practice
  const [practiceData, setPracticeData] = useState<PracticeResponse | null>(null);
  const [isPracticeExpanded, setIsPracticeExpanded] = useState(false);
  const [isPracticeLoading, setIsPracticeLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceFeedback, setPracticeFeedback] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [practiceCount, setPracticeCount] = useState(1);
  
  // State: History & Tabs
  // Lazy init for history
  const [history, setHistory] = useState<Array<{code: string, result: AnalysisResult, timestamp: number}>>(() => {
    const saved = localStorage.getItem('codelens-history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse history", e);
        return [];
      }
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [toast, setToast] = useState<string | null>(null);
  
  // State: UI
  const [showScrollTop, setShowScrollTop] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Initialize Theme and Preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('codelens-theme') as AppTheme;
    if (savedTheme) setTheme(savedTheme);
    
    const savedAutoScroll = localStorage.getItem('codelens-autoscroll');
    if (savedAutoScroll !== null) setAutoScroll(savedAutoScroll === 'true');
    
    const savedTraces = localStorage.getItem('codelens-traces');
    if (savedTraces !== null) setShowDetailedTraces(savedTraces === 'true');
    
    const savedCollapsePractice = localStorage.getItem('codelens-collapse-practice');
    if (savedCollapsePractice !== null) setCollapsePracticeByDefault(savedCollapsePractice === 'true');
    
    const savedReasoning = localStorage.getItem('codelens-reasoning');
    if (savedReasoning !== null) setShowReasoningSteps(savedReasoning === 'true');

    // Note: startInFullscreen is handled via lazy useState init
    // Note: history is handled via lazy useState init
  }, []);
  
  useEffect(() => {
    if (theme === AppTheme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('codelens-theme', theme);
  }, [theme]);
  
  // Persist preferences
  useEffect(() => {
    localStorage.setItem('codelens-autoscroll', String(autoScroll));
    localStorage.setItem('codelens-traces', String(showDetailedTraces));
    localStorage.setItem('codelens-collapse-practice', String(collapsePracticeByDefault));
    localStorage.setItem('codelens-reasoning', String(showReasoningSteps));
    localStorage.setItem('codelens-fullscreen', String(startInFullscreen));
  }, [autoScroll, showDetailedTraces, collapsePracticeByDefault, showReasoningSteps, startInFullscreen]);

  // Handle Fullscreen Logic
  useEffect(() => {
    if (startInFullscreen) {
      const enterFullscreen = () => {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(err => {
            console.log("Error attempting to enable full-screen mode:", err.message);
          });
        }
      };

      // Try immediately (might fail without user gesture)
      enterFullscreen();

      // Attach one-time listener for first interaction to trigger fullscreen
      const handleInteraction = () => {
        enterFullscreen();
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
      };

      window.addEventListener('click', handleInteraction);
      window.addEventListener('touchstart', handleInteraction);
      window.addEventListener('keydown', handleInteraction);

      return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
      };
    } else {
       // Optional: Exit fullscreen if setting is toggled off
       if (document.fullscreenElement && document.exitFullscreen) {
         document.exitFullscreen().catch(err => console.log(err));
       }
    }
  }, [startInFullscreen]);
  
  // Scroll to Top Listener
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);
  
  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Responsive check
  useEffect(() => {
    // Matches the lg:flex-row breakpoint (1024px) in the main layout
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
  
  // Helper for Math Mode detection
  const checkMathMode = (text: string) => {
    // If specific language selected, assume code
    if (language !== "Auto-detect") return false;
    
    // Check for math symbols and numbers
    const hasMath = /[\+\-\*\/^=]/.test(text) && /\d/.test(text);
    
    // Enhanced keyword list to include R (<-), Python (print, if, else), and general syntax ({, }, ;)
    const hasKeywords = /(def|class|function|var|let|const|return|import|include|public|static|void|console\.|System\.|print|println|if|else|for|while|try|catch|<-|=>|{|}|;)/.test(text);
    
    return hasMath && !hasKeywords;
  };
  const isMathMode = checkMathMode(code);
  
  // --- Camera Logic ---
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        streamRef.current = stream;
        setIsCameraOpen(true);
        
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Video play error:", e));
          }
        }, 100);
      } catch (err) {
        console.error("Camera access error:", err);
        alert("Could not access camera. Please allow permissions or use 'Upload Image' instead.");
        setIsCameraOpen(false);
      }
    };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };
  
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            const previewUrl = URL.createObjectURL(blob);
            setImagePreview(previewUrl);
            setImageFile(file);
            stopCamera();
            extractCode(file);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    extractCode(file);
  };
  
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };
  
  const extractCode = async (file: File) => {
    setIsAnalyzing(true);
    setIsExampleActive(false);
    setErrorMsg(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await GeminiService.extractCodeFromImage(base64, file.type);
        
        if (res.isMock) {
          setErrorMsg("Demo Mode: Quota exceeded. Loaded sample code instead.");
        } else if (res.confidence < 0.6) {
          setErrorMsg("I couldn't confidently find code in this image. Please crop closer or paste manually.");
        }
        
        setCode(res.text);
        if (res.language && res.language !== 'unknown') {
          setLanguage(res.language);
        }
        setIsAnalyzing(false);
      };
    } catch (e: any) {
      const msg = (e.message || "").toLowerCase();
      if (msg.includes("quota") || msg.includes("api quota")) {
        setErrorMsg("API Quota exceeded. Please try again later.");
      } else if (msg.includes("traffic") || msg.includes("rate limit")) {
        setErrorMsg("Traffic is high. Please wait 10s and try again.");
      } else {
        setErrorMsg("Failed to process image.");
      }
      setIsAnalyzing(false);
    }
  };
  
  const getPracticeContext = (currentAnalysis: AnalysisResult, codeText: string) => {
    let context = "";
    if (currentAnalysis.errorAnalysis?.errors && currentAnalysis.errorAnalysis.errors.length > 0) {
      context += `Identified Errors: ${currentAnalysis.errorAnalysis.errors.map(e => e.root_cause).join("; ")}.\n`;
    }
    const explanation = currentAnalysis.explanation?.text || currentAnalysis.errorAnalysis?.short_overlay || "";
    if (explanation) {
      context += `Analysis Summary: ${explanation.slice(0, 300)}.\n`;
    }
    context += `Original Input: ${codeText.slice(0, 300)}`;
    return context;
  };
  
  const fetchPracticeData = async (currentAnalysis: AnalysisResult, codeText: string) => {
    setIsPracticeLoading(true);
    setPracticeFeedback(null);
    setPracticeAnswer("");
    setShowHint(false);
    
    try {
      const context = getPracticeContext(currentAnalysis, codeText);
      const concept = currentAnalysis.conceptLabel || "logical reasoning";
      const res = await GeminiService.generatePractice(context, language, mode, concept);
      setPracticeData(res);
    } catch (e: any) {
      const errorMsg = (e.message || "").toLowerCase();
      if (errorMsg.includes("traffic") || errorMsg.includes("rate limit")) {
        setPracticeFeedback({ type: 'error', msg: "Traffic is high. Please wait 10s." });
      } else if (!errorMsg.includes("quota")) {
        setPracticeFeedback({ type: 'error', msg: "Failed to load practice." });
      }
    } finally {
      setIsPracticeLoading(false);
    }
  };
  
  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    setIsExampleActive(false);
    setAnalysis(null);
    setExecResult(null);
    setPracticeData(null);
    setShowHint(false);
    setPracticeAnswer("");
    setPracticeFeedback(null);
    setIsRegenerating(false);
    setPracticeCount(1);
    setErrorMsg(null);
    setActiveTab('current');
    
    const currentCode = code;
    
    try {
      const result = await GeminiService.analyzeCodeFull(currentCode, language, mode);
      setAnalysis(result);
      
      // History update
      setHistory(prev => {
        const newHistory = [{code: currentCode, result, timestamp: Date.now()}, ...prev].slice(0, 5);
        localStorage.setItem('codelens-history', JSON.stringify(newHistory));
        return newHistory;
      });
      
      if (result.isMock) {
        setErrorMsg("Demo Mode: API Quota exceeded. Showing simulated results.");
      }
      
      if (!collapsePracticeByDefault) {
        setIsPracticeExpanded(true);
        fetchPracticeData(result, currentCode); 
      } else {
        setIsPracticeExpanded(false);
      }
      
      if (autoScroll) {
        setTimeout(() => {
          if (window.innerWidth < 768) {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
          } else {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
      
    } catch (e: any) {
      const msg = (e.message || "").toLowerCase();
      if (msg.includes("quota") || msg.includes("api quota")) {
        setErrorMsg("API Quota exceeded. Please try again later.");
      } else if (msg.includes("traffic") || msg.includes("rate limit")) {
        setErrorMsg("Traffic is high. Please wait 10s and try again.");
      } else {
        setErrorMsg("Failed to analyze code. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleRunTest = async () => {
    if (!analysis?.correction) return;
    setIsRunning(true);
    try {
      const res = await GeminiService.mockRunTests(analysis.correction.corrected_code, analysis.correction.tests);
      setExecResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };
  
  const regeneratePractice = async () => {
    if (!analysis || isRegenerating) return;
    setIsRegenerating(true);
    
    try {
      const context = getPracticeContext(analysis, code);
      const concept = analysis.conceptLabel || "logical reasoning";
      const currentPrompt = practiceData?.problems?.[0]?.prompt;
      const res = await GeminiService.generatePractice(context, language, mode, concept, currentPrompt);
      
      if (res && res.problems && res.problems.length > 0) {
        setPracticeData(res);
        setPracticeAnswer("");
        setPracticeFeedback(null);
        setShowHint(false);
        setPracticeCount(prev => prev + 1);
      } else {
        setPracticeFeedback({ type: 'error', msg: "Could not generate a new problem." });
      }
    } catch (e: any) {
      const errorMsg = (e.message || "").toLowerCase();
      if (errorMsg.includes("traffic") || errorMsg.includes("rate limit")) {
        setPracticeFeedback({ type: 'error', msg: "Traffic is high. Please wait 10s and try again." });
      } else if (!errorMsg.includes("quota")) {
        setPracticeFeedback({ type: 'error', msg: "Network error. Try again." });
      }
    } finally {
      setIsRegenerating(false);
    }
  };
  
  const loadPractice = async () => {
    if (!isPracticeExpanded && !practiceData && analysis) {
      await fetchPracticeData(analysis, code);
    }
    setIsPracticeExpanded(!isPracticeExpanded);
  };
  
  const checkPractice = async () => {
    const trimmed = practiceAnswer.trim();
    const isNumeric = /^-?\d+(\.\d+)?$/.test(trimmed);
    
    if (!trimmed) {
      setPracticeFeedback({ type: 'error', msg: "Please write an answer." });
      return;
    }
    
    if (!isNumeric && trimmed.length < 5) {
      setPracticeFeedback({ type: 'error', msg: "Please write a complete answer." });
      return;
    }
    
    setPracticeFeedback({ type: 'success', msg: "Good job! That looks correct." });
  };
  
  const handleHistoryClick = (item: { code: string, result: AnalysisResult }) => {
    setCode(item.code);
    setAnalysis(item.result);
    setExecResult(null);
    setPracticeData(null);
    setIsPracticeExpanded(false);
    setActiveTab('current');
    
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleDeleteHistory = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newHist = [...history];
    newHist.splice(index, 1);
    setHistory(newHist);
    localStorage.setItem('codelens-history', JSON.stringify(newHist));
    showToast("Analysis deleted");
  };
  
  const handleClearHistory = () => {
    // Removed window.confirm to ensure the action always executes
    setHistory([]);
    localStorage.removeItem('codelens-history');
    showToast("History cleared");
  };
  
  const setExample = () => {
    let targetLang = language;
    if (targetLang === "Auto-detect") {
      targetLang = "R";
    }
    setLanguage(targetLang);
    
    let snippet = "";
    switch (targetLang) {
      case "R":
        snippet = mode === "beginner" ? `# R Example - Beginner\na <- 3\nprint(b) # Error: object 'b' not found` : `# R Example - Advanced\nsum_values <- function(vec) {\n  total <- 0\n  # Error: Loop range goes beyond vector length (off-by-one)\n  for (i in 1:(length(vec) + 1)) {\n    total <- total + vec[i]\n  }\n  return(total)\n}\n\nprint(sum_values(c(10, 20, 30)))`;
        break;
        case "Python":
          snippet = mode === "beginner" ? `# Python Example - Beginner\na = 5\nprint(b) # Error: name 'b' is not defined` : `# Python Example - Advanced\ndef factorial(n):\n    if n == 0:\n        # Error: Logic error, 0! should be 1\n        return 0 \n    return n * factorial(n - 1)\n\nprint(factorial(5))`;
          break;
          case "C++":
            snippet = mode === "beginner" ? `// C++ Example - Beginner\n#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 3;\n    cout << b << endl; // Error: 'b' was not declared in this scope\n    return 0;\n}` : `// C++ Example - Advanced\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> numbers = {1, 2, 3};\n    // Error: Loop condition <= allows access out of bounds\n    for (size_t i = 0; i <= numbers.size(); ++i) {\n        cout << numbers[i] << " ";\n    }\n    return 0;\n}`;
            break;
            case "JavaScript":
              snippet = mode === "beginner" ? `// JavaScript Example - Beginner\nlet a = 10;\nconsole.log(b); // Error: b is not defined` : `// JavaScript Example - Advanced\nconst items = [1, 2, 3];\n// Error: Assignment to constant variable 'i' (if logic changes) or accessing out of bounds\n// Here: Accessing index equal to length returns undefined\nfor (let i = 0; i <= items.length; i++) {\n  console.log(items[i].toString()); // Fails on last iteration (undefined.toString)\n}`;
              break;
              case "Java":
                snippet = mode === "beginner" ? `// Java Example - Beginner\npublic class Main {\n    public static void main(String[] args) {\n        int a = 50;\n        System.out.println(b); // Error: cannot find symbol variable b\n    }\n}` : `// Java Example - Advanced\nimport java.util.ArrayList;\n\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<String> list = new ArrayList<>();\n        list.add("Java");\n        // Error: Accessing index 1 when size is 1 (indices 0..size-1)\n        System.out.println(list.get(1)); \n    }\n}`;
                break;
                default:
                  snippet = `print("Hello World") # Unknown language`;
    }
    setCode(snippet);
    setIsExampleActive(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      
      {/* Header */}
    <header className="sticky top-0 z-50 h-16 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 px-4 md:px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md">
      <span className="font-mono text-xl font-bold">{`{}`}</span>
      </div>
      <div className="flex flex-col">
      <h1 className="text-xl font-bold tracking-tight leading-none">CodeLens</h1>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">A Multi-Language AI Debugging Assistant</p>
      </div>
      </div>
      <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
      <span className="bg-blue-100 dark:bg-blue-900 text-primary dark:text-blue-300 text-xs px-2 py-1 rounded-full font-bold">BETA</span>
      <div className="group relative flex items-center">
      <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help transition-colors" />
      <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-left leading-relaxed">
      CodeLens uses Gemini 3 Pro. It can sometimes be wrong or uncertain, so consider rerunning Analyze or double-checking important answers.
    </div>
      </div>
      </div>
      <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors active:scale-95">
      <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
      </div>
      </header>
      
      {/* Toast Notification */}
    {toast && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-gray-800 dark:bg-white text-white dark:text-black px-5 py-3 rounded-full shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
        <Info className="w-4 h-4" />
        {toast}
      </div>
    )}
    
    {/* Camera Modal */}
    {isCameraOpen && (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
        <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm animate-pulse">Align code in center</div>
        </div>
        <div className="h-28 bg-black/80 backdrop-blur-sm flex items-center justify-between px-8 pb-4">
        <button onClick={stopCamera} className="p-4 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"><X className="w-8 h-8"/></button>
        <button onClick={capturePhoto} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-transform hover:scale-105">
        <div className="w-14 h-14 bg-white rounded-full group-active:scale-90 transition-transform" />
        </button>
        <div className="w-16 flex justify-center"></div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        </div>
    )}
    
    {/* Settings Modal */}
    {isSettingsOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-lg">Settings</h3>
        <button onClick={() => setIsSettingsOpen(false)}><X className="w-5 h-5 hover:text-gray-500 transition-colors" /></button>
        </div>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center"><Palette className="w-4 h-4 mr-2" /> Appearance</h4>
        <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value as AppTheme)} className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none">
        <option value={AppTheme.DARK}>Dark</option>
        <option value={AppTheme.LIGHT}>Light</option>
        </select>
        </div>
        </div>
        <div className="p-6">
        <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center"><Sliders className="w-4 h-4 mr-2" /> Preferences</h4>
        <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show reasoning steps</span>
        <button onClick={() => setShowReasoningSteps(!showReasoningSteps)} className={`w-11 h-6 flex items-center rounded-full transition-colors ${showReasoningSteps ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${showReasoningSteps ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        </div>
        <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show detailed traces</span>
        <button onClick={() => setShowDetailedTraces(!showDetailedTraces)} className={`w-11 h-6 flex items-center rounded-full transition-colors ${showDetailedTraces ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${showDetailedTraces ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        </div>
        <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-scroll to results</span>
        <button onClick={() => setAutoScroll(!autoScroll)} className={`w-11 h-6 flex items-center rounded-full transition-colors ${autoScroll ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${autoScroll ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        </div>
        <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Collapse practice by default</span>
        <button onClick={() => setCollapsePracticeByDefault(!collapsePracticeByDefault)} className={`w-11 h-6 flex items-center rounded-full transition-colors ${collapsePracticeByDefault ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${collapsePracticeByDefault ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default to fullscreen</span>
            <span className="text-[10px] text-gray-500">Auto-enter fullscreen on interaction</span>
          </div>
          <button onClick={() => setStartInFullscreen(!startInFullscreen)} className={`w-11 h-6 flex items-center rounded-full transition-colors ${startInFullscreen ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${startInFullscreen ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 flex justify-end gap-3">
        <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-blue-700 active:scale-95 transition-transform">Done</button>
        </div>
        </div>
        </div>
    )}
    
    {/* Main Content */}
    <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 flex flex-col lg:flex-row gap-4 relative">
      
      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-all z-50 animate-in fade-in zoom-in hover:scale-110" aria-label="Scroll to top"><ArrowUp className="w-6 h-6" /></button>
      )}
    
    {/* LEFT COLUMN: Input */}
    <div className="w-full lg:w-[35%] flex flex-col gap-4">
      <InputPanel 
    code={code}
    setCode={setCode}
    language={language}
    setLanguage={setLanguage}
    mode={mode}
    setMode={setMode}
    imageFile={imageFile}
    imagePreview={imagePreview}
    onClearImage={clearImage}
    onCameraClick={startCamera}
    onUploadClick={handleImageUpload}
    onAnalyze={handleAnalyze}
    onRunTest={handleRunTest}
    isAnalyzing={isAnalyzing}
    isRunning={isRunning}
    canRun={!!analysis}
    errorMsg={errorMsg}
    onErrorClose={() => setErrorMsg(null)}
    />
      </div>
      
      {/* RIGHT COLUMN: Output */}
    <div ref={resultsRef} className="w-full lg:w-[65%] flex flex-col relative min-h-[400px] bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      
      {/* Tabs - Pill Style */}
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark z-10 sticky top-0">
      <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 w-full relative h-10">
      <div 
    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-md shadow-sm transition-all duration-300 ease-in-out ${activeTab === 'history' ? 'translate-x-[100%] ml-1' : 'translate-x-0'}`}
    />
      <button 
    onClick={() => setActiveTab('current')} 
    className={`flex-1 relative z-10 text-sm font-bold text-center py-1 transition-colors flex items-center justify-center gap-2 ${activeTab === 'current' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
    >
      <Activity className="w-4 h-4" /> Current Analysis
    </button>
      <button 
    onClick={() => setActiveTab('history')} 
    className={`flex-1 relative z-10 text-sm font-bold text-center py-1 transition-colors flex items-center justify-center gap-2 ${activeTab === 'history' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
    >
      <History className="w-4 h-4" /> History
    </button>
      </div>
      </div>
      
      <div className="flex-1 bg-background-light dark:bg-background-dark/50 relative overflow-y-auto">
      {activeTab === 'current' ? (
        <div className="p-4 md:p-6 h-full flex flex-col">
          <OutputPanel 
        analysis={analysis}
        code={code}
        isAnalyzing={isAnalyzing}
        isRunning={isRunning}
        execResult={execResult}
        practiceData={practiceData}
        isPracticeExpanded={isPracticeExpanded}
        onTogglePractice={loadPractice}
        isPracticeLoading={isPracticeLoading}
        isRegenerating={isRegenerating}
        practiceCount={practiceCount}
        mode={mode}
        practiceAnswer={practiceAnswer}
        setPracticeAnswer={setPracticeAnswer}
        practiceFeedback={practiceFeedback}
        onCheckPractice={checkPractice}
        onRegeneratePractice={regeneratePractice}
        showHint={showHint}
        setShowHint={setShowHint}
        showDetailedTraces={showDetailedTraces}
        isMathMode={isMathMode}
        onSetExample={setExample}
        isExampleActive={isExampleActive}
        isMobile={isMobile}
        showReasoningSteps={showReasoningSteps}
        />
          </div>
      ) : (
        <div className="h-full flex flex-col animate-in fade-in">
          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8">
              <History className="w-12 h-12 mb-3 opacity-20" />
              <p>No analysis history yet.</p>
              <p className="text-xs mt-1">Run your first code then check!</p>
              </div>
          ) : (
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <div className="flex flex-col gap-3">
              {history.map((item, idx) => (
                <div 
                key={idx}
                onClick={() => handleHistoryClick(item)}
                className="relative flex items-start gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark hover:border-primary/50 hover:shadow-md transition-all text-left group cursor-pointer"
                >
                  <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg text-orange-600 dark:text-[#e6af63] group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1 overflow-hidden pr-8">
                  <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${item.result.errorAnalysis?.errors.length ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'}`}>
                  {item.result.errorAnalysis?.errors.length ? 'Error' : 'Clean'}
                </span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1 truncate">
                  {item.code.split('\n')[0] || "Untitled Snippet"}
                </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {item.result.errorAnalysis?.short_overlay || "Analysis complete"}
                </p>
                  </div>
                  <button 
                onClick={(e) => handleDeleteHistory(e, idx)}
                className="absolute right-3 top-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                  </button>
                  </div>
              ))}
            </div>
              <div className="mt-6 flex justify-center pb-4">
              <button 
            type="button"
            onClick={handleClearHistory} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
            >
              <Eraser className="w-4 h-4" />
              Clear All History
            </button>
              </div>
              </div>
          )}
        </div>
      )}
    </div>
      </div>
      </main>
      
      <footer className="py-6 text-center text-xs text-gray-500 dark:text-gray-600 border-t border-gray-200 dark:border-gray-800 mt-auto">
      © 2025 CodeLens • Built with Gemini 3 Pro • R • Python • C++ • JavaScript • Java • Math & Reasoning
      </footer>
      </div>
  );
};

export default App;