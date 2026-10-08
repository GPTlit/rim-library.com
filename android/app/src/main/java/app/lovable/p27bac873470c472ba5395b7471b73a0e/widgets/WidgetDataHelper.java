package app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import org.json.JSONArray;
import org.json.JSONObject;

/** Shared helper: reads cached widget JSON payload and resolves cover images from disk cache. */
public class WidgetDataHelper {
    public static final String PREFS = "qahwa_widgets";
    public static final String KEY_JSON = "payload_json";

    public static JSONObject getPayload(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_JSON, null);
        if (json == null) return null;
        try {
            return new JSONObject(json);
        } catch (Exception e) {
            return null;
        }
    }

    private static String hash(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] d = md.digest(s.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return String.valueOf(s.hashCode());
        }
    }

    /** Returns a cached bitmap for a cover URL if previously downloaded by updateWidgets(). */
    public static Bitmap getCachedCover(Context ctx, String url) {
        if (url == null || url.isEmpty()) return null;
        try {
            File dir = new File(ctx.getCacheDir(), "qahwa_widget_covers");
            File f = new File(dir, hash(url) + ".png");
            if (f.exists()) {
                return BitmapFactory.decodeFile(f.getAbsolutePath());
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    /** Downloads and caches cover images referenced in the payload. Call off the main thread. */
    public static void prefetchCovers(Context ctx, JSONObject payload) {
        try {
            File dir = new File(ctx.getCacheDir(), "qahwa_widget_covers");
            if (!dir.exists()) dir.mkdirs();
            java.util.Set<String> urls = new java.util.HashSet<>();
            collectCoverUrl(payload, "dailyBook", urls);
            collectCoverUrl(payload, "continueReading", urls);
            collectCoverUrl(payload, "featured", urls);
            collectArrayCovers(payload.optJSONArray("discover"), urls);
            collectArrayCovers(payload.optJSONArray("collection"), urls);
            for (String url : urls) {
                downloadToCache(dir, url);
            }
        } catch (Exception e) {
            // best-effort
        }
    }

    private static void collectCoverUrl(JSONObject payload, String key, java.util.Set<String> urls) {
        JSONObject obj = payload.optJSONObject(key);
        if (obj != null) {
            String url = obj.optString("coverUrl", null);
            if (url != null && !url.isEmpty()) urls.add(url);
        }
    }

    private static void collectArrayCovers(JSONArray arr, java.util.Set<String> urls) {
        if (arr == null) return;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject obj = arr.optJSONObject(i);
            if (obj != null) {
                String url = obj.optString("coverUrl", null);
                if (url != null && !url.isEmpty()) urls.add(url);
            }
        }
    }

    private static void downloadToCache(File dir, String urlStr) {
        File dest = new File(dir, hash(urlStr) + ".png");
        if (dest.exists()) return;
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            InputStream in = conn.getInputStream();
            Bitmap bmp = BitmapFactory.decodeStream(in);
            in.close();
            if (bmp != null) {
                FileOutputStream out = new FileOutputStream(dest);
                bmp.compress(Bitmap.CompressFormat.PNG, 90, out);
                out.flush();
                out.close();
            }
        } catch (Exception e) {
            // ignore single-image failure
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
