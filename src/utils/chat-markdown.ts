import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

/**
 * Render assistant Markdown to sanitised HTML using ermrestjs, the same
 * renderer Chaise uses in footer/navbar/display-value. Returns null when the
 * renderer is unavailable (e.g. before ConfigService is initialised).
 */
export function renderChatMarkdown(source: string): string | null {
  if (typeof source !== 'string') return null;
  try {
    return ConfigService.ERMrest.renderMarkdown(source, false);
  } catch {
    return null;
  }
}
