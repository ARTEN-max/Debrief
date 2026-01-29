import OpenAI from 'openai';
import { z } from 'zod';
import type { DebriefSection } from '@komuchi/shared';
import { getEnv } from '../env.js';

// ============================================
// Types
// ============================================

export type DebriefProvider = 'openai' | 'mock';

export interface DebriefResult {
  markdown: string;
  sections: DebriefSection[];
}

// Get the debrief provider from env
function getDebriefProvider(): DebriefProvider {
  const provider = process.env.DEBRIEF_PROVIDER || 'openai';
  if (provider !== 'openai' && provider !== 'mock') {
    console.warn(`Unknown DEBRIEF_PROVIDER "${provider}", defaulting to openai`);
    return 'openai';
  }
  return provider;
}

// ============================================
// Zod Schema for Structured Output
// ============================================

const debriefSectionSchema = z.object({
  title: z.string().describe('Section title'),
  content: z.string().describe('Section content in markdown format'),
  order: z.number().describe('Display order of this section'),
});

const debriefOutputSchema = z.object({
  title: z.string().describe('A concise title for the debrief'),
  summary: z.string().describe('A 2-3 sentence executive summary'),
  sections: z.array(debriefSectionSchema).describe('Detailed sections of the debrief'),
  actionItems: z.array(z.object({
    description: z.string(),
    // OpenAI json_schema strict mode requires all keys to be present in `required`,
    // so we model assignee as nullable (the model will output null when unknown).
    assignee: z.string().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high']),
  })).describe('Action items extracted from the transcript'),
  // In strict json_schema mode we include these keys as nullable so they can still be "optional" semantically.
  participants: z.array(z.string()).nullable().optional().describe('List of participants if identifiable'),
  keyDecisions: z.array(z.string()).nullable().optional().describe('Key decisions made'),
});

type DebriefOutput = z.infer<typeof debriefOutputSchema>;

// ============================================
// System Prompts by Mode
// ============================================

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are an expert meeting analyst. Analyze the transcript and create a comprehensive debrief.
Focus on:
- Key discussion points
- Decisions made
- Action items with owners if mentioned
- Follow-up items
- Any blockers or concerns raised`,

  meeting: `You are an expert meeting analyst. Analyze this meeting transcript and create a structured debrief.
Focus on:
- Meeting objectives and whether they were met
- Key discussion topics
- Decisions made
- Action items with clear owners and deadlines if mentioned
- Next steps
- Parking lot items for future discussion`,

  sales: `You are an expert sales analyst. Analyze this sales call transcript and create a detailed debrief.
Focus on:
- Prospect/customer pain points mentioned
- Objections raised and how they were addressed
- Interest signals and buying indicators
- Competition mentioned
- Next steps and commitments
- Deal stage assessment
- Action items for follow-up`,

  interview: `You are an expert interview analyst. Analyze this interview transcript and create a comprehensive debrief.
Focus on:
- Candidate's key strengths demonstrated
- Areas of concern or gaps
- Technical competencies assessed
- Cultural fit indicators
- Key questions asked and quality of responses
- Recommendation (if enough information)
- Follow-up questions for next round`,
};

// ============================================
// OpenAI Client
// ============================================

function getOpenAIClient(): OpenAI {
  const env = getEnv();
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

// ============================================
// Main Debrief Generation
// ============================================

/**
 * Generate a mock debrief for local development/testing
 */
async function generateMockDebrief(
  transcriptText: string,
  mode: string,
  title: string
): Promise<DebriefResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('✅ Using mock debrief provider');

  const sections: DebriefSection[] = [
    {
      title: 'Key Discussion Points',
      content: `This is a mock debrief for "${title}".\n\nThe transcript contained ${transcriptText.length} characters discussing various topics related to ${mode}.`,
      order: 1,
    },
    {
      title: 'Decisions Made',
      content: '- Decision 1: Proceed with the current approach\n- Decision 2: Schedule follow-up meeting\n- Decision 3: Assign ownership to team leads',
      order: 2,
    },
    {
      title: 'Next Steps',
      content: '1. Review the discussed items\n2. Prepare action plan\n3. Share summary with stakeholders',
      order: 3,
    },
  ];

  const markdown = `# Debrief: ${title}

