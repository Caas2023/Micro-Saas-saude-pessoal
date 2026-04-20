import { GoogleGenerativeAI } from "@google/generative-ai";
import type { OCRResult } from "../types/exam";


const SYSTEM_PROMPT = `Você é um extrator de dados laboratoriais de altíssima precisão. 
Analise a imagem do exame médico e extraia cada marcador bioquímico. 
Retorne estritamente um JSON no formato { "results": [ { "marker_name": string, "value": number, "unit": string, "reference_min": number | null, "reference_max": number | null } ] }. 
Não faça inferências clínicas, apenas transcreva os números com exatidão. 
Retorne null se houver ilegibilidade.`;

export const visionService = {
  async extractExamData(imageFile: File, provider: string = 'gemini', apiKey?: string | null): Promise<OCRResult> {
    try {
      // 1. Initializing the specific provider
      let result;
      
      if (provider === 'gemini') {
        const currentApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
        const genAI = new GoogleGenerativeAI(currentApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      // Converter arquivo para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
      const base64String = await base64Promise;
      const base64Data = base64String.split(",")[1];

      result = await model.generateContent([
        SYSTEM_PROMPT,
        {
          inlineData: {
            data: base64Data,
            mimeType: imageFile.type,
          },
        },
      ]);

      } else {
        throw new Error(`Provedor ${provider} ainda não implementado.`);
      }

      const response = await result.response;
      const text = response.text();
      
      // Limpar o texto para garantir que seja apenas JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Falha ao extrair JSON da resposta da IA.");
      
      return JSON.parse(jsonMatch[0]) as OCRResult;
    } catch (error) {
      console.error("Erro no OCR Gemini:", error);
      throw error;
    }
  },
};
