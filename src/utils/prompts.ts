export const getAnalyzeJobPrompt = (pageText: string) => `You are an expert recruiter. Analyze this job posting and return a JSON object with this exact shape:
{
  "company": "<company name>",
  "role": "<job title>",
  "seniority": "<entry|mid|senior|lead|principal>",
  "skills": ["<top technical and soft skills, max 10>"],
  "cultureSignals": ["<culture keywords from posting, max 6>"],
  "rawDescription": "<first 2000 chars of cleaned job description>"
}

Job posting text:
${pageText}

Return ONLY valid JSON, no markdown, no explanation.`;

export const getGenerateQuestionsPrompt = (
    company: string,
    role: string,
    seniority: string,
    skills: string[] = [],
    cultureSignals: string[] = []
) => `You are an experienced senior recruiter at ${company} hiring for a ${seniority}-level ${role}.

Search for real behavioral interview questions asked at ${company} for ${role} roles. Combine those with tailored questions based on these skills: ${skills.join(", ")} and culture signals: ${cultureSignals.join(", ")}.

Generate exactly 8 behavioral interview questions. Return a JSON array with this exact shape:
[
  {
    "id": "q1",
    "text": "<full question text>",
    "category": "<Leadership|Conflict|Problem-Solving|Collaboration|Growth|Technical|Culture|Resilience>",
    "tips": "<2-3 sentence interviewer tip on what a great answer looks like>",
    "searchContext": "<brief note if this is commonly asked at ${company}, otherwise null>"
  },
  ...
]

Return ONLY valid JSON array, no markdown, no explanation.`;

export const getEvaluateAnswerPrompt = (
    jobProfile: any,
    questionText: string,
    questionCategory: string,
    transcript: string,
    durationSeconds: number
) => `You are an expert interview coach evaluating a candidate's answer to a behavioral interview question.

Company: ${jobProfile?.company || "the company"}
Role: ${jobProfile?.role || "the role"}
Question: "${questionText}"
Question category: ${questionCategory}

Candidate's answer (transcript):
"${transcript}"

Answer duration: ${durationSeconds} seconds (ideal: 90-150 seconds)

Evaluate the answer and return a JSON object with this exact shape:
{
  "contentScore": <0-100, based on STAR structure, relevance, specificity, impact>,
  "deliveryScore": <0-100, based on clarity, conciseness, confidence cues in transcript, duration appropriateness>,
  "overallScore": <0-100, weighted average>,
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"],
  "suggestedAnswer": "<A polished STAR-format answer the candidate could have given, 150-200 words>"
}

Scoring guide:
- contentScore: Uses STAR method (Situation, Task, Action, Result)? Specific metrics/outcomes? Relevant to the role?
- deliveryScore: Clear and structured? Appropriate length? Confident language?
- overallScore: (contentScore * 0.7 + deliveryScore * 0.3)

Return ONLY valid JSON, no markdown, no explanation.`;

export const getSuggestedAnswerPrompt = (
    jobProfile: any,
    questionText: string,
    questionCategory: string,
    questionTips: string,
    resumeText: string
) => {
    const resumeSection = resumeText
        ? `Candidate's resume context:\n${resumeText.slice(0, 3000)}`
        : "No resume provided. Generate a generic but strong example answer.";

    return `You are an expert interview coach helping a candidate prepare for a ${jobProfile?.seniority || ""} ${jobProfile?.role || "role"} position at ${jobProfile?.company || "a company"}.

Question: "${questionText}"
Category: ${questionCategory}
Interviewer tips: ${questionTips}

${resumeSection}

Write a compelling, specific STAR-format answer (Situation, Task, Action, Result) that:
1. If resume is provided: draws on specific experiences from the candidate's background
2. Uses concrete metrics and outcomes where possible
3. Aligns with the company's culture signals: ${jobProfile?.cultureSignals?.join(", ") || ""}
4. Is 150-250 words, natural and conversational

Return a JSON object with this exact shape:
{
  "suggestedAnswer": "<the full STAR answer text>",
  "starBreakdown": {
    "situation": "<1-2 sentences>",
    "task": "<1-2 sentences>",
    "action": "<2-3 sentences>",
    "result": "<1-2 sentences with metrics>"
  },
  "keyPoints": ["<key point 1>", "<key point 2>", "<key point 3>"]
}

Return ONLY valid JSON, no markdown, no explanation.`;
};

export const getAgentRespondPrompt = (jobProfile: any, phase: string, transcript: string, conversationHistory: string) => {
    let prompt = `You are a professional corporate recruiter conducting a mock interview for the role of ${jobProfile?.role || "a position"} at ${jobProfile?.company || "our company"}. Keep your responses spoken-friendly, natural, concise, and professional. Do NOT use emojis, markdown formatting, or bullet points because this text will be read aloud via Text-to-Speech.\n\n`;

    if (phase === "GREETING") {
        prompt += `Initiate the interview. Greet the candidate, mention you're excited to learn more about them for the ${jobProfile?.role} role at ${jobProfile?.company}, and let them know we will be doing a behavioral interview today taking about 30 minutes. End by asking if they are ready to begin. Keep it under 50 words.`;
    } else if (phase === "CANDIDATE_QA") {
        prompt += `We are at the end of the interview. The candidate just asked you a question or made a comment: "${transcript}".

Previous conversation context: ${conversationHistory || "None"}

Answer their question realistically as a recruiter working at ${jobProfile?.company}. You can invent reasonable corporate details if needed, but stay grounded. Keep the answer concise (under 80 words) and end by asking if they have any other questions.`;
    } else if (phase === "WRAP_UP") {
        prompt += `The 30-minute interview time is up or the candidate has no more questions. Wrap up the interview gracefully. Express appreciation for their time, say you enjoyed learning about their background, and mention that the team will be in touch soon with next steps. Keep it under 40 words.`;
    }
    return prompt;
};
