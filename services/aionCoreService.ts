
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AionDecision, AionState } from "../types";

export const getAionDecision = async (currentState: AionState): Promise<AionDecision | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const inputPayload = {
      estado_atual: {
        usuarios: currentState.businessMetrics.users,
        performance: currentState.businessMetrics.performanceScore
      }
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `TELEMETRIA: ${JSON.stringify(inputPayload)}`,
      config: {
        systemInstruction: `Você é o cérebro lógico Hydra. Responda apenas em JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problemas_detectados: { type: Type.ARRAY, items: { type: Type.STRING } },
            acoes_sugeridas: { type: Type.ARRAY, items: { type: Type.STRING } },
            prioridade: { type: Type.STRING },
            observacoes: { type: Type.STRING }
          },
          required: ["problemas_detectados", "acoes_sugeridas", "prioridade", "observacoes"]
        },
        safetySettings
      },
    });

    const text = response.text;
    if (!text) return null;

    return {
      ...JSON.parse(text),
      timestamp: new Date().toLocaleTimeString()
    };
  } catch (e) {
    return null;
  }
};
