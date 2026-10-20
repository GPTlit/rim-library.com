package app.lovable.p27bac873470c472ba5395b7471b73a0e.widgets

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.LinearProgressIndicator
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.updateAll
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.work.*
import app.lovable.p27bac873470c472ba5395b7471b73a0e.MainActivity
import app.lovable.p27bac873470c472ba5395b7471b73a0e.R
import org.json.JSONObject
import java.time.Instant
import java.time.ZonedDateTime
import java.util.concurrent.TimeUnit
import kotlin.math.max
import kotlin.math.min

/** Seven real Glance widgets; providers read cached shared state without network calls. */
open class QahwaGlanceWidget(private val kind: String = "resume") : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val data = WidgetDataHelper.getPayload(context) ?: JSONObject()
        val now = ZonedDateTime.now()
        val language = data.optString("language", "ar")
        val ar = language == "ar"
        val fr = language == "fr"
        fun label(a: String, e: String, f: String) = if (ar) a else if (fr) f else e
        val lastRead = try { Instant.parse(data.optString("lastReadAt")).toEpochMilli() } catch (_: Exception) { 0L }
        val age = if (lastRead > 0) System.currentTimeMillis() - lastRead else 0L
        val progress = data.optInt("progress", 1).coerceIn(1, 100)
        val state = when {
            progress >= 100 && lastRead > 0 && age < 86400000L -> "celebrating"
            lastRead > 0 && age >= 86400000L -> "angry"
            now.hour < 6 || now.hour >= 22 -> "sleeping"
            lastRead > 0 && age < 300000L -> "reading"
            now.hour in 7..9 -> "drinking"
            else -> "idle"
        }
        // WorkManager's >=15-minute scheduling is best effort; never wake the phone for frames.
        val frame = (System.currentTimeMillis() / 900000L % 12).toInt()
        val mascotId = context.resources.getIdentifier("mascot_${state}_${frame.toString().padStart(2, '0')}", "drawable", context.packageName)
        val discover = data.optJSONArray("discover")
        val collection = data.optJSONArray("collection")
        val book = when (kind) {
            "daily" -> data.optJSONObject("dailyBook")
            "discover" -> if (discover != null && discover.length() > 0) discover.optJSONObject(now.dayOfYear % discover.length()) else null
            "collection" -> collection?.optJSONObject(0)
            else -> data.optJSONObject("continueReading")
        }
        val quote = data.optJSONObject("quote")
        val title = when (kind) {
            "daily" -> label("كتاب اليوم", "Daily Book", "Livre du jour")
            "discover" -> label("اكتشف", "Discover", "Découvrir")
            "collection" -> label("مكتبتي", "My Collection", "Ma collection")
            "quote" -> label("اقتباس اليوم", "Quote of the Day", "Citation du jour")
            "streak" -> label("وقت القراءة", "Reading Time", "Temps de lecture")
            "minimal" -> "QAHWA"
            else -> label("متابعة القراءة", "Continue Reading", "Reprendre la lecture")
        }
        val subtitle = when (kind) {
            "quote" -> quote?.optString("text")?.take(160)
            "streak" -> {
                val remaining = max(0L, 86400000L - age) / 3600000L
                if (lastRead == 0L) label("صفحة واحدة بداية جميلة", "One page is a good start", "Une page, un bon début")
                else if (remaining == 0L) label("حان وقت العودة لكتابك", "Your book is waiting", "Votre livre vous attend")
                else label("${remaining} ساعة للقراءة اليوم", "${remaining}h left to read today", "${remaining}h pour lire aujourd’hui")
            }
            "collection" -> label("${collection?.length() ?: 0} كتاب", "${collection?.length() ?: 0} books", "${collection?.length() ?: 0} livres")
            else -> book?.optString("title")
        }.orEmpty().ifBlank { label("كتابك ينتظرك", "Your next chapter awaits", "Votre prochain chapitre vous attend") }
        val bookId = book?.optString("id").orEmpty()
        val page = book?.optInt("page", 1) ?: 1
        val url = when {
            kind == "collection" -> "qahwa://downloads"
            kind == "quote" && quote != null -> "qahwa://quote/${quote.optString("id") }"
            bookId.isNotBlank() && (kind == "resume" || kind == "minimal" || kind == "streak") -> "qahwa://read/$bookId?page=$page"
            bookId.isNotBlank() -> "qahwa://book/$bookId"
            else -> "qahwa://downloads"
        }
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url), context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val background = if (now.hour < 7 || now.hour >= 19) R.drawable.widget_night else R.drawable.widget_day
        provideContent {
            Column(GlanceModifier.fillMaxSize().background(ImageProvider(background)).padding(12.dp).clickable(actionStartActivity(intent))) {
                Row(GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.Vertical.CenterVertically) {
                    Column(GlanceModifier.defaultWeight()) {
                        Text(title, style = TextStyle(color = ColorProvider(R.color.qahwa_cream), fontSize = 14.sp), maxLines = 1)
                        Spacer(GlanceModifier.height(5.dp))
                        Text(subtitle, style = TextStyle(color = ColorProvider(R.color.qahwa_latte), fontSize = 12.sp), maxLines = 3)
                    }
                    if (mascotId != 0) Image(ImageProvider(mascotId), contentDescription = state,
                        modifier = GlanceModifier.size(if (kind == "minimal") 42.dp else 64.dp))
                }
                if (kind == "resume" && bookId.isNotBlank()) {
                    Spacer(GlanceModifier.height(8.dp))
                    LinearProgressIndicator(progress = progress / 100f, modifier = GlanceModifier.fillMaxWidth(),
                        color = ColorProvider(R.color.qahwa_latte), backgroundColor = ColorProvider(R.color.qahwa_espresso))
                    Text("$progress% · $page / ${book?.optInt("totalPages", 0)}", style = TextStyle(color = ColorProvider(R.color.qahwa_cream), fontSize = 11.sp))
                }
                if (kind == "streak") Text("${data.optInt("readingSeconds", 0) / 60} min", style = TextStyle(color = ColorProvider(R.color.qahwa_cream), fontSize = 12.sp))
            }
        }
    }
}