## Summary
This is a **mock debrief** generated for local development. In production, this would be generated by OpenAI GPT-4o analyzing the transcript.

## Mode
This recording was analyzed as a **${mode}** type.

## Key Discussion Points
${sections[0].content}

## Decisions Made
${sections[1].content}

## Next Steps
${sections[2].content}

## Action Items
- 🔴 Review transcript and verify accuracy (High Priority)
- 🟡 Share debrief with team members (Medium Priority)
- 🟢 Archive recording for future reference (Low Priority)

---
*Note: This is mock data. Set \`DEBRIEF_PROVIDER=openai\` for real AI-generated debriefs.*
`;

  return {
    markdown,
    sections,
  };
}

/**
 * Generate a debrief from a transcript using OpenAI
 */
export async function generateDebrief(
  transcriptText: string,
  mode: string,
  title: string
): Promise<DebriefResult> {
  const provider = getDebriefProvider();

  if (provider === 'mock') {
    return generateMockDebrief(transcriptText, mode, title);
  }

  const client = getOpenAIClient();
  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Please analyze the following transcript titled "${title}" and generate a structured debrief:\n\n${transcriptText}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'debrief_output',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'A concise title for the debrief' },
            summary: { type: 'string', description: 'A 2-3 sentence executive summary' },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  order: { type: 'number' },
                },
                required: ['title', 'content', 'order'],
                additionalProperties: false,
              },
            },
            actionItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  // In strict json_schema mode, OpenAI requires `required` to include
                  // every key in `properties`, so we make assignee required but nullable.
                  assignee: { type: ['string', 'null'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                },
                required: ['description', 'assignee', 'priority'],
                additionalProperties: false,
              },
            },
            participants: {
              type: ['array', 'null'],
              items: { type: 'string' },
            },
            keyDecisions: {
              type: ['array', 'null'],
              items: { type: 'string' },
            },
          },
          // OpenAI json_schema strict requires `required` to include every key in `properties`.
          required: ['title', 'summary', 'sections', 'actionItems', 'participants', 'keyDecisions'],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.3, // Lower temperature for more consistent output
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  // Parse the structured output
  const parsed: DebriefOutput = JSON.parse(content);

  // Validate with Zod
  const validated = debriefOutputSchema.parse(parsed);

  // Convert to markdown
  const markdown = generateMarkdown(validated);

  // Extract sections for DB storage
  const sections: DebriefSection[] = validated.sections.map((s, idx) => ({
    title: s.title,
    content: s.content,
    order: s.order ?? idx,
  }));

  return {
    markdown,
    sections,
  };
}

/**
 * Convert structured output to markdown
 */
function generateMarkdown(output: DebriefOutput): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${output.title}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push(output.summary);
  lines.push('');

  // Participants (if any)
  if (output.participants && output.participants.length > 0) {
    lines.push('## Participants');
    output.participants.forEach((p) => lines.push(`- ${p}`));
    lines.push('');
  }

  // Main sections
  for (const section of output.sections.sort((a, b) => a.order - b.order)) {
    lines.push(`## ${section.title}`);
    lines.push(section.content);
    lines.push('');
  }

  // Key Decisions (if any)
  if (output.keyDecisions && output.keyDecisions.length > 0) {
    lines.push('## Key Decisions');
    output.keyDecisions.forEach((d) => lines.push(`- ${d}`));
    lines.push('');
  }

  // Action Items
  if (output.actionItems.length > 0) {
    lines.push('## Action Items');
    output.actionItems.forEach((item) => {
      const priority = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      const assignee = item.assignee ? ` (${item.assignee})` : '';
      lines.push(`- ${priority} ${item.description}${assignee}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
