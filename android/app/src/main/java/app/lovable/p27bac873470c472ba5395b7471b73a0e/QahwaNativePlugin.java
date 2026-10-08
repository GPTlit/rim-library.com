package app.lovable.p27bac873470c472ba5395b7471b73a0e;

import android.Manifest;
import android.app.RecoverableSecurityException;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets.WidgetDataHelper;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets.DailyBookWidgetProvider;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets.ContinueReadingWidgetProvider;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets.DiscoverWidgetProvider;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets.CollectionWidgetProvider;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets.MinimalWidgetProvider;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets.QuoteWidgetProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "QahwaNative",
    permissions = {
        @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "storage")
    }
)
public class QahwaNativePlugin extends Plugin {
    private static final String TAG = "QahwaNative";
    private static final String TARGET_DIR = "Qahwa Library";

    @PluginMethod
    public void savePdfToDownloads(PluginCall call) {
        String base64 = call.getString("base64");
        String fileName = call.getString("fileName");
        if (base64 == null || fileName == null) {
            call.reject("base64 and fileName are required");
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
                && getPermissionState("storage") != com.getcapacitor.PermissionState.GRANTED) {
            call.setKeepAlive(true);
            requestPermissionForAlias("storage", call, "savePdfCallback");
            return;
        }
        doSavePdf(call, base64, fileName);
    }

    @PermissionCallback
    private void savePdfCallback(PluginCall call) {
        String base64 = call.getString("base64");
        String fileName = call.getString("fileName");
        doSavePdf(call, base64, fileName);
    }

