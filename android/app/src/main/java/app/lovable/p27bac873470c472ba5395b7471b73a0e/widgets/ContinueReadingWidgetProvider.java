package app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.widget.RemoteViews;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.R;
import org.json.JSONObject;

/** "Continue reading" widget: current progress with a resume deep link to the exact page. */
public class ContinueReadingWidgetProvider extends BaseQahwaWidgetProvider {
    private static final int SMALL_WIDTH_THRESHOLD_DP = 180;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            update(context, appWidgetManager, id);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(
        Context context,
        AppWidgetManager appWidgetManager,
        int appWidgetId,
        Bundle newOptions
    ) {
        update(context, appWidgetManager, appWidgetId);
    }

    private void update(Context ctx, AppWidgetManager mgr, int appWidgetId) {
        JSONObject payload = readPayload(ctx);
        JSONObject book = payload != null ? payload.optJSONObject("continueReading") : null;

        if (book == null) {
            RemoteViews empty = new RemoteViews(ctx.getPackageName(), R.layout.widget_empty);
            empty.setOnClickPendingIntent(R.id.empty_text, openAppPendingIntent(ctx, appWidgetId));
            push(ctx, mgr, appWidgetId, empty);
            return;
        }

        String bookId = book.optString("id", "");
        int page = book.optInt("page", 0);
        int totalPages = book.optInt("totalPages", 0);
        boolean small = minWidthDp(mgr, appWidgetId) < SMALL_WIDTH_THRESHOLD_DP && minWidthDp(mgr, appWidgetId) > 0;

        int layout = small ? R.layout.widget_continue_reading_small : R.layout.widget_continue_reading;
        RemoteViews views = new RemoteViews(ctx.getPackageName(), layout);
        views.setTextViewText(R.id.title, book.optString("title", ""));
        String pageText = totalPages > 0 ? (page + " / " + totalPages) : String.valueOf(page);
        views.setTextViewText(R.id.page_text, pageText);

        if (!small) {
            setCover(ctx, views, R.id.cover, book.optString("coverUrl", null));
            if (totalPages > 0 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                int percent = Math.max(0, Math.min(100, (page * 100) / Math.max(1, totalPages)));
                int widthDp = 4 + (percent * 150 / 100); // 4..154dp within the ~160dp track
                views.setViewLayoutWidth(R.id.progress_fill, widthDp, android.util.TypedValue.COMPLEX_UNIT_DIP);
            }
        }

        views.setOnClickPendingIntent(
            R.id.widget_root,
            deepLinkPendingIntent(ctx, bookDeepLinkWithPage(bookId, page), appWidgetId)
        );
        push(ctx, mgr, appWidgetId, views);
    }

    public static void requestUpdate(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = widgetIds(ctx, ContinueReadingWidgetProvider.class);
        if (ids.length == 0) return;
        new ContinueReadingWidgetProvider().onUpdate(ctx, mgr, ids);
    }
}
