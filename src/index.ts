/*
  Plugin entry point.
  Declaring and assigning.
*/

import * as L from 'leaflet';
import './styles.css';
import type {
  BetterFileLayerControlOptions,
  FileNotSupportedEventHandler,
  FileSizeLimitEventHandler,
  LayerIsEmptyEventHandler,
  LayerLoadedEventHandler,
  LayerLoadErrorEventHandler,
} from './types';

declare module 'leaflet' {
  namespace Control {
    export class BetterFileLayer extends L.Control {
      public options: Partial<BetterFileLayerControlOptions>;

      constructor(options?: Partial<BetterFileLayerControlOptions>);

      public onAdd(map: L.Map): HTMLDivElement;

      public bind_button(ref: HTMLInputElement): void;

      private _enableDragAndDrop(): void;

      private _disableDragAndDrop(): void;

      private _onDragAndDrop(): void;

      private _onFileUpload(e: Event): void;

      private _load(files: File[]): Promise<void>;

      public onRemove(): void;
    }
  }

  namespace control {
    export function betterFileLayer(
      options?: Partial<BetterFileLayerControlOptions>
    ): Control.BetterFileLayer;
  }

  export interface Evented {
    on(type: 'bfl:layerloaded', fn: LayerLoadedEventHandler): this;

    on(type: 'bfl:layerloaderror', fn: LayerLoadErrorEventHandler): this;

    on(type: 'bfl:filenotsupported', fn: FileNotSupportedEventHandler): this;

    on(type: 'bfl:layerisempty', fn: LayerIsEmptyEventHandler): this;

    on(type: 'bfl:filesizelimit', fn: FileSizeLimitEventHandler): this;
  }
}

import { BetterFileLayer, betterFileLayer } from './leaflet.control';

export { BetterFileLayer, BetterFileLayerControlOptions };

Object.assign(L.Control, {
  BetterFileLayer: BetterFileLayer,
});

Object.assign(L.control, {
  betterFileLayer: betterFileLayer,
});

L.Map.mergeOptions({
  betterFileLayerControl: false,
});
