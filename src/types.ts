import type {
  Control,
  ControlOptions,
  ControlPosition,
  GeoJSON,
  Layer,
  Map,
  PathOptions,
} from 'leaflet';
import type { Feature } from 'geojson';

/*
 * EVENT HANDLERS
 */

/*
 * File Layer loaded successfully
 */
type LayerLoadedEventHandler = (e: {
  layer: GeoJSON;
  fileName: string;
  fileExtension: string;
  fileSize: number;
  fileType: string;
  fileLastModified: Date;
  fileUploadDate: Date;
}) => void;

/*
 * File Layer failed to load
 */
type LayerLoadErrorEventHandler = (e: {
  fileName: string;
  fileExtension: string;
  exception: Error;
  message: string;
}) => void;

/*
 * File extension is not supported
 */
type FileNotSupportedEventHandler = (e: {
  fileName: string;
  fileExtension: string;
  supportedExtensions: string[];
}) => void;

/*
 * Layer loaded successfully but has 0 (zero) features to show.
 */
type LayerIsEmptyEventHandler = (e: {
  fileName: string;
  fileExtension: string;
  fileSize: number;
}) => void;

/*
 * File size is bigger than the limit permitted
 */
type FileSizeLimitEventHandler = (e: {
  fileName: string;
  fileExtension: string;
  fileSize: number;
  maxFileSize: number;
}) => void;

// redeclare module, maintains compatibility with @types/leaflet
declare module 'leaflet' {
  /**
   * Extends built in leaflet Layer Options.
   */
  interface Evented {
    on(
      type: 'bfl:layerloaded',
      fn: LayerLoadedEventHandler,
      context?: never
    ): this;

    on(
      type: 'bfl:layerloaderror',
      fn: LayerLoadErrorEventHandler,
      context?: never
    ): this;

    on(
      type: 'bfl:filenotsupported',
      fn: FileNotSupportedEventHandler,
      context?: never
    ): this;

    on(
      type: 'bfl:layerisempty',
      fn: LayerIsEmptyEventHandler,
      context?: never
    ): this;

    on(
      type: 'bfl:filesizelimit',
      fn: FileSizeLimitEventHandler,
      context?: never
    ): this;
  }
}

/*
 * Better File Layer Control types
 */

type SupportedExtensions =
  | '.geojson'
  | '.json'
  | '.kml'
  | '.kmz'
  | '.csv'
  | '.wkt'
  | '.gpx'
  | '.topojson'
  | '.polyline'
  | '.zip'
  | '.shp'
  | '.shx'
  | '.dbf'
  | '.prj'
  | '.cpg';

export interface BetterFileLayerControlOptions extends ControlOptions {
  /**
   * Control position.
   */
  position: ControlPosition;
  /**
   * Maximum file size in kilobytes.
   */
  fileSizeLimit: number;
  /**
   * Function used with GeoJSON. See Leaflet docs.
   */
  style: (feature: Feature) => PathOptions;
  /**
   * Function used with GeoJSON. See Leaflet docs.
   */
  onEachFeature: (feature: Feature, layer: Layer) => void;
  /**
   * Layer used to Load the data. Custom Layers must be Type of GeoJSON.
   */
  layer: GeoJSON;
  /**
   * Supported extensions by HTML File Input.
   */
  extensions: SupportedExtensions[];
  /**
   * CSV options. See csv2geojson to see options.
   */
  csvOptions: {
    delimiter: string;
    latfield: string;
    lonfield: string;
  };
  /**
   * Polyline options. See @mapbox/polyline to see options.
   */
  polylineOptions: {
    precision: number;
  };
  /**
   * Control button text.
   */
  text: {
    title: string;
  };
  button?: HTMLElement | HTMLInputElement;
  /**
   * Enable autoload.
   */
  addOnMap: boolean;
}

/*
 * Main Control class
 */
export declare class BetterFileLayer extends Control {
  public constructor(options?: Partial<BetterFileLayerControlOptions>);

  public onAdd(map: Map): HTMLDivElement;

  private _enableDragAndDrop(): void;

  private _disableDragAndDrop(): void;

  private _onDragAndDrop(): void;

  private _onFileUpload(e: Event): void;

  private _load(files: File[]): Promise<void>;

  public onRemove(): void;
}
