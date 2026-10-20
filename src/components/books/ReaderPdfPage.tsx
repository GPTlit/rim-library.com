import { memo } from 'react';
import { Page } from 'react-pdf';

export const ReaderPdfPage = memo(function ReaderPdfPage({ page, width, scale, rotation, inverted }: {
  page: number; width: number; scale: number; rotation: number; inverted: boolean;
}) {
  return <Page pageNumber={page} width={width} scale={scale} rotate={rotation}
    devicePixelRatio={Math.min(globalThis.devicePixelRatio || 1, 1.5)}
    className={`shadow-xl overflow-hidden ${inverted ? 'reader-page-inverted' : ''}`}
    renderTextLayer renderAnnotationLayer={false} />;
});