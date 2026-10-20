import type { Feature } from 'geojson';
import type { PathOptions } from 'leaflet';

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
  const name = file.name;
  const dotIndex = name.lastIndexOf('.');

  return dotIndex > 0 ? name.slice(0, dotIndex) : name;
}

/**
 * Converts the file size to kilobytes
 */
export function bytesToKilobytes(value: number): number {
  return value / 1024;
}

/*
 * Transform the simple style spec from feature props to Leaflet Path styles options
 */
export function simpleStyleToLeafletStyle(feature: Feature): PathOptions {
  // https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
  const simpleStyleSpecMap: object = {
    stroke: 'color',
    'stroke-opacity': 'opacity',
    'stroke-width': 'weight',
    fill: 'fillColor',
    'fill-opacity': 'fillOpacity',
  };

  const leafletPathOptions: PathOptions = {};

  for (const style in simpleStyleSpecMap) {
    if (feature.properties && style in feature.properties) {
      leafletPathOptions[simpleStyleSpecMap[style]] = feature.properties[style];
    }
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

export function buildPopupContent(feature: Feature): string {
  const properties = feature.properties;

  if (!properties) return '';

  const rows = Object.keys(properties)
    .filter(isPropertyNameDisplayable)
    .map((key) => `<span><b>${key}</b> : ${properties[key] || ''}</span>`);

  return rows.length
    ? `<div style="display:flex;flex-direction:column;gap:5px">${rows.join('')}</div>`
    : '';
}
