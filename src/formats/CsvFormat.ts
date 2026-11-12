import { csv2geojson, type CsvOptions } from 'csv2geojson';
import { FeatureCollection } from 'geojson';

import { BetterFileLayerControlOptions } from '@/types.ts';

import { type ParsedData, TextFileFormat } from './core.ts';

/**
 * Load a CSV document.
 */
export class CsvFormat extends TextFileFormat {
  readonly extensions = ['csv'];
  readonly label = 'CSV';

  protected resolveOptions(options: BetterFileLayerControlOptions): unknown {
    return options.csvOptions;
  }

  protected parseText(text: string, options?: unknown): ParsedData | undefined {
    let features: FeatureCollection | undefined;

    csv2geojson(text, options as CsvOptions, (err, geojson) => {
      if (err) return;
      features = geojson as FeatureCollection;
    });

    return features;
  }
}
