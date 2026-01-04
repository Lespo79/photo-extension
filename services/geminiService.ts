
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export async function analyzeImageWithAI(imageBase64: string, targetFormat: string) {
  if (!API_KEY) {
    return "L'IA est prête à vous aider dès que la clé API sera configurée.";
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64.split(',')[1],
              },
            },
            {
              text: `Analyse cette image PNG et donne-moi des conseils spécifiques pour la convertir au format .${targetFormat}. 
              Quels sont les avantages de ce format pour ce type de contenu ? 
              Réponds brièvement en français avec 3 points clés.`
            },
          ],
        },
      ],
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Désolé, une erreur s'est produite lors de l'analyse par l'IA.";
  }
}
