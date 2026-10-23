import { type ParsedData, TextFileFormat } from './core.ts';
import { csv2geojson, type CsvOptions } from 'csv2geojson';
import { BetterFileLayerControlOptions } from '@/types.ts';
import { FeatureCollection } from 'geojson';

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
