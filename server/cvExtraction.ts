import * as mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { invokeLLM } from "./_core/llm";

export type ResumeExtraction = {
  title: string;
  experienceYears: number;
  skills: string[];
};

export async function extractResumeText(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractCandidateInformation(resumeText: string): Promise<ResumeExtraction> {
  const safeText = resumeText.trim().slice(0, 14000);
  if (!safeText) {
    throw new Error("لا يحتوي ملف السيرة الذاتية على نص قابل للاستخراج.");
  }

  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: "استخرج بيانات السيرة الذاتية بدقة. لا تخمّن. عند غياب المعلومة، استخدم المسمى: غير محدد، عدد سنوات الخبرة: 0، والمهارات: قائمة فارغة.",
      },
      {
        role: "user",
        content: `استخرج المسمى الوظيفي الأحدث أو الأساسي، وإجمالي سنوات الخبرة، وأبرز المهارات المهنية من النص التالي:\n\n${safeText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            experienceYears: { type: "integer" },
            skills: { type: "array", items: { type: "string" } },
          },
          required: ["title", "experienceYears", "skills"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("لم تُعد خدمة التحليل نتيجة صالحة.");
  }

  const parsed = JSON.parse(content) as ResumeExtraction;
  return {
    title: parsed.title.trim().slice(0, 180) || "غير محدد",
    experienceYears: Math.max(0, Math.min(60, Number(parsed.experienceYears) || 0)),
    skills: Array.isArray(parsed.skills)
      ? parsed.skills.map(skill => String(skill).trim()).filter(Boolean).slice(0, 20)
      : [],
  };
}
