import { type ParsedData, TextFileFormat } from './FileFormat.ts';
import { feature as topojsonFeature } from 'topojson-client';

/**
 * Load a [TopoJSON](https://github.com/mbostock/topojson) document.
 */
export class TopoJsonFormat extends TextFileFormat {
  readonly extensions = ['topojson'];
  readonly label = 'Topojson';

  protected parseText(text: string): ParsedData | undefined {
    const topojson = JSON.parse(text);

    if (!topojson) return;

    // FIXME
    // TopoJSON has an unpredictable structure, so we take the first object.
    for (const objectType in topojson.objects) {
      const parsed = topojsonFeature(topojson, topojson.objects[objectType]);

      if (!parsed) return;

      return parsed as ParsedData;
    }
  }
}
