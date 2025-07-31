import './polyfills';
import * as L from 'leaflet';
import {
  csvParse,
  geojsonParse,
  gpxParse,
  kmlParse,
  kmzParse,
  polylineParse,
  shpParse,
  topojsonParse,
  wktParse,
} from './leaflet.omnivore.parsers';
import { GeoJsonObject } from 'geojson';

/**
 * Load a [GeoJSON](http://geojson.org/) document into a layer and return the layer.
 */
export async function geojsonLoad(file: File, options, customLayer: L.GeoJSON) {
  const layer = customLayer || L.geoJson(null, { ...options.layerOptions });

  const data = await file.text();

  const parsedData = geojsonParse(data);

  if (!parsedData) {
    throw Error('Cannot parse GeoJSON file.');
  }
  layer.addData(parsedData as GeoJsonObject);
  return layer;
}

/**
 * Load a [TopoJSON](https://github.com/mbostock/topojson) document into a layer and return the layer.
 *
 */
export async function topojsonLoad(
  file: File,
  options,
  customLayer: L.GeoJSON
) {
  const layer = customLayer || L.geoJson(null, { ...options.layerOptions });

  const data = await file.text();

  const parsedData = topojsonParse(data);

  layer.addData(parsedData as GeoJsonObject);
  return layer;
}

/**
 * Load a CSV document into a layer and return the layer.
 */
export async function csvLoad(file: File, options, customLayer: L.GeoJSON) {
  const layer = customLayer || L.geoJson(null, { ...options.layerOptions });

  const data = await file.text();

  const parsedData = csvParse(data, options.parserOptions);

  layer.addData(parsedData as GeoJsonObject);
  return layer;
}

/**
 * Load a GPX document into a layer and return the layer.
 */
export async function gpxLoad(file: File, options, customLayer: L.GeoJSON) {
  const layer = customLayer || L.geoJson(null, { ...options.layerOptions });

  const data = await file.text();

  const parsedData = gpxParse(data);

  layer.addData(parsedData as GeoJsonObject);
}

/**
 * Load a [KML](https://developers.google.com/kml/documentation/) document into a layer and return the layer.
 */
export async function kmlLoad(file: File, options, customLayer: L.GeoJSON) {
  const layer = customLayer || L.geoJson(null, { ...options.layerOptions });

  const data = await file.text();

  const parsedData = kmlParse(data);

  layer.addData(parsedData as GeoJsonObject);
  return layer;
}

export async function kmzLoad(file: File, options, customLayer: L.GeoJSON) {
  const layer = customLayer || L.geoJson(null, { ...options.layerOptions });

  const data = await file.arrayBuffer();

  const parsedData = await kmzParse(data);

  layer.addData(parsedData as GeoJsonObject);
  return layer;
}

/**
 * Load a WKT (Well Known Text) string into a layer and return the layer
 */
export async function wktLoad(file: File, options, customLayer: L.GeoJSON) {
  const layer = customLayer || L.geoJson(null, { ...options.layerOptions });

  const data = await file.text();

  const parsedData = wktParse(data);

  layer.addData(parsedData as GeoJsonObject);
  return layer;
}

/**
 * Load a polyline string into a layer and return the layer
 */
export async function polylineLoad(
  file: File,
  options,
  customLayer: L.GeoJSON
) {
  const layer = customLayer || L.geoJson(null, { ...options.layerOptions });

  const data = await file.text();

  const parsedData = polylineParse(data, options.parserOptions);

  layer.addData(parsedData as GeoJsonObject);
  return layer;
}

/**
 * Reads the zipped shapefile and return the layer
 */
export async function shapefileLoad(
  file: File,
  options,
  customLayer: L.GeoJSON
) {
  const layer = customLayer || L.geoJson(null, { ...options.layerOptions });

  const data = await file.arrayBuffer();

  const parsedData = await shpParse(data);

  layer.addData(parsedData as GeoJsonObject);
  return layer;
}
