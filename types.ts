
export enum EntryType {
  REMINDER = 'REMINDER',
  FORM = 'FORM',
  LIST = 'LIST',
  JOURNAL = 'JOURNAL',
  IDEA = 'IDEA'
}

export type ViewState = 'SIGN_IN' | 'DASHBOARD' | 'TOOL_VIEW';

export interface IdeaContent {
  transcript: string;
  summary: string;
  coreIdea: string;
  tags: string[];
}

export interface ListContent {
  title: string;
  items: { id: string; text: string; completed: boolean }[];
}

export interface FormField {
  label: string;
  type: 'text' | 'email' | 'number' | 'rating' | 'longtext';
}

export interface FormContent {
  title: string;
  fields: FormField[];
  responses: any[];
}

export interface ReminderContent {
  text: string;
  triggerTime: string | null;
  notificationStatus: 'pending' | 'sent' | 'failed';
}

export interface JournalContent {
  transcript: string;
  summary: string;
  emotionalTone: string;
}

export interface Entry {
  id: string;
  type: EntryType;
  timestamp: number;
  content: IdeaContent | ListContent | FormContent | ReminderContent | JournalContent;
}

export interface ProcessingResult {
  type: EntryType;
  structuredData: any;
  clarificationPrompt?: string;
}
