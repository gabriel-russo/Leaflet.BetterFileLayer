import { decode as polylineDecoder } from '@mapbox/polyline';
import { Feature, Geometry } from 'geojson';

import { BetterFileLayerControlOptions } from '@/types.ts';

import { ParsedData, TextFileFormat } from './core.ts';

/**
 * Load an encoded polyline string.
 */
export class PolylineFormat extends TextFileFormat {
  readonly extensions = ['polyline'];
  readonly label = 'Polyline';

  protected resolveOptions(options: BetterFileLayerControlOptions): unknown {
    return options.polylineOptions;
  }

  protected parseText(text: string, options?: unknown): ParsedData | undefined {
    const precision =
      (options as { precision?: number } | undefined)?.precision ?? 6;

    const coords = polylineDecoder(text, precision);

    if (!coords.length) return;

    const geometry: Geometry = { type: 'LineString', coordinates: [] };

    for (let i = 0; i < coords.length; i++) {
      // polyline returns coords in lat, lng order, so flip for geojson.
      geometry.coordinates[i] = [coords[i][1], coords[i][0]];
    }

    return { type: 'Feature', geometry } as Feature;
  }
}
