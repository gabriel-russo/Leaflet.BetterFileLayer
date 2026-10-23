import { test, expect } from 'vitest';
import type { Feature } from 'geojson';
import {
  bytesToKilobytes,
  getFileBaseName,
  getFileExtension,
  isPropertyNameDisplayable,
  simpleStyleToLeafletStyle,
} from '@/utils';

function fakeFile(name: string): File {
  return new File([''], name);
}

test('getFileExtension returns the extension without dot', () => {
  expect(getFileExtension(fakeFile('points.geojson'))).toBe('geojson');
  expect(getFileExtension(fakeFile('archive.tar.gz'))).toBe('gz');
  expect(getFileExtension(fakeFile('no-extension'))).toBe('no-extension');
});

test('getFileBaseName keeps dots that belong to the name', () => {
  expect(getFileBaseName(fakeFile('points.geojson'))).toBe('points');
  expect(getFileBaseName(fakeFile('my.maps.shp'))).toBe('my.maps');
  expect(getFileBaseName(fakeFile('no-extension'))).toBe('no-extension');
});

test('bytesToKilobytes converts bytes to kilobytes', () => {
  expect(bytesToKilobytes(2048)).toBe(2);
  expect(bytesToKilobytes(0)).toBe(0);
});

test('isPropertyNameDisplayable filters simple-style properties', () => {
  expect(isPropertyNameDisplayable('name')).toBe(true);
  expect(isPropertyNameDisplayable('marker-symbol')).toBe(false);
  expect(isPropertyNameDisplayable('styleUrl')).toBe(false);
});

test('simpleStyleToLeafletStyle maps simple style spec to path options', () => {
  const feature: Feature = {
    type: 'Feature',
    properties: {
      name: 'Hello',
      stroke: '#ff0000',
      'stroke-opacity': 0.5,
      'stroke-width': 3,
      fill: '#00ff00',
      'fill-opacity': 0.25,
    },
    geometry: { type: 'Point', coordinates: [0, 0] },
  };

  expect(simpleStyleToLeafletStyle(feature)).toStrictEqual({
    color: '#ff0000',
    opacity: 0.5,
    weight: 3,
    fillColor: '#00ff00',
    fillOpacity: 0.25,
  });
});

test('simpleStyleToLeafletStyle ignores features without properties', () => {
  const feature: Feature = {
    type: 'Feature',
    properties: null,
    geometry: { type: 'Point', coordinates: [0, 0] },
  };

  expect(simpleStyleToLeafletStyle(feature)).toStrictEqual({});
});
