package app.lovable.p27bac873470c472ba5395b7471b73a0e;

import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import com.getcapacitor.JSObject;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;

/** Retains incoming URI grants by copying PDFs into the private bookshelf off the UI thread. */
public final class LocalPdfStore {
    private static final String PREFS = "qahwa_local_pdfs";
    private static final String INDEX = "index";
    private static final String PENDING = "pending";

    static String stableId(String uri) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(uri.getBytes("UTF-8"));
        StringBuilder out = new StringBuilder("local-");
        for (int i = 0; i < 12; i++) out.append(String.format("%02x", hash[i]));
        return out.toString();
    }

    public static void acceptIntent(Context context, Intent intent) {
        if (intent == null) return;
        Uri uri = Intent.ACTION_SEND.equals(intent.getAction())
            ? intent.getParcelableExtra(Intent.EXTRA_STREAM) : intent.getData();
        if (uri == null || !(Intent.ACTION_VIEW.equals(intent.getAction()) || Intent.ACTION_SEND.equals(intent.getAction()))) return;
        if (!("content".equals(uri.getScheme()) || "file".equals(uri.getScheme()))) return;
        String mime = context.getContentResolver().getType(uri);
        if (!"application/pdf".equals(mime) && !"application/pdf".equals(intent.getType())
            && !uri.toString().toLowerCase().endsWith(".pdf")) return;
        new Thread(() -> {
            try {
                JSObject pdf = importPdf(context, uri);
                context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(PENDING, pdf.toString()).apply();
            } catch (Exception ignored) { /* Invalid or unreadable files are not imported. */ }
        }, "qahwa-pdf-import").start();
    }

    public static synchronized JSObject importPdf(Context context, Uri uri) throws Exception {
        String id = stableId(uri.toString());
        String name = "Document.pdf";
        try (Cursor c = context.getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (c != null && c.moveToFirst()) name = c.getString(0);
        } catch (Exception ignored) { }
        if (name == null) name = "Document.pdf";
        File dir = new File(context.getFilesDir(), "external-pdfs");
        dir.mkdirs();
        File destination = new File(dir, id + ".pdf");
        File temporary = new File(dir, id + ".tmp");
        try (InputStream input = "file".equals(uri.getScheme()) ? new FileInputStream(new File(uri.getPath())) : context.getContentResolver().openInputStream(uri);
             FileOutputStream output = new FileOutputStream(temporary)) {
            if (input == null) throw new Exception("Cannot open PDF");
            byte[] signature = new byte[5];
            int count = input.read(signature);
            if (count != 5 || !"%PDF-".equals(new String(signature, "US-ASCII"))) throw new Exception("Invalid PDF");
            output.write(signature);
            byte[] buffer = new byte[65536];
            int n;
            while ((n = input.read(buffer)) != -1) output.write(buffer, 0, n);
        } catch (Exception error) { temporary.delete(); throw error; }
        if (destination.exists()) destination.delete();
        if (!temporary.renameTo(destination)) throw new Exception("Could not retain PDF");
        JSObject pdf = new JSObject();
        pdf.put("id", id);
        pdf.put("title", name.replaceFirst("(?i)\\.pdf$", ""));
        pdf.put("fileName", name);
        pdf.put("uri", Uri.fromFile(destination).toString());
        pdf.put("size", destination.length());
        pdf.put("modifiedAt", java.time.Instant.now().toString());
        JSONArray index = list(context);
        JSONArray next = new JSONArray();
        next.put(pdf);
        for (int i = 0; i < index.length(); i++) {
            JSONObject item = index.optJSONObject(i);
            if (item != null && !id.equals(item.optString("id"))) next.put(item);
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(INDEX, next.toString()).apply();
        return pdf;
    }

    public static synchronized JSONArray list(Context context) {
        try {
            JSONArray raw = new JSONArray(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(INDEX, "[]"));
            JSONArray files = new JSONArray();
            for (int i = 0; i < raw.length(); i++) {
                JSONObject item = raw.getJSONObject(i);
                String path = Uri.parse(item.optString("uri")).getPath();
                if (path != null && new File(path).exists()) files.put(item);
            }
            return files;
        } catch (Exception ignored) { return new JSONArray(); }
    }

    public static JSObject pending(Context context) {
        String value = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(PENDING, null);
        if (value == null) return null;
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(PENDING).apply();
        try { return new JSObject(value); } catch (Exception ignored) { return null; }
    }
}