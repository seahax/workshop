import { type messageType } from '../constants/message-type.js';

export interface Message {
  type: keyof typeof messageType;
  scope?: string;
  breaking: boolean;
  description: string;
}
