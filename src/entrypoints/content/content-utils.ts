import { updateSharedStyleContent } from '@/entrypoints/content/ui-manager';
import { preferenceStorage } from '@/stores/preference';

import { logger } from './index';

import type { Preference } from '@/stores/preference';

export const isEditable = (element: Element | null): boolean => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const tagName = element.tagName.toUpperCase();
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || element.isContentEditable;
};

export let contentStore: Preference | null = null;

export const initContentStore = () => {
  preferenceStorage
    .getValue()
    .then((value) => {
      logger.debug`content store initialized with ${value}`;
      contentStore = value ?? null;
      return;
    })
    .catch(() => {
      return;
    });

  preferenceStorage.watch((value) => {
    logger.debug`content store updated with ${value}`;
    contentStore = value ?? null;
    updateSharedStyleContent();
    return;
  });
};
