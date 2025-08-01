/**
 * @jest-environment jsdom
 */

/*
Fix TextEncoder is not defined error
*/
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, {
  TextEncoder: TextEncoder,
});

Object.assign(global, {
  TextDecoder: TextDecoder,
});

import { test, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import {
  topojsonParse,
  csvParse,
  wktParse,
  kmlParse,
  polylineParse,
  gpxParse,
  kmzParse,
} from '../src/leaflet.omnivore.parsers';

test('Testing .TOPOJSON Parser', () => {
  const parsedTopojson = topojsonParse(
    readFileSync('./test/a.topojson', 'utf-8')
  );

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [3.1640625, 44.590318725160564],
            [22.497152058955894, 52.69656423444786],
            [26.3661327070207, 41.77131167976407],
            [36.56133972772277, 50.958048536151566],
            [62.22656249999999, 54.57206165565852],
          ],
        },
      },
    ],
  };

  return expect(parsedTopojson).toStrictEqual(expectedGeoJson);
});

test('Testing .CSV Parser | Without Options', () => {
  const parsedCsv = csvParse(readFileSync('./test/a.csv', 'utf-8'), {});

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Hello World',
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
      },
    ],
  };

  return expect(parsedCsv).toStrictEqual(expectedGeoJson);
});

test('Testing .CSV Parser | With Options', () => {
  const options = {
    delimiter: ';',
    latfield: 'LATITUDE',
    lonfield: 'long',
  };

  const parsedCsv = csvParse(readFileSync('./test/b.csv', 'utf-8'), options);

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Hello World',
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
      },
    ],
  };

  return expect(parsedCsv).toStrictEqual(expectedGeoJson);
});

test('Testing .GPX Parser', () => {
  const parsedGpx = gpxParse(readFileSync('./test/a.gpx', 'utf-8'));

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [6.05487864642, 44.907783722, 1298],
            [6.05518996909, 44.9077732488, 1301],
            [6.05547047546, 44.9077638115, 1308],
          ],
        },
      },
    ],
  };

  return expect(parsedGpx).toStrictEqual(expectedGeoJson);
});

test('Testing .KML Parser', () => {
  const parsedKml = kmlParse(readFileSync('./test/a.kml', 'utf-8'));

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-120.0822035425683, 37.42228990140251, 0],
        },
        properties: {
          name: 'Simple placemark two',
          description:
            'Attached to the ground. Intelligently places itself\n       at the height of the underlying terrain.',
          tessellate: '-1',
          extrude: '0',
          visibility: '-1',
        },
      },
    ],
  };

  return expect(parsedKml).toStrictEqual(expectedGeoJson);
});

test('Testing .KMZ Parser', async () => {
  const parsedKml = await kmzParse(readFileSync('./test/a.kmz'));

  const expectedGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-120.082203542568, 37.4222899014025, 0],
        },
        properties: {
          name: 'Simple placemark two',
          description:
            'Attached to the ground. Intelligently places itself \n       at the height of the underlying terrain.',
          tessellate: '-1',
          extrude: '0',
          visibility: '-1',
        },
      },
    ],
  };

  return expect(parsedKml).toStrictEqual(expectedGeoJson);
});

test('Testing .POLYLINE Parser', () => {
  const parsedPolyline = polylineParse(
    readFileSync('./test/a.polyline', 'utf-8'),
    {}
  );

  const expectedGeoJson = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-120.2, 38.5],
        [-120.95, 40.7],
        [-126.453, 43.252],
        [-126.453, 43.25194],
      ],
    },
  };

  return expect(parsedPolyline).toStrictEqual(expectedGeoJson);
});

test('Testing .WKT Parser', () => {
  const parsedWkt = wktParse(readFileSync('./test/a.wkt', 'utf-8'));

  const expectedGeoJson = {
    type: 'MultiPoint',
    coordinates: [
      [20, 20],
      [10, 10],
      [30, 30],
    ],
  };

  return expect(parsedWkt).toStrictEqual(expectedGeoJson);
});
