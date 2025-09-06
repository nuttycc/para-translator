/**
 * Checks if an element is editable (input, textarea, or contenteditable).
 * Moved outside toggleTranslateIfEligible to avoid recreation on each call.
 *
 * @param element - The element to check
 * @returns True if the element is editable
 */
export const isEditable = (element: Element | null): boolean => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const tagName = element.tagName.toUpperCase();
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || element.isContentEditable;
};
