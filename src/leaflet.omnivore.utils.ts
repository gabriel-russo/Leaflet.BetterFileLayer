/**
 * Parse a XML string like to XML
 */
export function parseXML(str: string): XMLDocument {
  return new DOMParser().parseFromString(str, 'text/xml');
}
