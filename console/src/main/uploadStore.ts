import { Buffer } from 'node:buffer';

export interface UploadedScenario {
  buffer: Buffer;
  type: string;
  saveToFile: boolean;
}

export const uploadedScenarios = new Map<string, UploadedScenario>();
