import { BinaryFileFormat, type ParsedData } from './FileFormat.ts';
import { kml as kmlParser } from '@mapbox/togeojson';
import { loadAsync } from 'jszip';

/**
 * Load a KMZ (zipped KML) document.
 */
export class KmzFormat extends BinaryFileFormat {
  readonly extensions = ['kmz'];
  readonly label = 'KMZ';

  protected async parseBinary(data: ArrayBuffer): Promise<ParsedData | undefined> {
    const { files } = await loadAsync(data);
    const parser = new DOMParser();

    for (const file in files) {
      if (file.endsWith('.kml')) {
        const text = await files[file].async('text');
        return kmlParser(parser.parseFromString(text, 'text/xml'));
      }
    }
  }
}
