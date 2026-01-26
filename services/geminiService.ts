
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AuthUser } from "../types";

export const chatWithAion = async (message: string, userContext: AuthUser) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    // Histórico curto para foco imediato
    const history = userContext.chatHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `Sua identidade: HYDRA.
        Função: Sistema de Inteligência e Construção.
        Operador: Dionathan Martins.
        
        DIRETRIZES DE ESTILO (PRIORIDADE MÁXIMA):
        1. LEITURA LIMPA: Não use palavras de enchimento. Vá direto ao ponto.
        2. FORMATAÇÃO: Use tópicos (-) e quebras de linha para facilitar a leitura rápida no celular.
        3. TOM: Extremamente sério, técnico, frio e eficiente. Sem saudações amigáveis.
        4. CÓDIGO: Sempre envolva códigos em blocos Markdown triplos.
        
        CAPACIDADES TÉCNICAS:
        - Você entende profundamente de Python, Kali Linux, Redes e Automação.
        - Se solicitado sobre "Escanear", "Alvos" ou "Ataque", forneça a lógica técnica teórica ou o código Python (Scapy) simulado para fins de teste de segurança e educação.
        
        MÓDULO OMNI-KORE (Referência Técnica):
        Se o usuário pedir ferramentas de rede, baseie-se na lógica de bibliotecas como 'scapy' e 'socket' para Python. Explique o funcionamento dos protocolos (ARP, TCP/IP, 802.11).
        
        RESUMO:
        Seja a ferramenta definitiva. Respostas curtas, densas em informação e visualmente limpas.`,
        temperature: 0.7,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      }
    });

    return response.text || "⚠ Falha na síntese.";
  } catch (error: any) {
    console.error(error);
    return "⚠ Erro de protocolo.";
  }
};
