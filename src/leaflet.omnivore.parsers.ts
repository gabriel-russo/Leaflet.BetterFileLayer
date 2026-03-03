import { csv2geojson, CsvOptions } from 'csv2geojson';
import { GeoJSONGeometry, parse as wktParser } from 'wellknown';
import { decode as polylineParser } from '@mapbox/polyline';
import { feature as topojsonParser } from 'topojson-client';
import { gpx as gpxParser, kml as kmlParser } from '@mapbox/togeojson';
import { FeatureCollectionWithFilename, parseZip as parseShpZip } from 'shpjs';
import { loadAsync } from 'jszip';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

interface TextParserParameters {
  data: string;
}

interface CsvParserParameters {
  data: string;
  options: CsvOptions;
}

interface PolylineParserParameters {
  data: string;
  precision: number;
}

interface BinaryParserParameters {
  data: ArrayBuffer;
}

export function geojsonParse({
  data,
}: TextParserParameters): FeatureCollection | undefined {
  const geojson: FeatureCollection | undefined = JSON.parse(data);

  if (!geojson) {
    return;
  }

  return geojson;
}

export function topojsonParse({
  data,
}: TextParserParameters): FeatureCollection | Feature | undefined {
  const topojson = JSON.parse(data);

  if (!topojson) {
    return;
  }

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

export function csvParse({
  data,
  options,
}: CsvParserParameters): FeatureCollection | undefined {
  let features: FeatureCollection | undefined = undefined;

  const afterParse = (err: unknown, geojson: FeatureCollection) => {
    if (err) {
      return;
    }
    features = geojson as FeatureCollection;
  };

  csv2geojson(data, options, afterParse);

  return features;
}

/**
 * Parse a XML string like to XML
 */
export function parseXML(str: string): XMLDocument {
  return new DOMParser().parseFromString(str, 'text/xml');
}

export function gpxParse({
  data,
}: TextParserParameters): FeatureCollection | undefined {
  const xml = parseXML(data);

  if (!xml) {
    return;
  }

  return gpxParser(xml);
}

export function kmlParse({
  data,
}: TextParserParameters): FeatureCollection | undefined {
  const xml = parseXML(data);

  if (!xml) {
    return;
  }

  return kmlParser(xml);
}

export async function kmzParse({
  data,
}: BinaryParserParameters): Promise<FeatureCollection | undefined> {
  const { files } = await loadAsync(data);

  for (const file in files) {
    if (file.endsWith('.kml')) {
      const data = await files[file].async('text');
      return kmlParse({ data });
    }
  }

  return;
}

export function polylineParse({
  data,
  precision,
}: PolylineParserParameters): Feature | undefined {
  const coords = polylineParser(data, precision);

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

export function wktParse({
  data,
}: TextParserParameters): GeoJSONGeometry | undefined {
  const parsed = wktParser(data);

  if (!parsed) {
    return;
  }

  return parsed;
}

export async function shpParse({
  data,
}: BinaryParserParameters): Promise<
  FeatureCollectionWithFilename | FeatureCollectionWithFilename[] | undefined
> {
  const parsedData = await parseShpZip(data);

  if (!parsedData) {
    return;
  }

  return parsedData;
}
