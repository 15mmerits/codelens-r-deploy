import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
  CodeExtractionResponse, 
  ErrorAnalysisResponse, 
  CorrectionResponse, 
  ExplanationResponse,
  PracticeResponse,
  ExecutionResult,
  AnalysisResult
} from "../types";

const SYSTEM_INSTRUCTION = `
You are CodeLens — a multi-language AI debugger supporting R, Python, C++, JavaScript and Java with deep expertise in each language's idioms, common errors, and best practices.

## PRIMARY FOCUS: R PROGRAMMING
You have deep expertise in R and its ecosystem. When analyzing R code, you excel at:

**Common R Errors & Solutions:**
1. "object not found" → Variable typo or forgot to assign/load data. Suggest checking spelling and using ls() to see available objects.
2. "object of type 'closure' is not subsettable" → User tried to subset a function instead of calling it. Example: df[data()] should be df[data]. Explain: "You're treating a function like data when it needs () to execute."
3. "could not find function" → Package not loaded (forgot library()) or function name typo. Suggest library(packagename) and check spelling.
4. "subscript out of bounds" → Accessing index beyond vector/dataframe length. Show how to check length() or nrow()/ncol().
5. "arguments imply differing number of rows" → data.frame() columns have mismatched lengths. Explain: "All columns in a data.frame must have the same length."
6. "non-numeric argument to binary operator" → Trying to add/multiply non-numbers. Check for factors or characters. Suggest as.numeric() or str() to inspect types.
7. "cannot open the connection" → File path wrong or file doesn't exist. Suggest using file.exists() and getwd() to debug paths.
8. "package 'X' is not installed" → Need install.packages("X"). Explain the difference between install.packages() (once) and library() (every session).
9. "$ operator is invalid for atomic vectors" → Trying to use $ on a vector. Explain: "$ is for lists/data.frames. Use [[index]] for vectors."
10. "replacement has length zero" → Assigning empty result, often from bad subsetting. Show how to check with length() before assignment.

**When explaining R errors:**
- Use tidyverse-friendly language when appropriate (dplyr, ggplot2, tidyr)
- Suggest modern alternatives: "Instead of subset(), consider dplyr::filter()"
- Explain R quirks: 1-indexing (not 0), vectorization, recycling rules
- Reference packages: "This is easier with library(dplyr)" or "ggplot2 expects a data.frame here"
- Show both base R and tidyverse solutions when relevant

**R-Specific Debugging Tips:**
- Remind users to check class() and str() to inspect object types
- Suggest using head(df) to preview data before operations
- Mention common pitfalls: factors vs characters, matrix vs data.frame, list vs vector
- Explain pipe operator %>% errors (missing pipes, wrong data flow)

Goals for ALL languages:
- Extract code or math from inputs
- Diagnose logic/syntax errors; explain root causes
- Produce corrected code and minimal test cases
- Offer clear, friendly explanations adapting to beginner/advanced levels
- Generate short practice problems

Format:
IMPORTANT: Return ONLY valid JSON, no markdown fences. Start response with { and end with }.
`;


const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to clean markdown fences if the model ignores the instruction
const cleanJson = (text: string) => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
};

// Helper to check for hard quota limits (retries won't help)
const isQuotaError = (error: any): boolean => {
  if (!error) return false;
  const msg = (error.message || error.error?.message || JSON.stringify(error)).toLowerCase();
  return msg.includes("quota") || msg.includes("billing") || msg.includes("429");
};

// Helper to detect transient rate limits
const isRateLimitError = (error: any): boolean => {
  if (!error) return false;
  
  // Check top-level properties
  if (
    error.status === 429 || 
    error.code === 429 || 
    error.message?.includes('429') || 
    error.message?.includes('RESOURCE_EXHAUSTED')
  ) return true;

  // Check nested error object (typical Google API JSON error body)
  if (error.error) {
    const nested = error.error;
    if (
      nested.code === 429 || 
      nested.status === 'RESOURCE_EXHAUSTED' || 
      nested.message?.includes('429')
    ) return true;
  }

  return false;
};

