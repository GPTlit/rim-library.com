package app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;
import app.lovable.p27bac873470c472ba5395b7471b73a0e.R;
import org.json.JSONObject;

/** Quote widget: shows a rotating quote; tapping opens the source book at the quoted location. */
public class QuoteWidgetProvider extends BaseQahwaWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            update(context, appWidgetManager, id);
        }
    }

    private void update(Context ctx, AppWidgetManager mgr, int appWidgetId) {
        JSONObject payload = readPayload(ctx);
        JSONObject quote = payload != null ? payload.optJSONObject("quote") : null;

        if (quote == null) {
            RemoteViews empty = new RemoteViews(ctx.getPackageName(), R.layout.widget_empty);
            empty.setOnClickPendingIntent(R.id.empty_text, openAppPendingIntent(ctx, appWidgetId));
            push(ctx, mgr, appWidgetId, empty);
            return;
        }

        String quoteId = quote.optString("id", "");
        String bookTitle = quote.optString("bookTitle", "");
        String author = quote.optString("author", "");
        String source = author != null && !author.isEmpty() ? bookTitle + " — " + author : bookTitle;

        RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_quote);
        views.setTextViewText(R.id.quote_text, quote.optString("text", ""));
        views.setTextViewText(R.id.quote_source, source);
        views.setOnClickPendingIntent(
            R.id.widget_root,
            deepLinkPendingIntent(ctx, quoteDeepLink(quoteId), appWidgetId)
        );
        push(ctx, mgr, appWidgetId, views);
    }

    public static void requestUpdate(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = widgetIds(ctx, QuoteWidgetProvider.class);
        if (ids.length == 0) return;
        new QuoteWidgetProvider().onUpdate(ctx, mgr, ids);
    }
}
