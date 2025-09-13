
import { Subject, Timetable, TimetablePeriod } from "../types";
import { DAYS, TIME_SLOTS } from "../constants";

// The AI client and types will be loaded dynamically when the generate function is called.
let ai: any;
let genaiModule: any;

/**
 * A fallback function to generate a plausible, but not optimized, timetable
 * when the AI service is unavailable (e.g., due to a missing API key).
 * It uses the provided subjects to fill the schedule.
 */
const generateMockTimetable = (subjects: Subject[]): Timetable => {
  const timetable: Timetable = {};
  const periodsPerDay = TIME_SLOTS.filter(s => s.type === 'PERIOD').length;

  if (subjects.length === 0) {
    // Return an empty but valid timetable structure
    DAYS.forEach(day => {
      timetable[day] = new Array(periodsPerDay).fill(null);
    });
    return timetable;
  }

  // Create a pool of all possible periods to schedule from the subjects list
  const periodPool: TimetablePeriod[] = subjects.map(s => ({
    subject: s.name,
    teacher: s.teacher,
    department: s.department,
    semester: s.semester,
    isLab: s.isLab,
    capacity: s.capacity,
  }));

  let poolIndex = 0;
  DAYS.forEach(day => {
    const daySchedule: (TimetablePeriod | null)[] = new Array(periodsPerDay).fill(null);
    for (let i = 0; i < periodsPerDay; i++) {
      // Cycle through the pool to fill the schedule
      daySchedule[i] = periodPool[poolIndex % periodPool.length];
      poolIndex++;
    }
    timetable[day] = daySchedule;
  });

  return timetable;
};


async function getAiModules() {
  if (!genaiModule) {
    // @ts-ignore
    genaiModule = await import('https://aistudiocdn.com/@google/generative-ai');
  }
  return genaiModule;
}

async function getAiClient() {
  if (!ai) {
    const { GoogleGenAI } = await getAiModules();
    // This will throw an error if process.env.API_KEY is not set, which we'll catch.
    const apiKey = (process.env as any).API_KEY;
    if (!apiKey) {
      throw new Error("API key is missing.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

interface GenerationResult {
    timetableJson: string;
    isSimulated: boolean;
}

export const generateTimetable = async (subjects: Subject[]): Promise<GenerationResult> => {
  try {
    const { HarmCategory, HarmBlockThreshold } = await getAiModules();
    const aiClient = await getAiClient();

    const generationConfig = {
      temperature: 0.2,
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    };
    
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];
    
    const prompt = `
    You are an expert timetable scheduler for an entire college. Your task is to generate a complete and conflict-free weekly timetable from Monday to Friday based on a list of subjects.

    **Core College-Wide Constraints (MUST be followed in this order of priority):**
    1.  **Subject Frequency (ABSOLUTE RULE):** The \`periodsPerWeek\` for each subject is a strict, non-negotiable limit that CANNOT be exceeded. This is the most important rule.
        - For regular subjects (\`"isLab": false\`), this is the total number of single-period classes for the entire week.
        - For lab subjects (\`"isLab": true\`), this value represents the total number of **consecutive periods** for a single lab session during the week. For example, a lab with \`"periodsPerWeek": 3\` must be scheduled as one continuous 3-period block. Do not schedule more than one lab session per week for a given lab subject.
    2.  **Teacher Conflict:** A teacher cannot be assigned to two different classes at the same time, regardless of department or semester.
    3.  **Semester Group Conflict:** All students of a given semester (e.g., 'Computer Science - 1st Semester') are a single group. They cannot have two different classes scheduled at the same time.
    4.  **Lab Subject Rules (CRITICAL):**
        - Lab subjects (\`"isLab": true\`) MUST be scheduled as a single, continuous block of periods equal to their \`periodsPerWeek\` value.
        - **3-Period Labs:** A lab with \`"periodsPerWeek": 3\` must be scheduled in a continuous 3-period block. This block must be placed either entirely before lunch (e.g., 3rd, 4th, 5th periods) or entirely after lunch (e.g., 6th, 7th, 8th periods).
        - **2-Period Labs:** A lab with \`"periodsPerWeek": 2\` must be scheduled in a continuous 2-period block. This block should ideally be scheduled after the first break (e.g., 3rd-4th) or after lunch (e.g., 6th-7th).
        - A multi-period lab is represented as multiple identical, consecutive entries in the output JSON for that day. A 3-period lab will have 3 identical entries in a row.
        - Labs cannot be scheduled across the lunch break.
    5.  **Class Capacity:** Each subject may have an optional \`capacity\` field. Include this in the final timetable output for the corresponding class.

    **Scheduling Quality and General Rules:**
    1.  **Compulsory 8-Period Day:** The timetable structure is fixed with 8 academic periods per day. Each semester group MUST have a scheduled activity for all 8 periods every day. The final timetable must be completely filled.
    2.  **Handling Unscheduled Time:** After all subjects for a semester group have been scheduled according to their \`periodsPerWeek\` limit, you MUST fill any remaining empty slots for that group with one of the following designated activities: "Library Hour", "Study Hall", "Tutorial Session", or "Student Activity".
        - When creating an entry for these activities, the \`subject\` field should be the activity name (e.g., "Study Hall").
        - The \`teacher\` field can be a generic role like "Supervisor" or "Librarian".
        - The \`department\` and \`semester\` fields MUST match the semester group for which you are filling the slot.
        - This ensures that every semester has a full 8-period schedule each day, with no empty or free periods.
    3.  **Balanced Distribution:** Distribute subjects for each semester group as evenly as possible throughout the week. Avoid clustering all periods for a single subject on one or two days (unless it's a lab).
    4.  **Daily Variety:** A semester group should not have the same subject multiple times in one day, unless it is a required multi-period lab session.
    5.  **Single Lab Per Day (CRITICAL RULE):** A semester group **MUST NOT** be scheduled for more than one lab session on any single day. For example, do not schedule a Physics Lab and a Chemistry Lab for the same semester group on the same day. This is a strict constraint for student workload.
    6.  **Avoid Monotony:** Avoid scheduling the same subject in the same time slot for the same semester group on consecutive days. Create a dynamic and varied weekly schedule.

    **Input Subjects List:**
    ${JSON.stringify(subjects, null, 2)}

    **Output Format:**
    Provide a valid JSON output. The JSON object must have keys for each day ('Monday' through 'Friday'). Each day's value must be an array of exactly 8 objects, representing the 8 periods. Each period object must include the subject, teacher, department, semester, and the 'isLab' flag.
    - Set \`isLab\` to \`true\` for any period that is part of a lab session.
    - Set \`isLab\` to \`false\` for all regular classes and placeholder activities (Library Hour, Study Hall, etc.).
    - Your response must be only the raw JSON, without any surrounding text, explanations, or markdown formatting.
    - The JSON should look like: \`{"Monday": [...], "Tuesday": [...], ...}\`
  `;

    const result = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: generationConfig,
        safetySettings,
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error("Received an empty response from the AI service.");
    }
    
    return {
        timetableJson: responseText,
        isSimulated: false,
    };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.toLowerCase().includes('api key')) {
        console.warn("API key not found or invalid. Falling back to mock timetable generator.");
        // Simulate thinking time to match the feel of the real API call
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        const mockTimetable = generateMockTimetable(subjects);
        return {
            timetableJson: JSON.stringify(mockTimetable),
            isSimulated: true,
        };
    }
    // For other errors, re-throw to be handled by the UI.
    if (error instanceof Error) {
        throw new Error(`An error occurred during timetable generation: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI scheduling service.");
  }
};