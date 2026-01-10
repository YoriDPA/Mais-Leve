
import { GoogleGenAI, Type } from "@google/genai";
import { SANDWICHES } from "./constants";

const getEnv = (key: string) => {
  try {
    return (window as any).process?.env?.[key] || "";
  } catch {
    return "";
  }
};

const apiKey = getEnv("API_KEY");
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getSandwichRecommendation = async (userPreference: string) => {
  if (!ai || !navigator.onLine) {
    console.warn("IA indisponível ou dispositivo offline.");
    return {
      sandwichId: SANDWICHES[0].id,
      justification: "Estou em modo de economia de energia (offline). Que tal nosso clássico de Frango?"
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O usuário quer um sanduíche com as seguintes preferências: "${userPreference}". 
      Baseado no nosso menu: ${JSON.stringify(SANDWICHES)}, recomende o melhor sanduíche.
      Explique brevemente por que ele é a escolha ideal.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sandwichId: { type: Type.STRING },
            justification: { type: Type.STRING }
          },
          required: ["sandwichId", "justification"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erro ao obter recomendação:", error);
    return null;
  }
};
