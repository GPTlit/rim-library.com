package app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.widget.RemoteViews;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.MainActivity;
import org.json.JSONObject;

/** Shared helpers for all Qahwa home-screen widgets (RemoteViews, deep links, cover art). */
abstract class BaseQahwaWidgetProvider extends AppWidgetProvider {

    /** Reads the cached payload; returns null if nothing has been synced yet. */
    static JSONObject readPayload(Context ctx) {
        return WidgetDataHelper.getPayload(ctx);
    }

    static boolean isSignedIn(JSONObject payload) {
        return payload != null && payload.optBoolean("signedIn", false);
    }

    /** Builds a PendingIntent that opens MainActivity via the qahwa:// deep link scheme. */
    static PendingIntent deepLinkPendingIntent(Context ctx, String uri, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri), ctx, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(
            ctx,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    /** Builds a PendingIntent that simply launches the app (used for empty/signed-out widgets). */
    static PendingIntent openAppPendingIntent(Context ctx, int requestCode) {
        Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (launch == null) {
            launch = new Intent(ctx, MainActivity.class);
        }
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
            ctx,
            requestCode,
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    static String bookDeepLink(String bookId) {
        return "qahwa://book/" + bookId;
    }

    static String bookDeepLinkWithPage(String bookId, int page) {
        return "qahwa://book/" + bookId + "?page=" + page;
    }

    static String quoteDeepLink(String quoteId) {
        return "qahwa://quote/" + quoteId;
    }

    static final String DOWNLOADS_DEEP_LINK = "qahwa://downloads";

    /** Applies a cached cover bitmap to an ImageView, if one has been prefetched. */
    static void setCover(Context ctx, RemoteViews views, int imageViewId, String coverUrl) {
        Bitmap bmp = WidgetDataHelper.getCachedCover(ctx, coverUrl);
        if (bmp != null) {
            views.setImageViewBitmap(imageViewId, bmp);
        }
    }

    /** Pushes a RemoteViews update to a single widget instance. */
    static void push(Context ctx, AppWidgetManager mgr, int appWidgetId, RemoteViews views) {
        mgr.updateAppWidget(appWidgetId, views);
    }

    /** Re-renders every instance of a given widget provider; safe to call from any thread. */
    static int[] widgetIds(Context ctx, Class<?> providerClass) {
        ComponentName component = new ComponentName(ctx, providerClass);
        return AppWidgetManager.getInstance(ctx).getAppWidgetIds(component);
    }

    /** Width (dp) reported by the launcher for a given widget instance; 0 if unknown. */
    static int minWidthDp(AppWidgetManager mgr, int appWidgetId) {
        android.os.Bundle options = mgr.getAppWidgetOptions(appWidgetId);
        if (options == null) return 0;
        return options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
    }
}
