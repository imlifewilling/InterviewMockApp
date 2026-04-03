# AI InterviewMockApp

Welcome to **InterviewMockApp** — an AI-powered conversational interview coach designed to simulate a realistic, 30-minute behavioral mock interview.

This application doesn't just read questions to you; it autonomously parses the requirements from a real job posting URL, adapts the questions to match the exact role, and conducts a dynamic dialogue-driven interview. After completion, it analyzes your video/audio transcriptions and acts like an expert recruiter to offer granular feedback on your overall presentation according to the STAR method.

---

## 🚀 Features
- **Job Posting Analysis:** Paste a job link and let the AI extract the company name, role, expected seniority, culture signals, and required skills.
- **Dynamic Question Generation:** Utilizing the job profile, the app synthesizes tailored behavioral interview questions relevant strictly to the role.
- **Personalized STAR Suggestions:** Upload a text-based resume before the session, and the AI will analyze your background alongside the job to construct a strong, personalized example answer formatted in the STAR method for reference.
- **Conversational Recruiter AI:** The application manages an immersive environment running within a 30-minute logical span, utilizing `window.speechSynthesis` (Text-to-Speech) to audibly ask you questions and gracefully wrap up the mock interview when the time runs out.
- **Candidate Q&A Phase:** Ask the simulated recruiter realistic questions about the role or company. The recruiter acts dynamically through conversation context!
- **Real-Time Video & Transcription:** Integration with `MediaRecorder` and the Web Speech API securely records your answer on device while transcribing your response.
- **Expert Rubric Evaluation:** Computes and assesses your answer transcript via Google's Gemini 1.5 Flash algorithm to provide quantitative *(0-100)* scores on Delivery and Content, highlighting strengths, room for improvement, and a suggested robust alternative answer.

---

## 🛠️ Tech Stack
- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Core Library:** React 18
- **Language:** TypeScript
- **AI Processing Engine:** Google Gemini 1.5 Flash / `@google/generative-ai`
- **Audio/Video Context:** browser-native `MediaStream`, `MediaRecorder`, and `Web Speech API` (SpeechRecognition & speechSynthesis)
- **Styling:** Custom CSS/CSS Custom Properties (`globals.css`) with Glassmorphism theming

---

## 📂 Project Structure

```text
InterviewMockApp/
├── src/
│   ├── app/
│   │   ├── api/                 # AI Endpoints (Analyze job, Responses, Evaluations)
│   │   ├── prep/                # Prep phase (View questions & get suggested answers)
│   │   ├── results/             # Results phase (Final scores and breakdowns)
│   │   ├── session/             # The active mock interview environment
│   │   ├── globals.css          # Global theming & styles
│   │   ├── layout.tsx           
│   │   └── page.tsx             # Home entry point (input job URL)
│   ├── components/              # UI Components (CameraRecorder, JobCard, QuestionCard, ScoreRing)
│   ├── context/                 # Global React Context layer for managing session phases & transcriptions
│   ├── hooks/                   # Custom Hooks (useCamera, useJobAnalysis)
│   └── utils/
│       └── prompts.ts           # Central repository of all tunable LLM Prompts
├── .env.local                   # Environment Variables
├── package.json                 
└── tsconfig.json                
```

---

## ⚙️ How to Set it Up

1. **Clone the repository**
   ```bash
   git clone <repository_link>
   cd InterviewMockApp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your OpenAI API Key:
   ```text
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Navigate to [http://localhost:3000](http://localhost:3000) inside your web browser.

> **Note on Browser Compatibility:** This application uses experimental browser features like `SpeechRecognition`. For the best experience, including live transcription and text-to-speech features, it is recommended to run this within a modern chromium-based browser (like Google Chrome or Edge). Ensure you grant both Camera and Microphone permissions when requested.

---

## 📖 How to Use the App

1. **Paste a Job URL:**
   Find a job posting on your favorite job board (LinkedIn, Greenhouse, generic career pages), copy the link, and paste it into the startup screen.
   *(Optional: You can paste text from your resume directly into the provided resume context zone if you want tailored STAR suggestions.)*

2. **Review your Questions:**
   The algorithm will interpret the posting and generate specific behavioral questions. You can review them on the `/prep` page. If you uploaded logic from your resume, you can request an instant **STAR breakdown answer template**.

3. **Start the Mock Session:**
   Ensure you are in a quiet room with strong internet. Click start!
   The virtual AI Recruiter will formally greet you before dictating the questions audibly. Answer naturally as the transcript forms. Hit submit once you finish your thought!

4. **Ask Questions Back:**
   Following the questions limit or right before the 30-minute timer forces a hard wrap-up, the recruiter will request input from you. Use this Q&A period just as you would organically engage regarding next steps or typical culture metrics.

5. **Examine your Results Phase:**
   When the session halts, review your categorical scoring breakdowns assessing Confidence, Structural integrity (STAR method utilization), and length consistency per standard bounds.
