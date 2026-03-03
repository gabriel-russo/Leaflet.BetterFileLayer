declare module '@mapbox/togeojson' {
  import type { FeatureCollection } from 'geojson';

  interface KmlOptions {
    styles?: boolean;
  }

  function kml(doc: Document, options?: KmlOptions): FeatureCollection;
  function gpx(doc: Document): FeatureCollection;
}
