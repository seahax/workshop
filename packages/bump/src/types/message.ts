import { type messageType } from '../constants/message-type.js';

export interface Message {
  type: keyof typeof messageType;
  scope: string | undefined;
  description: string;
  isBreaking: boolean;
}
