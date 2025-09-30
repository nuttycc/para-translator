/**
 * Checks if an element is editable (input, textarea, or contentEditable).
 */
export const isEditable = (element: Element | null): boolean => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const tagName = element.tagName.toUpperCase();
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || element.isContentEditable;
};
