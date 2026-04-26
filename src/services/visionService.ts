import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ResponseSchema } from "@google/generative-ai";
import axios from "axios";
import type { OCRResult } from "../types/exam";

const SYSTEM_PROMPT = `Você é um extrator de dados laboratoriais de altíssima precisão. 
Analise a imagem do exame médico e extraia cada marcador bioquímico. 
Extraia o nome do marcador, o valor numérico, a unidade de medida e os limites de referência (mínimo e máximo).
Se um valor de referência for apenas "Menor que X", defina reference_min como 0 e reference_max como X.
Não faça inferências clínicas, apenas transcreva os números com exatidão.`;

const RESPONSE_SCHEMA: ResponseSchema = {
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
      // 1. Converter arquivo para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Falha ao ler arquivo de imagem."));
        reader.readAsDataURL(imageFile);
      });
      const base64String = await base64Promise;
      const base64Data = base64String.split(",")[1];
      const dataUri = base64String;

      let finalResult: OCRResult;

      if (provider === 'gemini') {
        const currentApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
        
        if (!currentApiKey || currentApiKey.length < 10) {
          throw new Error("Chave de API do Gemini não configurada ou inválida. Vá em Configurações.");
        }

        const genAI = new GoogleGenerativeAI(currentApiKey);
        
        // Usando 1.5-flash como padrão por ser mais estável e suportado globalmente
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
        const text = response.text();
        
        if (!text) throw new Error("A IA retornou uma resposta vazia.");
        finalResult = JSON.parse(text) as OCRResult;

      } else if (provider === 'pollinations') {
        // Pollinations usa interface compatível com OpenAI V1 para visão
        const response = await axios.post('https://gen.pollinations.ai/v1/chat/completions', {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { 
              role: 'user', 
              content: [
                { type: 'text', text: "Extraia os dados deste exame laboratoriais em formato JSON estrito conforme o esquema." },
                { type: 'image_url', image_url: { url: dataUri } }
              ] 
            }
          ],
          model: 'openai',
          jsonMode: true,
          seed: 42
        }, { timeout: 45000 }); // Timeout maior para visão

        const text = response.data;
        if (!text) throw new Error("A Pollinations retornou uma resposta vazia.");
        
        // Parsing robusto
        if (typeof text === 'object') {
          finalResult = text as OCRResult;
        } else {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          finalResult = JSON.parse(jsonMatch ? jsonMatch[0] : text) as OCRResult;
        }
      } else {
        throw new Error(`Provedor ${provider} ainda não implementado.`);
      }

      // Validação básica do resultado
      if (!finalResult.results || !Array.isArray(finalResult.results)) {
        throw new Error("Formato de resposta inválido: 'results' não encontrado.");
      }

      return finalResult;
    } catch (error: any) {
      // Extrair mensagem de erro amigável
      let errorMsg = error.message;
      if (error.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message;
      } else if (error.toString().includes("API_KEY_INVALID")) {
        errorMsg = "Chave de API Inválida. Verifique suas configurações.";
      }
      
      console.error(`Erro Crítico no OCR (${provider}):`, error);
      throw new Error(errorMsg);
    }
  },
};
