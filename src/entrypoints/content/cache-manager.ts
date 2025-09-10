import Defuddle from 'defuddle';

/**
 * Cached Defuddle instance to avoid re-parsing document on every translation.
 */
let cachedDefuddle: Defuddle | null = null;

let cachedDocument: { title: string; description: string } | null = null;

export const getDocumentMeta = () => {
  if (!cachedDocument) {
    if (!cachedDefuddle) {
      cachedDefuddle = new Defuddle(window.document);
    }
    const dedocument = cachedDefuddle.parse();
    cachedDocument = {
      title: dedocument.title,
      description: dedocument.description,
    };
  }
  return cachedDocument;
};
