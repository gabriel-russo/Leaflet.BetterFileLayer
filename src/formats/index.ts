import { FileFormatRegistry } from './core.ts';
import { CsvFormat } from './CsvFormat.ts';
import { GeoJsonFormat } from './GeoJson.ts';
import { GpxFormat } from './GpxFormat.ts';
import { KmlFormat } from './KmlFormat.ts';
import { KmzFormat } from './KmzFormat.ts';
import { PolylineFormat } from './PolylineFormat.ts';
import { ShapefileFormat } from './ShapefileFormat.ts';
import { TopoJsonFormat } from './TopoJson.ts';
import { WktFormat } from './WktFormat.ts';

/**
 * Builds the registry with all the formats shipped with the plugin.
 */
export function createDefaultRegistry(): FileFormatRegistry {
  return new FileFormatRegistry().register(
    new GeoJsonFormat(),
    new TopoJsonFormat(),
    new CsvFormat(),
    new GpxFormat(),
    new KmlFormat(),
    new KmzFormat(),
    new WktFormat(),
    new PolylineFormat(),
    new ShapefileFormat(),
  );
}

export type { FileFormatRegistry };
