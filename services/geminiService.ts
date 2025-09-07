
import { GoogleGenAI, Type } from "@google/genai";
import { Subject } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const periodSchema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING, description: "The name of the subject." },
    teacher: { type: Type.STRING, description: "The name of the teacher for the subject." },
    department: { type: Type.STRING, description: "The department offering the subject." },
    semester: { type: Type.STRING, description: "The semester this class is for." },
    capacity: { type: Type.INTEGER, description: "The maximum student capacity for the class." },
  },
  required: ['subject', 'teacher', 'department', 'semester'],
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
    You are an expert timetable scheduler for an entire college. Your task is to generate a complete and conflict-free weekly timetable from Monday to Friday based on a list of subjects, their assigned teachers, departments, and semesters.

    **Core College-Wide Constraints:**
    1.  **Teacher Conflict:** A teacher cannot be assigned to two different classes at the same time, regardless of department or semester.
    2.  **Semester Group Conflict:** All students of a given semester (e.g., 'Computer Science - 1st Semester') are a single group. They cannot have two different classes scheduled at the same time. A specific semester can only have one class scheduled in any given period.
    3.  **Lab Subject Rules:**
        - Subjects marked with \`"isLab": true\` are lab sessions.
        - Each lab session must be scheduled for **two consecutive periods**.
        - Valid consecutive slots are: (1st and 2nd), (3rd and 4th), (4th and 5th), (6th and 7th), as they are not interrupted by breaks/lunch.
        - Each lab subject should be scheduled only **once per week**.
        - A two-period lab is represented as two identical, consecutive entries in the output JSON for that day.
    4.  **Class Capacity:** Each subject may have an optional \`capacity\` field. You should include this capacity in the final timetable output for the corresponding class. While you do not need to perform complex room assignment, your schedule should remain logical.

    **General Rules:**
    1.  The timetable structure is fixed. You must fill these 8 academic periods:
        - 1st: 9:00-9:45, 2nd: 9:45-10:35, 3rd: 10:50-11:35, 4th: 11:35-12:20, 5th: 12:20-1:05, 6th: 2:00-2:45, 7th: 2:45-3:30, 8th: 3:45-4:30.
    2.  **Balanced Distribution:** Distribute subjects for each semester group as evenly as possible throughout the week.
    3.  **Fill All Periods:** Every one of the 8 periods for every day must be filled with a subject for some semester group. You must repeat subjects to fill the entire schedule for all 5 days, while adhering to all constraints. It is vital that the timetable is fully populated.

    **Input Subjects List:**
    ${JSON.stringify(subjects, null, 2)}

    **Output Format:**
    Provide a valid JSON output that adheres to the schema. The JSON object must have keys for each day ('Monday' through 'Friday'). Each day's value must be an array of exactly 8 objects, representing the 8 periods. Each period object must include the subject, teacher, department, and semester. If the original subject has a capacity, include it in the output object as well. Do not include entries for breaks or lunch.
  `;
  try {
    const response = await ai.models.generateContent({
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