import { Buffer } from 'buffer';

if (globalThis) {
  globalThis.Buffer = globalThis.Buffer || Buffer;
}
