package app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.R;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

/** "Discover" widget: rotates through a curated list, one pick per day-of-year. */
public class DiscoverWidgetProvider extends BaseQahwaWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            update(context, appWidgetManager, id);
        }
    }

    private void update(Context ctx, AppWidgetManager mgr, int appWidgetId) {
        JSONObject payload = readPayload(ctx);
        JSONArray discover = payload != null ? payload.optJSONArray("discover") : null;

        if (!isSignedIn(payload) || discover == null || discover.length() == 0) {
            RemoteViews empty = new RemoteViews(ctx.getPackageName(), R.layout.widget_empty);
            empty.setOnClickPendingIntent(R.id.empty_text, openAppPendingIntent(ctx, appWidgetId));
            push(ctx, mgr, appWidgetId, empty);
            return;
        }

        int dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
        int index = dayOfYear % discover.length();
        JSONObject book = discover.optJSONObject(index);
        if (book == null) book = discover.optJSONObject(0);

        String bookId = book.optString("id", "");
        RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_discover);
        views.setTextViewText(R.id.title, book.optString("title", ""));
        views.setTextViewText(R.id.author, book.optString("author", ""));
        views.setTextViewText(R.id.description, book.optString("description", ""));
        setCover(ctx, views, R.id.cover, book.optString("coverUrl", null));
        views.setOnClickPendingIntent(
            R.id.widget_root,
            deepLinkPendingIntent(ctx, bookDeepLink(bookId), appWidgetId)
        );
        push(ctx, mgr, appWidgetId, views);
    }

    public static void requestUpdate(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = widgetIds(ctx, DiscoverWidgetProvider.class);
        if (ids.length == 0) return;
        new DiscoverWidgetProvider().onUpdate(ctx, mgr, ids);
    }
}
