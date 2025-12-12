
# CodeLens — AI Debugging That Actually Teaches  
Turn confusing error messages into **visual learning experiences**.


<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_Blank_UI.png" />
</div>


## ⭐ Overview

CodeLens is an AI-powered debugging assistant built with **Gemini 3 Pro**.  
It helps beginners understand *why* their code breaks instead of just showing a fix.

Whether you paste code, upload a screenshot, or point your phone camera at your screen, CodeLens explains the error visually through **ASCII execution-flow diagrams**, corrected code, and guided practice questions.

Supported languages include **Python, R, JavaScript, Java, and C++**.

---

# Why CodeLens Exists

**70% of new programmers quit in their first year** because error messages feel cryptic.  
For example:

 numbers <-

'for i in range(len(numbers) + 1):
print(numbers[i])
IndexError: list index out of range '

This does not tell a beginner:
- where the loop broke  
- why the value failed  
- what to change  

CodeLens fixes this with visual explanation.

---

# ✨ Key Features

## 1. ASCII Execution-Flow Diagrams  
CodeLens shows *exactly* how your code ran and where it snapped.

Example:

START
  ↓
i = 0
  ↓
| i < len(numbers) + 1 | ← ⚠️ Loop runs 1 extra time
  ↓ Yes              No ↓
numbers[i]           EXIT
(If i == len) ❌ IndexError
  ↓
i = i + 1
  ↓
(loop back) ⟲

This helps beginners see the bug in seconds.

---

## 2. Multimodal Input

- **Paste code**  
- **Upload screenshots / whiteboard photos**  
- **Live camera debugging** (point your phone at your laptop screen)

Gemini 3 Pro Vision handles everything.

---

## 3. Auto Language Detection

CodeLens understands syntax and instantly knows:

- Python  
- R
- C++
- JavaScript  
- Java  
- Math & Reasoning

No dropdown selection needed — detection is automatic.

---

## 4. Beginner / Advanced Modes

### Beginner Mode  
- Simple English  
- Analogies  
- Step-by-step corrections  

### Advanced Mode  
- Technical explanations  
- Performance notes  
- Best-practice suggestions  

---

## 5. Full Debug Pipeline

📷 OCR (if using camera/screenshot)
➡️ Language Detection
➡️ Error Analysis
➡️ ASCII Flow Diagram Generation
➡️ Corrected Code
➡️ Auto-Generated Test Bench
➡️ Related Practice Problems

Runs in **1–2 minutes**.

---

## 6. Practice Problem Generator

After fixing a bug, CodeLens gives similar problems so learners gain long-term understanding.

---

## 7. Smart History Tracking

All debugging sessions are stored.  

---

## 8. Developer-Friendly UI

- Side-by-side debugging view  
- History panel  
- Run & Test sandbox  
- Clean light/dark modes
- Desktop responsive
- Mobile responsive
- Tablet responsive

---

# Real-World Impact

CodeLens was beta-tested in **5 programming subreddits** (combined reach ~540K learners):

- r/learnpython  
- r/rstats  
- r/javascript  
- r/learnjava  
- r/ProgrammingBuddies  

**Average time to solve an error:**  
  **30–45 min → < 2 min**

**Results:**  
- 85% understood the underlying concept  
- 60% returned for more debugging sessions  


---

📸 Screenshots

Add your screenshots in /screenshots/ and reference them:


![UI](https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_Blank_UI.png)
![Processing](https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_Processing_UI.png)
![History](https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_History_UI.png)
![Settings](https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_Settings.png)
![Analysis](https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_Analysis_UI.png)
![Debugging](https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_Code-Debugging.png)
![Diagram](https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_ASCII-diagrams.png)
![Practice](https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_Practice.png)
![Sandbox](https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_Sandboxed-Test_Process.png)
![Sandbox-Test](https://github.com/15mmerits/codelens-r-deploy/blob/main/screenshots/CodeLens_Sandboxed-Test_Result.png)


🎬 Demo Video

Coming soon — 


## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`



📄 License

MIT License — feel free to modify, share, and build on top of CodeLens.

👨‍💻 Author

**Jay Prakash**  
Self-taught data scientist | Ex-ME student | Google certified Data Analyst  
Active Kaggle competitor (Top 400-1000 in Playground Series)

GitHub: [@15mmerits](https://github.com/15mmerits)

LinkedIn: [15mmerits](https://linkedin.com/in/15mmerits)

Kaggle: [godofoutcasts](https://kaggle.com/godofoutcasts)

---

⭐ If CodeLens helped you, please consider starring the repo!

Built with ❤️ for every programmer who ever felt stuck.


<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>



