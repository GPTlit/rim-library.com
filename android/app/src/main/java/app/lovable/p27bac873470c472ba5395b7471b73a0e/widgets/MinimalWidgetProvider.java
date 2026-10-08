package app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.R;
import org.json.JSONObject;

/** Minimal 1-row widget: logo, title of the current/featured book and a quick "read" button. */
public class MinimalWidgetProvider extends BaseQahwaWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            update(context, appWidgetManager, id);
        }
    }

    private void update(Context ctx, AppWidgetManager mgr, int appWidgetId) {
        JSONObject payload = readPayload(ctx);
        JSONObject book = payload != null ? payload.optJSONObject("continueReading") : null;
        if (book == null && payload != null) book = payload.optJSONObject("dailyBook");
        if (book == null && payload != null) book = payload.optJSONObject("featured");

        RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_minimal);
        if (book == null) {
            views.setTextViewText(R.id.title, ctx.getString(R.string.app_name));
            views.setOnClickPendingIntent(R.id.widget_root, openAppPendingIntent(ctx, appWidgetId));
            views.setOnClickPendingIntent(R.id.read_button, openAppPendingIntent(ctx, appWidgetId));
        } else {
            String bookId = book.optString("id", "");
            views.setTextViewText(R.id.title, book.optString("title", ""));
            views.setOnClickPendingIntent(
                R.id.widget_root,
                deepLinkPendingIntent(ctx, bookDeepLink(bookId), appWidgetId)
            );
            views.setOnClickPendingIntent(
                R.id.read_button,
                deepLinkPendingIntent(ctx, bookDeepLink(bookId), appWidgetId * 10 + 1)
            );
        }
        push(ctx, mgr, appWidgetId, views);
    }

    public static void requestUpdate(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = widgetIds(ctx, MinimalWidgetProvider.class);
        if (ids.length == 0) return;
        new MinimalWidgetProvider().onUpdate(ctx, mgr, ids);
    }
}
