import { updateSharedStyleContent } from '@/entrypoints/content/card/ui/style-manager';
import { preferenceStorage } from '@/stores/preference';
import { createLogger } from '@/utils/logger';

import type { Preference } from '@/stores/preference';

const logger = createLogger('content-store');

export let contentStore: Preference | null = null;

/**
 * Initialize the content store by loading preferences and watching for changes.
 */
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
