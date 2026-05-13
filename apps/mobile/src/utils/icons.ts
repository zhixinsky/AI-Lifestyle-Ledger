const BACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>';

function toBase64(raw: string): string {
  return uni.arrayBufferToBase64(
    new Uint8Array([...raw].map(c => c.charCodeAt(0))).buffer
  );
}

export function svgToUri(raw: string): string {
  // #ifdef H5
  return `data:image/svg+xml,${encodeURIComponent(raw)}`;
  // #endif
  // #ifndef H5
  return `data:image/svg+xml;base64,${toBase64(raw)}`;
  // #endif
}

export const backIcon = svgToUri(BACK_SVG);

export function makeSvgIcon(paths: string, color = '#1e1e1e', strokeWidth = '2.2'): string {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  return svgToUri(raw);
}
