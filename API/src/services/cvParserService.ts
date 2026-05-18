import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const CV_PARSE_PROMPT = `You are an expert HR recruiter and CV parser. Extract all available information from the following CV text and return it as a valid JSON object.

Return ONLY valid JSON with these exact fields (use null for fields you're not sure about, never guess):
{
  "firstName": string | null,
  "lastName": string | null,
  "email": string | null,
  "phone": string | null,
  "alternatePhone": string | null,
  "gender": "MALE" | "FEMALE" | "OTHER" | null,
  "dateOfBirth": "YYYY-MM-DD" | null,
  "currentLocation": string | null,
  "preferredLocations": string[] | null,
  "nationality": string | null,
  "religion": string | null,
  "caste": string | null,
  "languages": string[] | null,
  "currentDesignation": string | null,
  "currentCompany": string | null,
  "totalExperience": number | null,
  "currentCTC": number | null,
  "expectedCTC": number | null,
  "noticePeriod": number | null,
  "currentlyEmployed": boolean | null,
  "highestQualification": string | null,
  "specialization": string | null,
  "university": string | null,
  "passingYear": number | null,
  "educationDetails": [{"degree": string, "institution": string, "year": number, "percentage": string}] | null,
  "skills": string[] | null,
  "certifications": string[] | null,
  "technologyStack": string[] | null,
  "workHistory": [{"company": string, "designation": string, "startDate": string, "endDate": string, "isCurrent": boolean, "location": string}] | null,
  "summary": string | null
}

CV Text:
`;

export async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === '.doc' || ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

export async function parseCVWithAI(filePath: string, originalName: string): Promise<{
  data: Record<string, any>;
  rawText: string;
  confidence: number;
}> {
  let rawText = '';

  try {
    rawText = await extractTextFromFile(filePath);

    if (!rawText || rawText.trim().length < 50) {
      throw new Error('Could not extract sufficient text from the CV');
    }

    const truncatedText = rawText.slice(0, 8000);

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a precise CV parser. Always return valid JSON only. No markdown, no explanation.',
        },
        {
          role: 'user',
          content: CV_PARSE_PROMPT + truncatedText,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');

    const parsed = JSON.parse(content);

    const filledFields = Object.values(parsed).filter((v) => v !== null && v !== undefined).length;
    const totalFields = Object.keys(parsed).length;
    const confidence = Math.round((filledFields / totalFields) * 100);

    return { data: parsed, rawText, confidence };
  } catch (error: any) {
    logger.error(`CV parsing failed for ${originalName}: ${error.message}`);
    throw new Error(`Failed to parse CV "${originalName}": ${error.message}`);
  }
}

export function buildSearchVector(candidate: Record<string, any>): string {
  const parts = [
    candidate.firstName,
    candidate.lastName,
    candidate.email,
    candidate.phone,
    candidate.currentDesignation,
    candidate.currentCompany,
    candidate.currentLocation,
    candidate.highestQualification,
    ...(candidate.skills || []),
    ...(candidate.technologyStack || []),
    ...(candidate.languages || []),
    ...(candidate.certifications || []),
  ]
    .filter(Boolean)
    .join(' ');

  return parts.toLowerCase();
}
