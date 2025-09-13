
import { GoogleGenAI, Type } from "@google/genai";
import { Subject } from "../types";

// The AI client will be initialized lazily on the first API call
// to prevent the app from crashing on start-up if the API key is missing.
let ai: GoogleGenAI;

function getAiClient(): GoogleGenAI {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }
  return ai;
}

const periodSchema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING, description: "The name of the subject or activity." },
    teacher: { type: Type.STRING, description: "The name of the teacher or supervisor." },
    department: { type: Type.STRING, description: "The department associated with the period." },
    semester: { type: Type.STRING, description: "The semester this class is for." },
    isLab: { type: Type.BOOLEAN, description: "Set to true if this period is for a lab session, otherwise false." },
    capacity: { type: Type.INTEGER, description: "The maximum student capacity for the class." },
  },
  required: ['subject', 'teacher', 'department', 'semester', 'isLab'],
};

const daySchema = {
  type: Type.ARRAY,
  items: periodSchema,
  description: "An array of periods for the day. It is crucial this array contains exactly 8 items representing the 8 academic periods."
};

const timetableSchema = {
  type: Type.OBJECT,
  properties: {
    Monday: { ...daySchema, description: "Schedule for Monday. Must contain exactly 8 period objects." },
    Tuesday: { ...daySchema, description: "Schedule for Tuesday. Must contain exactly 8 period objects." },
    Wednesday: { ...daySchema, description: "Schedule for Wednesday. Must contain exactly 8 period objects." },
    Thursday: { ...daySchema, description: "Schedule for Thursday. Must contain exactly 8 period objects." },
    Friday: { ...daySchema, description: "Schedule for Friday. Must contain exactly 8 period objects." },
  },
  required: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
};


export const generateTimetable = async (subjects: Subject[]): Promise<string> => {

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
    Provide a valid JSON output that adheres to the schema. The JSON object must have keys for each day ('Monday' through 'Friday'). Each day's value must be an array of exactly 8 objects, representing the 8 periods. Each period object must include the subject, teacher, department, semester, and the 'isLab' flag.
    - Set \`isLab\` to \`true\` for any period that is part of a lab session.
    - Set \`isLab\` to \`false\` for all regular classes and placeholder activities (Library Hour, Study Hall, etc.).
  `;
  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: timetableSchema,
      },
    });

    if (!response.text) {
      throw new Error("Received an empty response from the AI service.");
    }

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the AI scheduling service. Please check your internet connection or API key configuration.");
  }
};
