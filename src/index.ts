/*
  Plugin entry point.
  Declaring and assigning.
*/

import { Map, Control } from 'leaflet';
import type { BetterFileLayerControlOptions } from './types.ts';
export type { BetterFileLayerControlOptions } from './types.ts';

export declare class BetterFileLayer extends Control {
  constructor(options?: Partial<BetterFileLayerControlOptions>);

  public onAdd(map: Map): HTMLDivElement;

  private _enableDragAndDrop(): void;

  private _disableDragAndDrop(): void;

  private _onDragAndDrop(): void;

  private _onFileUpload(e: Event): void;

  private _load(files: File[]): Promise<void>;

  public onRemove(): void;
}
