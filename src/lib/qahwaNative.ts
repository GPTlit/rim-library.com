// Contract between the web app and the native Android "QahwaNative" Capacitor plugin
// (implemented in android/app/src/main/java/app/lovable/qahwa/QahwaNativePlugin.kt).
// On web / iOS the plugin is absent; callers must check isQahwaNativeAvailable().
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface SavePdfResult {
  uri: string; // content:// URI from MediaStore (or file path on older Android)
  fileName: string; // final unique filename actually written
  size: number; // bytes
}

export interface WidgetBook {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  description?: string;
  page?: number;
  totalPages?: number;
  status?: string;
}

export interface WidgetPayload {
  signedIn: boolean;
  dailyBook?: WidgetBook & { message?: string };
  continueReading?: WidgetBook;
  discover?: WidgetBook[];
  collection?: WidgetBook[];
  featured?: WidgetBook;
  quote?: { id: string; text: string; bookId: string; bookTitle: string; author?: string };
  updatedAt: string;
}

export interface QahwaNativePlugin {
  /** Writes base64 PDF into public Downloads/Qahwa Library via MediaStore. */
  savePdfToDownloads(opts: { base64: string; fileName: string }): Promise<SavePdfResult>;
  /** Checks whether a previously saved URI still exists on the device. */
  fileExists(opts: { uri: string }): Promise<{ exists: boolean; size?: number }>;
  /** Deletes the actual device file. */
  deleteFile(opts: { uri: string }): Promise<{ deleted: boolean }>;
  /** Reads a saved file back as base64 (for in-app offline reading). */
  readFile(opts: { uri: string }): Promise<{ base64: string }>;
  /** Stores widget data as JSON and asks all Qahwa widgets to refresh. */
  updateWidgets(opts: { json: string }): Promise<void>;
}

export const QahwaNative = registerPlugin<QahwaNativePlugin>('QahwaNative');

export const isQahwaNativeAvailable = () =>
  Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('QahwaNative');

/** Deep link scheme used by widgets: qahwa://book/<id>?page=<n>, qahwa://quote/<id>, qahwa://downloads */
export const QAHWA_SCHEME = 'qahwa';
