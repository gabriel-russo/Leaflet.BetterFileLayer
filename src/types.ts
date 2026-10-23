import { Control } from 'leaflet';
import type { Map, ControlOptions, ControlPosition, GeoJSON, Layer, PathOptions } from 'leaflet';
import type { Feature } from 'geojson';

/*
 * EVENT NAMES
 */

/**
 * Every event fired by the plugin on the map instance.
 */
export const BFL_EVENTS = {
  layerLoaded: 'bfl:layerloaded',
  layerLoadError: 'bfl:layerloaderror',
  fileNotSupported: 'bfl:filenotsupported',
  layerIsEmpty: 'bfl:layerisempty',
  fileSizeLimit: 'bfl:filesizelimit',
} as const;

/*
 * EVENT PAYLOADS
 */

/*
 * File Layer loaded successfully
 */
export interface LayerLoadedEvent {
  layer: GeoJSON;
  fileName: string;
  fileExtension: string;
  fileSize: number;
  fileType: string;
  fileLastModified: Date;
  fileUploadDate: Date;
}

/*
 * File Layer failed to load
 */
export interface LayerLoadErrorEvent {
  fileName: string;
  fileExtension: string;
  exception: Error;
  message: string;
}

/*
 * File extension is not supported
 */
export interface FileNotSupportedEvent {
  fileName: string;
  fileExtension: string;
  supportedExtensions: string[];
}

/*
 * Layer loaded successfully but has 0 (zero) features to show.
 */
export interface LayerIsEmptyEvent {
  fileName: string;
  fileExtension: string;
  fileSize: number;
}

/*
 * File size is bigger than the limit permitted
 */
export interface FileSizeLimitEvent {
  fileName: string;
  fileExtension: string;
  fileSize: number;
  maxFileSize: number;
}

/**
 * Maps every event name to its payload. Keeps names and payloads in sync.
 */
export interface BflEventPayloads {
  'bfl:layerloaded': LayerLoadedEvent;
  'bfl:layerloaderror': LayerLoadErrorEvent;
  'bfl:filenotsupported': FileNotSupportedEvent;
  'bfl:layerisempty': LayerIsEmptyEvent;
  'bfl:filesizelimit': FileSizeLimitEvent;
}

/*
 * EVENT HANDLERS
 */

type LayerLoadedEventHandler = (e: LayerLoadedEvent) => void;

type LayerLoadErrorEventHandler = (e: LayerLoadErrorEvent) => void;

type FileNotSupportedEventHandler = (e: FileNotSupportedEvent) => void;

type LayerIsEmptyEventHandler = (e: LayerIsEmptyEvent) => void;

type FileSizeLimitEventHandler = (e: FileSizeLimitEvent) => void;

// redeclare module, maintains compatibility with @types/leaflet
declare module 'leaflet' {
  /**
   * Extends built in leaflet Layer Options.
   */
  interface Evented {
    on(type: 'bfl:layerloaded', fn: LayerLoadedEventHandler, context?: never): this;

    on(type: 'bfl:layerloaderror', fn: LayerLoadErrorEventHandler, context?: never): this;

    on(type: 'bfl:filenotsupported', fn: FileNotSupportedEventHandler, context?: never): this;

    on(type: 'bfl:layerisempty', fn: LayerIsEmptyEventHandler, context?: never): this;

    on(type: 'bfl:filesizelimit', fn: FileSizeLimitEventHandler, context?: never): this;
  }
}

/*
 * Better File Layer Control types
 */

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
  extensions: string[];
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
  /**
   * Custom External button. Must be input element of type file.
   */
  button?: HTMLInputElement;
  /**
   * Enable or disable layer autoload. If true the plugin will
   * create the layer, add into map and send it via bfl:layerloaded event.
   * If false the plugin will only create the layer and send it via event.
   */
  addOnMap: boolean;
}

/*
 * Main Control class
 */
export declare class BetterFileLayer extends Control {
  private static defaults(extensions: string[]): BetterFileLayerControlOptions;

  public constructor(options?: Partial<BetterFileLayerControlOptions>);

  public onAdd(map: Map): HTMLDivElement;

  public onRemove(): void;

  private _enableDragAndDrop(): void;

  private _disableDragAndDrop(): void;

  private _onDragAndDrop(): void;

  private _onFileUpload(e: Event): void;

  private _load(files: File[]): Promise<void>;

  private _prepareLayer(): void;

  private _fire<K extends keyof BflEventPayloads>(event: K, payload: BflEventPayloads[K]): void;
}
