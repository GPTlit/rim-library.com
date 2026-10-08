package app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.os.Bundle;
import android.widget.RemoteViews;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.R;
import org.json.JSONArray;
import org.json.JSONObject;

/** "My collection" widget: a small grid of recent/offline books, each tappable. */
public class CollectionWidgetProvider extends BaseQahwaWidgetProvider {
    private static final int SMALL_WIDTH_THRESHOLD_DP = 180;
    private static final int[] LARGE_COVER_IDS = { R.id.cover1, R.id.cover2, R.id.cover3, R.id.cover4 };
    private static final int[] SMALL_COVER_IDS = { R.id.cover1, R.id.cover2 };

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
        JSONArray collection = payload != null ? payload.optJSONArray("collection") : null;

        if (collection == null || collection.length() == 0) {
            RemoteViews empty = new RemoteViews(ctx.getPackageName(), R.layout.widget_empty);
            empty.setOnClickPendingIntent(R.id.empty_text, openAppPendingIntent(ctx, appWidgetId));
            push(ctx, mgr, appWidgetId, empty);
            return;
        }

        int widthDp = minWidthDp(mgr, appWidgetId);
        boolean small = widthDp > 0 && widthDp < SMALL_WIDTH_THRESHOLD_DP;
        int layout = small ? R.layout.widget_collection_small : R.layout.widget_collection;
        int[] coverIds = small ? SMALL_COVER_IDS : LARGE_COVER_IDS;

        RemoteViews views = new RemoteViews(ctx.getPackageName(), layout);
        for (int i = 0; i < coverIds.length; i++) {
            JSONObject book = collection.optJSONObject(i);
            if (book == null) continue;
            setCover(ctx, views, coverIds[i], book.optString("coverUrl", null));
            views.setOnClickPendingIntent(
                coverIds[i],
                deepLinkPendingIntent(ctx, bookDeepLink(book.optString("id", "")), appWidgetId * 10 + i)
            );
        }
        push(ctx, mgr, appWidgetId, views);
    }

    public static void requestUpdate(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = widgetIds(ctx, CollectionWidgetProvider.class);
        if (ids.length == 0) return;
        new CollectionWidgetProvider().onUpdate(ctx, mgr, ids);
    }
}
