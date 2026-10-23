import { BinaryFileFormat, ParsedData } from './core.ts';
import { getFileBaseName, getFileExtension } from '@/utils.ts';
import JSZip from 'jszip';
import { parseZip as parseShapefileZip } from 'shpjs';

const SHAPEFILE_COMPONENTS = ['shp', 'shx', 'dbf', 'prj', 'cpg', 'sbx', 'sbn', 'qpj'];

/**
 * Load a zipped shapefile. Separate components (.shp, .dbf, .shx, ...) are
 * grouped into a zip before loading, see {@link ShapefileFormat.preprocess}.
 */
export class ShapefileFormat extends BinaryFileFormat {
  readonly extensions = ['zip'];
  readonly acceptExtensions = SHAPEFILE_COMPONENTS;
  readonly label = 'Shapefile';

  override async preprocess(files: File[]): Promise<File[]> {
    const components = files.filter((file) =>
      SHAPEFILE_COMPONENTS.includes(getFileExtension(file)),
    );

    if (!components.length) return files;

    const others = files.filter((file) => !SHAPEFILE_COMPONENTS.includes(getFileExtension(file)));

    const grouped: Record<string, File[]> = {};

    for (const component of components) {
      const baseName = getFileBaseName(component);

      if (!grouped[baseName]) {
        grouped[baseName] = [];
      }

      grouped[baseName].push(component);
    }

    const zips: File[] = [];

    for (const baseName in grouped) {
      const zip = new JSZip();

      for (const component of grouped[baseName]) {
        zip.file(component.name, await component.arrayBuffer());
      }

      const blob = await zip.generateAsync({ type: 'blob' });

      zips.push(new File([blob], `${baseName}.zip`, { type: 'application/zip' }));
    }

    return [...others, ...zips];
  }

  protected async parseBinary(data: ArrayBuffer): Promise<ParsedData | undefined> {
    return (await parseShapefileZip(data)) as ParsedData | undefined;
  }
}
