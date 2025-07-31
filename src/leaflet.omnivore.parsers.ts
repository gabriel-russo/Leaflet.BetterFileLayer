// @ts-ignore
import { csv2geojson } from 'csv2geojson';
// @ts-ignore
import { parse as wktParser } from 'wellknown';
// @ts-ignore
import { decode as polylineParser } from '@mapbox/polyline';
// @ts-ignore
import { feature as topojsonParser } from 'topojson-client';
// @ts-ignore
import { gpx as gpxParser, kml as kmlParser } from '@mapbox/togeojson';
// @ts-ignore
import { parseZip as parseShpZip } from 'shpjs';
// @ts-ignore
import { loadAsync } from 'jszip';
import { parseXML } from './leaflet.omnivore.utils';
import { Feature, FeatureCollection, Geometry } from 'geojson';

export function geojsonParse(data: string): FeatureCollection | undefined {
  const geojson: FeatureCollection | undefined = JSON.parse(data);

  if (!geojson) {
    return;
  }

  return geojson;
}

export function topojsonParse(
  data: string
): FeatureCollection | Feature | undefined {
  const topojson = JSON.parse(data);

  // For specific for TopoJson unpredictable weird structure.
  for (const object_type in topojson.objects) {
    const parsed: FeatureCollection | Feature = topojsonParser(
      topojson,
      topojson.objects[object_type]
    );

    if (!parsed) {
      return;
    }

    return parsed;
  }
}

export function csvParse(data: string, options): FeatureCollection | undefined {
  options = options || {};

  let features: FeatureCollection | undefined = undefined;

  const afterParse = (err, geojson) => {
    if (err) {
      return;
    }
    features = geojson as FeatureCollection;
  };

  csv2geojson(data, options, afterParse);

  return features;
}

export function gpxParse(data: string): FeatureCollection | undefined {
  const xml = parseXML(data);

  if (!xml) {
    return;
  }

  return gpxParser(xml);
}

export function kmlParse(data: string): FeatureCollection | undefined {
  const xml = parseXML(data);

  if (!xml) {
    return;
  }

  return kmlParser(xml);
}

export async function kmzParse(
  data: ArrayBuffer
): Promise<FeatureCollection | undefined> {
  const { files } = await loadAsync(data);

  for (const file in files) {
    if (file.endsWith('.kml')) {
      const xml = await files[file].async('text');
      return kmlParse(xml);
    }
  }

  return;
}

export function polylineParse(data: string, options): Feature | undefined {
  options = options || {};

  const coords = polylineParser(data, options.precision);

  const geom: Geometry = {
    type: 'LineString',
    coordinates: [],
  };

  if (!coords.length) {
    return;
  }

  for (let i = 0; i < coords.length; i++) {
    // polyline returns coords in lat, lng order, so flip for geojson
    geom.coordinates[i] = [coords[i][1], coords[i][0]];
  }

  return { type: 'Feature', geometry: geom } as Feature;
}

export function wktParse(wkt: string): FeatureCollection | undefined {
  const parsed = wktParser(wkt);

  if (!parsed) {
    return;
  }

  return parsed;
}

export async function shpParse(
  data: ArrayBuffer
): Promise<FeatureCollection | undefined> {
  const parsedData = await parseShpZip(data);

  if (!parsedData) {
    return;
  }

  return parsedData;
}
