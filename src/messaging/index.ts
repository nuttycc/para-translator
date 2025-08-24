import { defineExtensionMessaging } from '@webext-core/messaging';
import type { MessagingProtocol } from './protocol';

// Single source of truth for sendMessage/onMessage used across the extension
export const { sendMessage, onMessage } = defineExtensionMessaging<MessagingProtocol>({});

export type { MessagingProtocol } from './protocol';
export * from './protocol';