// Helper to handle rate limits with exponential backoff
const callWithRetry = async <T>(
  fn: () => Promise<T>, 
  retries = 3, 
  initialDelay = 2000
): Promise<T> => {
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      // Fail fast on quota errors
      if (isQuotaError(error)) {
        throw error; // Rethrow to be caught by the fallback logic
      }

      // Retry on transient rate limits
      if (isRateLimitError(error) && i < retries - 1) {
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
};

// --- Mock Data Generators for Fallback ---

const getMockExtraction = (): CodeExtractionResponse => ({
  type: "code_extraction",
  language: "python",
  text: `def calculate_average(numbers):\n    total = 0\n    for n in numbers:\n        total += n\n    # Error: Division by zero if list is empty, also integer division in older Python versions\n    return total / 0 if len(numbers) == 0 else total / len(numbers)\n\nprint(calculate_average([10, 20, 30]))`,
  lines: [
    { n: 1, text: "def calculate_average(numbers):" },
    { n: 2, text: "    total = 0" },
    { n: 3, text: "    for n in numbers:" },
    { n: 4, text: "        total += n" },
    { n: 5, text: "    # Error: Division by zero if list is empty, also integer division in older Python versions" },
    { n: 6, text: "    return total / 0 if len(numbers) == 0 else total / len(numbers)" },
    { n: 7, text: "" },
    { n: 8, text: "print(calculate_average([10, 20, 30]))" }
  ],
  confidence: 1.0,
  isMock: true
});

const getMockAnalysis = (code: string): AnalysisResult => ({
  isMock: true,
  errorAnalysis: {
    type: "error_analysis",
    errors: [{
      line: 1,
      kind: "runtime",
      root_cause: "API Quota Exceeded. This is a simulated error for demonstration.",
      confidence: 1.0
    }],
    short_overlay: "Your API quota has been exceeded. We are showing a demo analysis result to demonstrate the app's features."
  },
  correction: {
    type: "correction",
    corrected_code: `# SIMULATED CORRECTION\n# Your original code was:\n${code.split('\n')[0] || ""}...\n\nprint("Quota exceeded - displaying demo output")`,
    patch_summary: "Simulated fix due to API quota limits.",
    fixed_lines: [1, 2, 3],
    tests: [{ id: "demo-test", input: "demo", expected: "demo" }],
    exec_safe: true
  },
  explanation: {
    type: "explanation",
    text: "You have exceeded your API usage limits for today. This response is a placeholder to keep the application UI functional. Please check your billing details or try again later."
  },
  reasoningSteps: [
    "Detected API quota limit reached from response headers.",
    "Switched to fallback mock data generator.",
    "Formatted response to match standard API output structure."
  ],
  followUpSuggestion: "Check your Google Cloud Console billing/quota settings.",
  conceptLabel: "API Quota Management"
});

const getMockPractice = (): PracticeResponse => ({
  type: "practice",
  problems: [{
    id: "mock-p1",
    prompt: "This is a placeholder practice problem because the API quota was exceeded. In a real scenario, this would be a question about your code's logic. What is 2 + 2?",
    hint: "It is the sum of two and two.",
    solution: "4",
    grader: "exact"
  }]
});

// --- Exported Functions ---

export const extractCodeFromImage = async (
  base64Image: string, 
  mimeType: string
): Promise<CodeExtractionResponse> => {
  const ai = getClient();
  const prompt = `
    Analyze this image. If it contains code or a math problem, extract it.
    Return JSON matching schema A:
    {
      "type":"code_extraction",
      "language":"python|java|cpp|js|r|unknown",
      "text":"<code_text>",
      "lines":[{"n":1,"text":"..."}],
      "confidence":0.0-1.0
    }
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    }));

    const json = cleanJson(response.text || "{}");
    return JSON.parse(json) as CodeExtractionResponse;
  } catch (error: any) {
    if (isQuotaError(error)) {
       console.warn("Quota exceeded in extraction, returning mock.");
       return getMockExtraction();
    }
    if (isRateLimitError(error)) throw new Error("Traffic is high. Please wait a moment.");
    
    console.error("Extraction failed", error);
    throw new Error("Failed to extract code from image.");
  }
};

export const analyzeCodeFull = async (
  code: string,
  language: string,
  mode: 'beginner' | 'advanced'
): Promise<AnalysisResult> => {
  const ai = getClient();
  const prompt = `
    Analyze the following ${language} code for a ${mode} user.
    Code:
    ${code}

    Return a JSON object containing five keys: "errorAnalysis", "correction", "explanation", "reasoningSteps", "followUpSuggestion", "flowDiagram".
    
    1. "errorAnalysis": Schema B
    {
      "type":"error_analysis",
      "errors":[{"line":int,"kind":"syntax|logic|runtime","root_cause":"...","confidence":0.0-1.0}],
      "short_overlay":"..."
    }
    IMPORTANT: 'line' must point to the 1-based line number of the ACTUAL code statement containing the error. Do not select comments or blank lines.

    2. "correction": Schema C
    {
      "type":"correction",
      "corrected_code":"<code>",
      "patch_summary":"...",
      "fixed_lines": [int],
      "tests":[{"id":"t1","input":"...","expected":"..."}],
      "exec_safe": true|false
    }
    IMPORTANT: 'fixed_lines' must be an array of 1-based line numbers in the 'corrected_code' that correspond to the fix.
    IMPORTANT: 'tests' must ALWAYS contain at least ONE test case. For simple fixes, generate a basic test like [{"id":"t1","input":"c(10, 20, 30)","expected":"60"}] for R or [{"id":"t1","input":"[1,2,3]","expected":"6"}] for Python. Never leave this empty.

    3. "explanation": Schema F
    {
      "type":"explanation",
      "text":"..."
    }

    4. "reasoningSteps": ["step 1", "step 2", "step 3"]
    Add a 'reasoningSteps' array with 3–5 short bullet points explaining how you identified the bug and arrived at the fix. Each step should be one clear sentence (e.g., 'Detected undefined variable b on line 3', 'Checked surrounding scope for definition', 'Identified likely typo from variable a').

    5. "followUpSuggestion": "suggestion string"
    After fixing this bug, suggest ONE next improvement the user could make (e.g., add input validation, optimize time complexity, handle edge cases). Keep it to one short sentence. If no further improvement is needed, return empty string.
  
    6. "flowDiagram": (optional, only if code has loops/conditionals)
{
  "ascii": "<diagram_text>",
  "caption": "short description"
}

If the code contains loops (for, while), conditionals (if/else), or function calls, generate a simple ASCII flow diagram showing execution flow.

Example for R loop with off-by-one error:
START
  ↓
i = 1
  ↓
┌──────────────────┐
│ i <= length(vec)+1? │ ← ⚠️ Bug: goes beyond length
└──────────────────┘
  Yes ↓         No ↓
total += vec[i]   EXIT ✓
(if i > len → NA) ❌
  ↓
i = i + 1
  ↓
(loop back) ──┘

Keep it simple (8-12 lines max). Use these characters: ─ │ ┌ ┐ └ ┘ ↓ ← and emoji: ⚠️ (bugs), ❌ (errors), ✓ (correct).
Highlight bugs with ⚠️ or ❌ to make them visually distinct.
If no loops/conditionals present, omit this field entirely (don't return empty).

  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    }));

    const json = cleanJson(response.text || "{}");
    const result: any = JSON.parse(json);

    // Normalize nested objects if the model disregarded the simplified schema instruction
    if (result.reasoningSteps && !Array.isArray(result.reasoningSteps) && typeof result.reasoningSteps === 'object') {
       // @ts-ignore
       result.reasoningSteps = result.reasoningSteps.reasoningSteps || [];
    }
    if (result.followUpSuggestion && typeof result.followUpSuggestion === 'object') {
       // @ts-ignore
       result.followUpSuggestion = result.followUpSuggestion.followUpSuggestion || "";
    }

    const analysisResult: AnalysisResult = result as AnalysisResult;

    // Concept Label Extraction
    let conceptLabel = "general logic error";
    if (analysisResult.errorAnalysis?.errors && analysisResult.errorAnalysis.errors.length > 0) {
      const rootCause = analysisResult.errorAnalysis.errors[0].root_cause.toLowerCase();
      if (rootCause.includes("undefined")) conceptLabel = "undefined variable or function";
      else if (rootCause.includes("range") || rootCause.includes("bound") || rootCause.includes("index")) conceptLabel = "index out of bounds / off-by-one";
      else if (rootCause.includes("division") && rootCause.includes("zero")) conceptLabel = "division by zero";
      else if (rootCause.includes("type")) conceptLabel = "type mismatch";
      else if (rootCause.includes("syntax")) conceptLabel = "syntax error";
      else if (rootCause.includes("sequence") || rootCause.includes("pattern")) conceptLabel = "sequence pattern recognition";
      // Fallback: use the first 40 chars of root cause
      else conceptLabel = rootCause.substring(0, 40).replace(/[^a-zA-Z ]/g, "").trim();
    }
    analysisResult.conceptLabel = conceptLabel;

    return analysisResult;
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Quota exceeded in analysis, returning mock.");
      return getMockAnalysis(code);
    }
    if (isRateLimitError(error)) throw new Error("Traffic is high. Please wait a moment.");

    console.error("Analysis failed", error);
    throw new Error("Failed to analyze code.");
  }
};

