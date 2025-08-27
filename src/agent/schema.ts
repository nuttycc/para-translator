// zod schema
// import * as z from "zod";

// export interface AIConfig {
//   id: string;
//   name: string;
//   provider: string;
//   model: string;
//   localModels: string[];
//   remoteModels?: string[];
//   apiKey: string;
//   baseUrl: string;
//   createdAt: number;
//   updatedAt: number;
// }

// export const AIConfigSchema = z.object({
//   id: z.string().default(new Date().getTime().toString()),
//   name: z.string(),
//   provider: z.string().default('openai'),
//   model: z.string().default('gpt-4o'),
//   localModels: z.array(z.string().optional()),
//   remoteModels: z.array(z.string().optional()).optional(),
//   apiKey: z.string().optional(),
//   baseUrl: z.string().optional(),
//   createdAt: z.number().default(new Date().getTime()),
//   updatedAt: z.number().default(new Date().getTime()),
// })

// export const AIConfigsSchema = z.record(z.string(), AIConfigSchema);
