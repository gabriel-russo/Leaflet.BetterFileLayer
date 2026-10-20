import type { Feature, FeatureCollection, GeoJsonObject } from 'geojson';
import type { GeoJSON } from 'leaflet';
import type { BetterFileLayerControlOptions } from '../types';

/**
 * Anything a parser can produce and a Leaflet GeoJSON layer accepts.
 */
export type ParsedData = GeoJsonObject | Feature | FeatureCollection;

/**
 * Everything a format needs to load a file into a layer.
 */
export interface FormatContext {
  file: File;
  layer: GeoJSON;
  options: BetterFileLayerControlOptions;
}

/**
 * Base class for every supported file format.
 *
 * It owns the whole load pipeline (read -> parse -> guard -> fill the layer) so
 * concrete formats only have to implement {@link FileFormat.parse}.
 */
export abstract class FileFormat {
  /**
   * Extensions handled by this format, without the leading dot.
   */
  abstract readonly extensions: readonly string[];

  /**
   * Human readable name used in error messages.
   */
  abstract readonly label: string;

  /**
   * Extra extensions advertised in the file input `accept` attribute that are
   * consumed indirectly (for example shapefile companion files).
   */
  readonly acceptExtensions: readonly string[] = [];

  /**
   * Convert the given file into GeoJSON-ish data.
   */
  abstract parse(
    file: File,
    options?: unknown,
  ): Promise<ParsedData | undefined> | ParsedData | undefined;

  /**
   * Rewrite the incoming file batch before loading. Formats that consume
   * companion files (shapefile) can override this to group them.
   */
  preprocess(files: File[]): Promise<File[]> {
    return Promise.resolve(files);
  }

  /**
   * Reads the format specific options from the control options.
   */
  protected resolveOptions(_options: BetterFileLayerControlOptions): unknown {
    return undefined;
  }

  /**
   * Shared pipeline: read + parse + guard + populate the layer.
   */
  async load({ file, layer, options }: FormatContext): Promise<void> {
    const data = await this.parse(file, this.resolveOptions(options));

    if (!data) {
      throw new Error(`Cannot parse ${this.label} file.`);
    }

    layer.addData(data);
  }
}

/**
 * Base class for formats whose input is plain text.
 */
export abstract class TextFileFormat extends FileFormat {
  async parse(file: File, options?: unknown): Promise<ParsedData | undefined> {
    return this.parseText(await file.text(), options);
  }

  protected abstract parseText(text: string, options?: unknown): ParsedData | undefined;
}

/**
 * Base class for formats whose input is binary.
 */
export abstract class BinaryFileFormat extends FileFormat {
  async parse(file: File, options?: unknown): Promise<ParsedData | undefined> {
    return this.parseBinary(await file.arrayBuffer(), options);
  }

  protected abstract parseBinary(
    data: ArrayBuffer,
    options?: unknown,
  ): Promise<ParsedData | undefined> | ParsedData | undefined;
}

/**
 * Maps extensions to formats and acts as the single source of truth for the
 * list of supported extensions.
 */
export class FileFormatRegistry {
  private readonly list: FileFormat[] = [];
  private readonly byExtension = new Map<string, FileFormat>();

  register(...formats: FileFormat[]): this {
    for (const format of formats) {
      this.list.push(format);

      for (const extension of format.extensions) {
        this.byExtension.set(extension, format);
      }
    }

    return this;
  }

  get(extension: string): FileFormat | undefined {
    return this.byExtension.get(extension);
  }

  has(extension: string): boolean {
    return this.byExtension.has(extension);
  }

  get supportedExtensions(): string[] {
    return [...this.byExtension.keys()];
  }

  get acceptExtensions(): string[] {
    const extensions = new Set<string>();

    for (const format of this.list) {
      for (const extension of format.extensions) extensions.add(extension);
      for (const extension of format.acceptExtensions) extensions.add(extension);
    }

    return [...extensions].map((extension) => `.${extension}`);
  }

  get registry(): FileFormat[] {
    return this.list;
  }
}