class ResumeWidget : QahwaGlanceWidget("resume")
class DailyWidget : QahwaGlanceWidget("daily")
class DiscoverWidget : QahwaGlanceWidget("discover")
class CollectionWidget : QahwaGlanceWidget("collection")
class QuoteWidget : QahwaGlanceWidget("quote")
class StreakWidget : QahwaGlanceWidget("streak")
class MinimalWidget : QahwaGlanceWidget("minimal")
abstract class QahwaGlanceReceiver : GlanceAppWidgetReceiver() {
    override fun onEnabled(context: Context) { super.onEnabled(context); QahwaWidgetRefresh.schedule(context) }
}
class ResumeGlanceReceiver : QahwaGlanceReceiver() { override val glanceAppWidget = ResumeWidget() }
class DailyGlanceReceiver : QahwaGlanceReceiver() { override val glanceAppWidget = DailyWidget() }
class DiscoverGlanceReceiver : QahwaGlanceReceiver() { override val glanceAppWidget = DiscoverWidget() }
class CollectionGlanceReceiver : QahwaGlanceReceiver() { override val glanceAppWidget = CollectionWidget() }
class QuoteGlanceReceiver : QahwaGlanceReceiver() { override val glanceAppWidget = QuoteWidget() }
class StreakGlanceReceiver : QahwaGlanceReceiver() { override val glanceAppWidget = StreakWidget() }
class MinimalGlanceReceiver : QahwaGlanceReceiver() { override val glanceAppWidget = MinimalWidget() }

class QahwaWidgetRefresh(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        for (widget in listOf(ResumeWidget(), DailyWidget(), DiscoverWidget(), CollectionWidget(), QuoteWidget(), StreakWidget(), MinimalWidget())) widget.updateAll(applicationContext)
        return Result.success()
    }
    companion object {
        @JvmStatic fun enqueue(context: Context) {
            WorkManager.getInstance(context).enqueueUniqueWork("qahwa-widget-refresh", ExistingWorkPolicy.REPLACE,
                OneTimeWorkRequestBuilder<QahwaWidgetRefresh>().build())
            schedule(context)
        }
        @JvmStatic fun schedule(context: Context) {
            WorkManager.getInstance(context).enqueueUniquePeriodicWork("qahwa-widget-timeline", ExistingPeriodicWorkPolicy.KEEP,
                PeriodicWorkRequestBuilder<QahwaWidgetRefresh>(15, TimeUnit.MINUTES).build())
        }
    }
}