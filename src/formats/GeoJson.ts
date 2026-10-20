import { FeatureCollection } from 'geojson';
import { ParsedData, TextFileFormat } from './FileFormat.ts';

/**
 * Load a [GeoJSON](http://geojson.org/) document.
 */
export class GeoJsonFormat extends TextFileFormat {
  readonly extensions = ['geojson', 'json'];
  readonly label = 'GeoJSON';

  protected parseText(text: string): ParsedData | undefined {
    return JSON.parse(text) as FeatureCollection;
  }
}
