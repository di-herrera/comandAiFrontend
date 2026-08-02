export interface AiPrompt {
  key: string;
  content: string;
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  updatedByUserId?: string | null;
}

export interface UpdateAiPromptRequest {
  content: string;
}
