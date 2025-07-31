// @ts-ignore
import JSZip from 'jszip';
import { Feature } from 'geojson';

/*
 * Returns the file's extension without dot
 */
export function getFileExtension(file: File): string {
  return file.name.split('.').at(-1) as string;
}

/*
 * Returns the filename without extension
 */
export function getFileBaseName(file: File): string {
  return file.name.split('.').at(0) as string;
}

/**
 * Converts the file size to kilobytes
 */
export function bytesToKilobytes(value: number): number {
  return value / 1024;
}

/**
 * Group the shapefile components (shp, dbf, prj...) by filename and returns an object where the
 * keys are the filename and the value is a list with the shapefile components associated
 */
export async function processShapeFiles(files: File[]): Promise<File[]> {
  const shpComponents: Record<string, File[]> = {};
  const zips: File[] = [];

  for (const file of files) {
    const extension = getFileExtension(file);

    const fileName = getFileBaseName(file);

    if (['shp', 'shx', 'dbf', 'prj'].includes(extension)) {
      if (!(fileName in shpComponents)) {
        shpComponents[fileName] = [];
      }

      shpComponents[fileName].push(file);
    }
  }

  if (!Object.keys(shpComponents).length) {
    return [];
  }

  for (const fileName in shpComponents) {
    const zip = new JSZip();

    for (const component of shpComponents[fileName]) {
      zip.file(component.name, await component.arrayBuffer());
    }

    const blob = await zip.generateAsync({ type: 'blob' });

    const shpZip: File = new File([blob], `${fileName}.zip`, {
      type: 'application/zip',
    });

    zips.push(shpZip);
  }

  return zips;
}

/*
 * Filters all files that are part of a shapefile's components (shp, dbf, prj...)
 */
export function filterShpComponents(files: File[]): File[] {
  const filteredFiles: File[] = [];

  for (const file of files) {
    if (!['shp', 'shx', 'dbf', 'prj'].includes(getFileExtension(file))) {
      filteredFiles.push(file);
    }
  }

  return filteredFiles;
}

/*
 * Transform the simple style spec from feature props to Leaflet Path styles options
 */
export function simpleStyleToLeafletStyle(feature: Feature) {
  if (!feature.properties) {
    return;
  }

  // https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
  const simpleStyleSpecMap: Record<string, string> = {
    stroke: 'color',
    'stroke-opacity': 'opacity',
    'stroke-width': 'weight',
    fill: 'fillColor',
    'fill-opacity': 'fillOpacity',
  } as const;

  const leafletPathOptions: Record<string, string> = {};

  for (const style in simpleStyleSpecMap) {
    if (style in feature.properties) {
      leafletPathOptions[simpleStyleSpecMap[style]] = feature.properties[style];
    }
  }

  if (!Object.keys(leafletPathOptions).length) {
    return;
  }

  return leafletPathOptions;
}

/*
 * Filters a property based on a blacklist of property names considered not required info to be displayed
 */
export function isPropertyNameDisplayable(prop: string): boolean {
  const blackList = [
    'marker-size',
    'marker-symbol',
    'marker-color',
    'stroke',
    'stroke-opacity',
    'stroke-width',
    'fill',
    'fill-opacity',
    'styleHash',
    'styleUrl',
    'styleMapHash',
    'stroke-dasharray',
  ];

  return !blackList.includes(prop);
}
