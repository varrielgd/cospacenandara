declare module 'pdfkit' {
  interface PDFDocumentOptions {
    size?: string | number[];
    margins?: { top: number; bottom: number; left: number; right: number };
    layout?: 'portrait' | 'landscape';
    info?: any;
    compress?: boolean;
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    pipe<T extends NodeJS.WritableStream>(stream: T): T;
    fontSize(size: number): this;
    text(text: string, options?: any): this;
    text(text: string, x?: number, y?: number, options?: any): this;
    moveDown(lines?: number): this;
    end(): void;
    on(event: string, callback: (...args: any[]) => void): this;
  }

  export default PDFDocument;
}
