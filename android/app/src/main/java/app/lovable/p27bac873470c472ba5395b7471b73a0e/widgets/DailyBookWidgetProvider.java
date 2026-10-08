package app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.R;
import org.json.JSONObject;

/** "Book of the day" widget: shows the curated daily pick with cover and message. */
public class DailyBookWidgetProvider extends BaseQahwaWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            update(context, appWidgetManager, id);
        }
    }

    private void update(Context ctx, AppWidgetManager mgr, int appWidgetId) {
        JSONObject payload = readPayload(ctx);
        JSONObject dailyBook = payload != null ? payload.optJSONObject("dailyBook") : null;

        if (dailyBook == null) {
            RemoteViews empty = new RemoteViews(ctx.getPackageName(), R.layout.widget_empty);
            empty.setOnClickPendingIntent(R.id.empty_text, openAppPendingIntent(ctx, appWidgetId));
            push(ctx, mgr, appWidgetId, empty);
            return;
        }

        String bookId = dailyBook.optString("id", "");
        RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_daily_book);
        views.setTextViewText(R.id.title, dailyBook.optString("title", ""));
        views.setTextViewText(R.id.author, dailyBook.optString("author", ""));
        views.setTextViewText(R.id.message, dailyBook.optString("message", ""));
        setCover(ctx, views, R.id.cover, dailyBook.optString("coverUrl", null));
        views.setOnClickPendingIntent(
            R.id.widget_root,
            deepLinkPendingIntent(ctx, bookDeepLink(bookId), appWidgetId)
        );
        push(ctx, mgr, appWidgetId, views);
    }

    /** Triggered by QahwaNativePlugin after a fresh widget payload has been cached. */
    public static void requestUpdate(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = widgetIds(ctx, DailyBookWidgetProvider.class);
        if (ids.length == 0) return;
        new DailyBookWidgetProvider().onUpdate(ctx, mgr, ids);
    }
}
