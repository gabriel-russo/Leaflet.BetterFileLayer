import { type ParsedData, TextFileFormat } from './FileFormat.ts';
import { kml as kmlParser } from '@mapbox/togeojson';

/**
 * Load a [KML](https://developers.google.com/kml/documentation/) document.
 */
export class KmlFormat extends TextFileFormat {
  readonly extensions = ['kml'];
  readonly label = 'KML';

  protected parseText(text: string): ParsedData | undefined {
    const parser = new DOMParser();
    return kmlParser(parser.parseFromString(text, 'text/xml'));
  }
}
