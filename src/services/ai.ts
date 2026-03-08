import { GoogleGenAI } from "@google/genai";
import { Grant, Organization } from "../types";

// Initialize TinyFish API
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const model = "gemini-3-flash-preview";

export const generateGrants = async (query: string): Promise<Grant[]> => {
  if (!apiKey) {
    console.warn("TinyFish API Key is missing. Returning mock data.");
    return [];
  }

  try {
    const prompt = `Find 5 real, currently active grant opportunities specifically for a non-profit organization focused on: "${query}".
    
    STRICTLY FOLLOW THESE RULES:
    1. ONLY return grants that are directly relevant to "${query}".
    2. Do NOT return grants for unrelated topics (e.g., if the query is "women empowerment", do NOT return "climate change" grants unless they are specifically for women in climate).
    3. Use Google Search to verify they are active and relevant.
    
    Return a JSON array where each object has:
    - id: a unique string (e.g., "g1")
    - title: string (exact name of the grant)
    - amount: string (e.g., "$50,000" or "Varies")
    - deadline: string (specific date if available, or "Rolling")
    - portal: string (e.g., "Grants.gov", "NSF", foundation name)
    - matchScore: number (estimated 0-100 based on relevance to "${query}")
    - description: string (short summary)
    - url: string (direct link to the application page if found)
    - matchReason: string (one sentence explaining why this matches the query)
    - probability: number (estimated win probability between 50 and 70 based on competition and fit)
    - probabilityReason: string (one sentence explaining the probability score)
    - requirements: string[] (3-5 key eligibility requirements)
    - location: string (e.g., "Global", "USA", "California")
    - type: string (e.g., "Government", "Private Foundation", "Corporate")
    
    Ensure these are real programs.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text);
    
    // Post-process to ensure probability is between 50 and 70
    const processedData = Array.isArray(data) ? data.map((grant: any) => ({
      ...grant,
      probability: Math.min(70, Math.max(50, grant.probability || 60))
    })) : [];

    return processedData;
  } catch (error) {
    console.error("Error generating grants:", error);
    return [];
  }
};

export const generateApplicationContent = async (grant: Grant, org: Organization) => {
  if (!apiKey) {
    return {
      overview: "Mock Overview",
      mission: "Mock Mission",
      budget: "Mock Budget",
      impact: "Mock Impact",
    };
  }

  try {
    const prompt = `Draft a grant application for the following opportunity:
    Grant: ${grant.title}
    Amount: ${grant.amount}
    Description: ${grant.description || "N/A"}

    Organization: ${org.name}
    Mission: ${org.mission}
    Past Grants: ${org.pastGrants.join(", ")}

    Generate a JSON object with the following fields:
    - overview: A compelling organization overview tailored to this grant (max 100 words).
    - mission: A refined mission statement aligning with the grant's goals (max 50 words).
    - budget: A breakdown of how the ${grant.amount} will be used (max 50 words).
    - impact: 3-5 bullet points on expected outcomes.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating application content:", error);
    return {
      overview: "Error generating content.",
      mission: "Error generating content.",
      budget: "Error generating content.",
      impact: "Error generating content.",
    };
  }
};
