declare module 'csv2geojson' {
  import type { FeatureCollection } from 'geojson';

  interface CsvOptions {
    latfield?: string;
    lonfield?: string;
    delimiter?: string | 'auto';
    crs?: string;
  }

  type CsvCallback = (
    err: { type: string; message: string } | null,
    data: FeatureCollection
  ) => void;

  function csv2geojson(
    csv: string,
    options: CsvOptions,
    callback: CsvCallback
  ): void;

  function csv2geojson(csv: string, callback: CsvCallback): void;
}
