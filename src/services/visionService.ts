import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import axios from "axios";
import type { OCRResult } from "../types/exam";

const SYSTEM_PROMPT = `Você é um extrator de dados laboratoriais de altíssima precisão. 
Analise a imagem do exame médico e extraia cada marcador bioquímico. 
Extraia o nome do marcador, o valor numérico, a unidade de medida e os limites de referência (mínimo e máximo).
Se um valor de referência for apenas "Menor que X", defina reference_min como 0 e reference_max como X.
Não faça inferências clínicas, apenas transcreva os números com exatidão.`;

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    results: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          marker_name: { type: SchemaType.STRING },
          value: { type: SchemaType.NUMBER },
          unit: { type: SchemaType.STRING },
          reference_min: { type: SchemaType.NUMBER, nullable: true },
          reference_max: { type: SchemaType.NUMBER, nullable: true },
        },
        required: ["marker_name", "value", "unit"],
      },
    },
  },
  required: ["results"],
};

export const visionService = {
  async extractExamData(imageFile: File, provider: string = 'gemini', apiKey?: string | null): Promise<OCRResult> {
    try {
      // 1. Converter arquivo para base64 (comum para ambos os provedores)
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
      const base64String = await base64Promise;
      const base64Data = base64String.split(",")[1];
      const dataUri = base64String;

      let finalResult: OCRResult;

      if (provider === 'gemini') {
        const currentApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
        const genAI = new GoogleGenerativeAI(currentApiKey);
        
        // Gemini 2.0 Flash é mais rápido e preciso para OCR estruturado
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          }
        });

        const result = await model.generateContent([
          SYSTEM_PROMPT,
          {
            inlineData: {
              data: base64Data,
              mimeType: imageFile.type,
            },
          },
        ]);

        const response = await result.response;
        finalResult = JSON.parse(response.text()) as OCRResult;

      } else if (provider === 'pollinations') {
        // Pollinations usa interface compatível com OpenAI
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { 
              role: 'user', 
              content: [
                { type: 'text', text: "Extraia os dados deste exame laboratoriais em formato JSON estrito." },
                { type: 'image_url', image_url: { url: dataUri } }
              ] 
            }
          ],
          model: 'openai', // Pollinations mapeia 'openai' para GPT-4o-mini/GPT-4o
          jsonMode: true,
          seed: 42 // Para maior consistência
        });

        const text = response.data;
        // Limpeza básica se não vier JSON puro (embora jsonMode: true ajude)
        const jsonMatch = typeof text === 'string' ? text.match(/\{[\s\S]*\}/) : null;
        finalResult = jsonMatch ? JSON.parse(jsonMatch[0]) : (typeof text === 'object' ? text : JSON.parse(text));
      } else {
        throw new Error(`Provedor ${provider} ainda não implementado.`);
      }

      return finalResult;
    } catch (error) {
      console.error(`Erro no OCR (${provider}):`, error);
      throw error;
    }
  },
};
