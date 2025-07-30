declare module 'jsqr' {
  export interface Point {
    x: number;
    y: number;
  }

  export interface Chunks {
    type: 'utf8' | 'byte' | 'alphanum' | 'numeric' | 'kanji';
    text: string;
    bytes: number[];
  }

  export interface QRCode {
    data: string;
    version: number;
    location: {
      topRightCorner: Point;
      topLeftCorner: Point;
      bottomRightCorner: Point;
      bottomLeftCorner: Point;
      topRightFinderPattern: Point;
      topLeftFinderPattern: Point;
      bottomLeftFinderPattern: Point;
      bottomRightAlignmentPattern?: Point;
    };
    chunks: Chunks[];
  }

  export interface Options {
    inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
  }

  function jsQR(data: Uint8ClampedArray, width: number, height: number, options?: Options): QRCode | null;

  export default jsQR;
}
