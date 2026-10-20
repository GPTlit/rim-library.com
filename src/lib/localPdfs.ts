import { Capacitor } from '@capacitor/core';
import { QahwaNative, isQahwaNativeAvailable, type LocalPdf } from './qahwaNative';

const KEY = 'qahwa-local-pdfs';
export function localPdfs(): LocalPdf[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function rememberLocalPdf(pdf: LocalPdf) {
  localStorage.setItem(KEY, JSON.stringify([pdf, ...localPdfs().filter(p => p.id !== pdf.id)]));
}
export async function refreshLocalPdfs() {
  if (!isQahwaNativeAvailable()) return { files: localPdfs(), limited: true };
  const result = await QahwaNative.listDevicePdfs();
  localStorage.setItem(KEY, JSON.stringify(result.files));
  return result;
}
export async function readableLocalPdf(uri: string) {
  const result = await QahwaNative.getReadablePdf({ uri });
  return Capacitor.convertFileSrc(result.uri);
}