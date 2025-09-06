import Defuddle from 'defuddle';

/**
 * Cached Defuddle instance to avoid re-parsing document on every translation.
 */
let cachedDefuddle: Defuddle | null = null;

/**
 * Cached document metadata containing title and description.
 */
let cachedDocument: { title: string; description: string } | null = null;

/**
 * Gets cached document metadata, creating it if not exists.
 *
 * @returns Document metadata containing title and description
 */
export const getDocumentMeta = (): { title: string; description: string } => {
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
  return cachedDocument!;
};