    private void doSavePdf(PluginCall call, String base64, String fileName) {
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            String baseName = fileName.contains(".") ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
            String ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf('.')) : ".pdf";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                String uniqueName = fileName;
                int n = 1;
                while (existsInMediaStore(resolver, uniqueName)) {
                    uniqueName = baseName + " (" + n + ")" + ext;
                    n++;
                }
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, uniqueName);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + TARGET_DIR);
                Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                Uri itemUri = resolver.insert(collection, values);
                if (itemUri == null) {
                    call.reject("Failed to create MediaStore entry");
                    return;
                }
                OutputStream out = resolver.openOutputStream(itemUri);
                if (out == null) {
                    call.reject("Failed to open output stream");
                    return;
                }
                out.write(bytes);
                out.flush();
                out.close();

                JSObject ret = new JSObject();
                ret.put("uri", itemUri.toString());
                ret.put("fileName", uniqueName);
                ret.put("size", bytes.length);
                call.resolve(ret);
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File targetDir = new File(downloadsDir, TARGET_DIR);
                if (!targetDir.exists()) targetDir.mkdirs();

                String uniqueName = fileName;
                File dest = new File(targetDir, uniqueName);
                int n = 1;
                while (dest.exists()) {
                    uniqueName = baseName + " (" + n + ")" + ext;
                    dest = new File(targetDir, uniqueName);
                    n++;
                }
                FileOutputStream out = new FileOutputStream(dest);
                out.write(bytes);
                out.flush();
                out.close();

                MediaScannerConnection.scanFile(
                    getContext(),
                    new String[] { dest.getAbsolutePath() },
                    new String[] { "application/pdf" },
                    null
                );

                JSObject ret = new JSObject();
                ret.put("uri", Uri.fromFile(dest).toString());
                ret.put("fileName", uniqueName);
                ret.put("size", bytes.length);
                call.resolve(ret);
            }
        } catch (Exception e) {
            Log.e(TAG, "savePdfToDownloads failed", e);
            call.reject("savePdfToDownloads failed: " + e.getMessage(), e);
        }
    }

    private boolean existsInMediaStore(ContentResolver resolver, String displayName) {
        Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
        String[] projection = { MediaStore.Downloads._ID };
        String selection = MediaStore.Downloads.DISPLAY_NAME + "=? AND " + MediaStore.Downloads.RELATIVE_PATH + "=?";
        String[] args = { displayName, Environment.DIRECTORY_DOWNLOADS + "/" + TARGET_DIR + "/" };
        try (Cursor c = resolver.query(collection, projection, selection, args, null)) {
            return c != null && c.getCount() > 0;
        } catch (Exception e) {
            return false;
        }
    }

    @PluginMethod
    public void fileExists(PluginCall call) {
        String uriStr = call.getString("uri");
        if (uriStr == null) {
            call.reject("uri is required");
            return;
        }
        try {
            Uri uri = Uri.parse(uriStr);
            if ("content".equals(uri.getScheme())) {
                ContentResolver resolver = getContext().getContentResolver();
                try (Cursor c = resolver.query(uri, new String[] { MediaStore.Downloads.SIZE }, null, null, null)) {
                    if (c != null && c.moveToFirst()) {
                        JSObject ret = new JSObject();
                        ret.put("exists", true);
                        ret.put("size", c.getLong(0));
                        call.resolve(ret);
                        return;
                    }
                }
                JSObject ret = new JSObject();
                ret.put("exists", false);
                call.resolve(ret);
            } else {
                File f = new File(uri.getPath());
                JSObject ret = new JSObject();
                ret.put("exists", f.exists());
                if (f.exists()) ret.put("size", f.length());
                call.resolve(ret);
            }
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("exists", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void deleteFile(PluginCall call) {
        String uriStr = call.getString("uri");
        if (uriStr == null) {
            call.reject("uri is required");
            return;
        }
        try {
            Uri uri = Uri.parse(uriStr);
            if ("content".equals(uri.getScheme())) {
                try {
                    int rows = getContext().getContentResolver().delete(uri, null, null);
                    JSObject ret = new JSObject();
                    ret.put("deleted", rows > 0);
                    call.resolve(ret);
                } catch (SecurityException se) {
                    Log.w(TAG, "deleteFile needs user consent (RecoverableSecurityException)", se);
                    JSObject ret = new JSObject();
                    ret.put("deleted", false);
                    call.resolve(ret);
                }
            } else {
                File f = new File(uri.getPath());
                boolean ok = f.exists() && f.delete();
                JSObject ret = new JSObject();
                ret.put("deleted", ok);
                call.resolve(ret);
            }
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("deleted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void readFile(PluginCall call) {
        String uriStr = call.getString("uri");
        if (uriStr == null) {
            call.reject("uri is required");
            return;
        }
        try {
            Uri uri = Uri.parse(uriStr);
            InputStream in;
            if ("content".equals(uri.getScheme())) {
                in = getContext().getContentResolver().openInputStream(uri);
            } else {
                in = new FileInputStream(new File(uri.getPath()));
            }
            if (in == null) {
                call.reject("Unable to open file");
                return;
            }
            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) bos.write(buf, 0, n);
            in.close();
            String b64 = Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP);
            JSObject ret = new JSObject();
            ret.put("base64", b64);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("readFile failed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void updateWidgets(PluginCall call) {
        String json = call.getString("json");
        if (json == null) {
            call.reject("json is required");
            return;
        }
        Context ctx = getContext().getApplicationContext();
        ctx.getSharedPreferences(WidgetDataHelper.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(WidgetDataHelper.KEY_JSON, json)
            .apply();

        new Thread(() -> {
            try {
                org.json.JSONObject payload = new org.json.JSONObject(json);
                WidgetDataHelper.prefetchCovers(ctx, payload);
            } catch (Exception e) {
                Log.w(TAG, "prefetch covers failed", e);
            }
            DailyBookWidgetProvider.requestUpdate(ctx);
            ContinueReadingWidgetProvider.requestUpdate(ctx);
            DiscoverWidgetProvider.requestUpdate(ctx);
            CollectionWidgetProvider.requestUpdate(ctx);
            MinimalWidgetProvider.requestUpdate(ctx);
            QuoteWidgetProvider.requestUpdate(ctx);
        }).start();

        call.resolve();
    }
}
