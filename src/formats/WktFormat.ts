import { ParsedData, TextFileFormat } from './FileFormat.ts';
import { wktToGeoJSON } from 'betterknown';

/**
 * Load a WKT (Well Known Text) string.
 */
export class WktFormat extends TextFileFormat {
  readonly extensions = ['wkt'];
  readonly label = 'WKT';

  protected parseText(text: string): ParsedData | undefined {
    return wktToGeoJSON(text) ?? undefined;
  }
}
