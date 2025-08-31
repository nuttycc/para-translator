import { defineExtensionMessaging } from '@webext-core/messaging';
import type { ProtocolMap } from './protocol';

// Single source of truth for sendMessage/onMessage used across the extension
const messaging = defineExtensionMessaging<ProtocolMap>({});

// Bind methods to avoid unbound-method ESLint warnings
export const sendMessage = messaging.sendMessage.bind(messaging);
export const onMessage = messaging.onMessage.bind(messaging);
