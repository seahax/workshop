import { messageType } from '../constants/message-type.js';
import { ReleaseType } from '../constants/release-type.js';
import { type Message } from '../types/message.js';

export function getBump(messages: Message[]): 'major' | 'minor' | 'patch' {
  const bump = messages.reduce((result, message) => {
    return Math.max(messageType[message.type].bump, result) as ReleaseType;
  }, ReleaseType.patch);

  switch (bump) {
    case ReleaseType.major: {
      return 'major';
    }
    case ReleaseType.minor: {
      return 'minor';
    }
    case ReleaseType.patch: {
      return 'patch';
    }
  }
}