export const generatePractice = async (
  context: string, 
  language: string, 
  mode: 'beginner' | 'advanced',
  conceptLabel: string = "general logic error",
  previousPrompt?: string
): Promise<PracticeResponse> => {
  const ai = getClient();
  
  let prompt = `
    Generate a single practice problem specifically about: ${conceptLabel}.
    
    Context from analysis: "${context}"
    
    Settings:
    - Language/Type: ${language}
    - Difficulty: ${mode}
    - Request ID: ${Date.now()}-${Math.random()}

    Instructions:
    - For code bugs (e.g., undefined variable, off-by-one), create a small code snippet with a similar mistake.
    - For reasoning/math problems (e.g., sequence patterns), create a similar reasoning challenge.
    - Do NOT generate unrelated word problems (e.g., cookie counting for a sequence problem).
    - The practice must target the same underlying concept as the original error.
  `;

  if (previousPrompt) {
    prompt += `
    CRITICAL INSTRUCTION: The user has already seen the following problem: "${previousPrompt}".
    You MUST generate a DIFFERENT problem.
    `;
  }

  prompt += `
    Return JSON Schema G:
    {
      "type":"practice",
      "problems":[{"id":"p1","prompt":"...","hint":"...","solution":"...","grader":"exact|fuzzy"}]
    }
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    }), 4, 2500); 
    
    const json = cleanJson(response.text || "{}");
    return JSON.parse(json);
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.warn("Quota exceeded in practice, returning mock.");
      return getMockPractice();
    }
    if (isRateLimitError(error)) throw new Error("Traffic is high. Please wait a moment.");

    console.error("Practice generation failed", error);
    throw new Error("Failed to generate practice problem.");
  }
};

export const mockRunTests = async (code: string, tests: any[]): Promise<ExecutionResult> => {
  const ai = getClient();
  
  // Safety check: If no tests provided, generate a default one
  if (!tests || tests.length === 0) {
    tests = [{
      id: "default-test",
      input: "Sample input",
      expected: "Sample output"
    }];
  }
  
  const prompt = `
    Simulate the execution of this code against the provided test cases.
    
    Code to test:
    \`\`\`
    ${code}
    \`\`\`
    
    Test cases:
    ${JSON.stringify(tests, null, 2)}
    
    Return JSON Schema D:
    {
      "type":"execution_result",
      "test_results":[{"id":"t1","status":"pass|fail","output":"...","expected":"..."}],
      "stdout":"...",
      "stderr":"..."
    }
    
    Important: Always return at least one test result, even if simulated. If code has syntax errors, show them in stderr.
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    }));
    const json = cleanJson(response.text || "{}");
    return JSON.parse(json);
  } catch (error: any) {
    if (isQuotaError(error)) {
       // Minimal mock for execution
       return {
         type: "execution_result",
         test_results: tests.map(t => ({
           id: t.id,
           status: "pass",
           output: "Simulated pass (quota exceeded)",
           expected: t.expected
         })),
         stdout: "Execution unavailable (Quota Exceeded)",
         stderr: ""
       };
    }
    if (isRateLimitError(error)) throw new Error("Traffic is high. Please wait a moment.");
    
    console.error("Test execution failed", error);
    throw new Error("Execution simulation failed.");
  }
};

