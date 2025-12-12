export interface CodeExtractionResponse {
  type: "code_extraction";
  language: string;
  text: string;
  lines: { n: number; text: string }[];
  confidence: number;
  isMock?: boolean;
}

export interface ErrorDetail {
  line: number;
  kind: "syntax" | "logic" | "runtime";
  root_cause: string;
  confidence: number;
}

export interface ErrorAnalysisResponse {
  type: "error_analysis";
  errors: ErrorDetail[];
  short_overlay: string;
}

export interface TestCase {
  id: string;
  input: string;
  expected: string;
}

export interface CorrectionResponse {
  type: "correction";
  corrected_code: string;
  patch_summary: string;
  fixed_lines?: number[];
  tests: TestCase[];
  exec_safe: boolean;
}

export interface ExplanationResponse {
  type: "explanation";
  text: string;
}

export interface PracticeProblem {
  id: string;
  prompt: string;
  hint: string;
  solution: string;
  grader: "exact" | "fuzzy";
}

export interface PracticeResponse {
  type: "practice";
  problems: PracticeProblem[];
}

export interface ExecutionResult {
  type: "execution_result";
  test_results: {
    id: string;
    status: "pass" | "fail";
    output: string;
    expected: string;
  }[];
  stdout: string;
  stderr: string;
}

// Combined Analysis Type for the App State
export interface AnalysisResult {
  errorAnalysis?: ErrorAnalysisResponse;
  correction?: CorrectionResponse;
  explanation?: ExplanationResponse;
  reasoningSteps?: string[];
  followUpSuggestion?: string;
  conceptLabel?: string;
  flowDiagram?: {
    ascii: string;
    caption?: string;
  };
  isMock?: boolean;
}

export enum AppTheme {
  DARK = 'dark',
  LIGHT = 'light'
}

export type Language = string;
export type ExplanationMode = 'beginner' | 'advanced';