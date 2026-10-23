import { gpx as gpxParser } from '@mapbox/togeojson';
import { ParsedData, TextFileFormat } from './FileFormat.ts';

/**
 * Load a GPX document.
 */
export class GpxFormat extends TextFileFormat {
  readonly extensions = ['gpx'];
  readonly label = 'GPX';

  protected parseText(text: string): ParsedData | undefined {
    const parser = new DOMParser();
    return gpxParser(parser.parseFromString(text, 'text/xml'));
  }
}
