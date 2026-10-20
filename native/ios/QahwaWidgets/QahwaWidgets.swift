import WidgetKit
import SwiftUI

enum QahwaShared {
    static let suite = "group.app.lovable.qahwa"
    static let key = "qahwa_widget_payload"
    static func payload() -> [String: Any] {
        guard let raw = UserDefaults(suiteName: suite)?.string(forKey: key),
              let data = raw.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return [:] }
        return json
    }
}

struct QahwaEntry: TimelineEntry {
    let date: Date
    let payload: [String: Any]
    let frame: Int
}

struct QahwaTimeline: TimelineProvider {
    func placeholder(in context: Context) -> QahwaEntry { QahwaEntry(date: Date(), payload: [:], frame: 0) }
    func getSnapshot(in context: Context, completion: @escaping (QahwaEntry) -> Void) {
        completion(QahwaEntry(date: Date(), payload: QahwaShared.payload(), frame: 0))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<QahwaEntry>) -> Void) {
        let now = Date()
        let payload = QahwaShared.payload()
        // Twelve static frames over one hour; WidgetKit decides the actual refresh cadence.
        let entries = (0..<12).map { i in QahwaEntry(date: now.addingTimeInterval(Double(i) * 300), payload: payload, frame: i) }
        completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(3600))))
    }
}

struct QahwaWidgetView: View {
    let entry: QahwaEntry
    let kind: String
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme
    var language: String { entry.payload["language"] as? String ?? "ar" }
    func label(_ ar: String, _ en: String, _ fr: String) -> String { language == "ar" ? ar : language == "fr" ? fr : en }
    var progress: Int { min(100, max(1, entry.payload["progress"] as? Int ?? 1)) }
    var lastRead: Date? { ISO8601DateFormatter().date(from: entry.payload["lastReadAt"] as? String ?? "") }
    var state: String {
        let hour = Calendar.current.component(.hour, from: entry.date)
        let age = lastRead.map { entry.date.timeIntervalSince($0) }
        if progress == 100, let age = age, age < 86400 { return "celebrating" }
        if let age = age, age >= 86400 { return "angry" }
        if hour < 6 || hour >= 22 { return "sleeping" }
        if let age = age, age < 300 { return "reading" }
        if (7..<10).contains(hour) { return "drinking" }
        return "idle"
    }
    var title: String {
        switch kind {
        case "daily": return label("كتاب اليوم", "Daily Book", "Livre du jour")
        case "discover": return label("اكتشف", "Discover", "Découvrir")
        case "collection": return label("مكتبتي", "My Collection", "Ma collection")
        case "quote": return label("اقتباس اليوم", "Quote of the Day", "Citation du jour")
        case "streak": return label("وقت القراءة", "Reading Time", "Temps de lecture")
        case "minimal": return "QAHWA"
        default: return label("متابعة القراءة", "Continue Reading", "Reprendre la lecture")
        }
    }
    var book: [String: Any] {
        switch kind {
        case "daily": return entry.payload["dailyBook"] as? [String: Any] ?? [:]
        case "discover":
            let books = entry.payload["discover"] as? [[String: Any]] ?? []
            return books.isEmpty ? [:] : books[Calendar.current.ordinality(of: .day, in: .year, for: entry.date).map { $0 % books.count } ?? 0]
        case "collection": return (entry.payload["collection"] as? [[String: Any]])?.first ?? [:]
        default: return entry.payload["continueReading"] as? [String: Any] ?? [:]
        }
    }
    var subtitle: String {
        if kind == "quote" { return (entry.payload["quote"] as? [String: Any])?["text"] as? String ?? label("كتابك ينتظرك", "Your book awaits", "Votre livre vous attend") }
        if kind == "streak" {
            guard let last = lastRead else { return label("صفحة واحدة بداية جميلة", "One page is a good start", "Une page, un bon début") }
            let hours = max(0, Int((86400 - entry.date.timeIntervalSince(last)) / 3600))
            return hours == 0 ? label("حان وقت العودة لكتابك", "Your book is waiting", "Votre livre vous attend") : "\(hours)h"
        }
        if kind == "collection" { return "\((entry.payload["collection"] as? [[String: Any]])?.count ?? 0) " + label("كتاب", "books", "livres") }
        return book["title"] as? String ?? label("كتابك ينتظرك", "Your next chapter awaits", "Votre prochain chapitre vous attend")
    }
    var deepLink: URL? {
        if kind == "quote", let quote = entry.payload["quote"] as? [String: Any], let id = quote["id"] as? String { return URL(string: "qahwa://quote/\(id)") }
        guard kind != "collection", let id = book["id"] as? String else { return URL(string: "qahwa://downloads") }
        if ["resume", "minimal", "streak"].contains(kind) { return URL(string: "qahwa://read/\(id)?page=\(book["page"] as? Int ?? 1)") }
        return URL(string: "qahwa://book/\(id)")
    }
    var background: some View {
        let hour = Calendar.current.component(.hour, from: entry.date)
        return LinearGradient(colors: [Color(hour < 7 || hour >= 19 || colorScheme == .dark ? "WidgetNight" : "WidgetDay"), Color("WidgetCoffee")], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    Text(title).font(.headline).lineLimit(1)
                    Text(subtitle).font(.caption).lineLimit(family == .systemLarge ? 6 : 3)
                }
                Spacer(minLength: 0)
                Image("mascot_\(state)_\(String(format: "%02d", entry.frame))").resizable().scaledToFit().frame(width: family == .systemSmall ? 45 : 72, height: 72)
            }
            if kind == "resume", book["id"] != nil {
                ProgressView(value: Double(progress), total: 100).tint(Color("WidgetLatte"))
                Text("\(progress)% · \(book["page"] as? Int ?? 1) / \(book["totalPages"] as? Int ?? 0)").font(.caption2)
            }
            if kind == "streak" { Text("\((entry.payload["readingSeconds"] as? Int ?? 0) / 60) min").font(.caption) }
        }
        .foregroundStyle(Color("WidgetText"))
        .widgetURL(deepLink)
        .containerBackground(for: .widget) { background }
    }
}

struct QahwaWidget: Widget {
    let kind: String
    let name: String
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "qahwa.\(kind)", provider: QahwaTimeline()) { entry in QahwaWidgetView(entry: entry, kind: kind) }
            .configurationDisplayName(name).description("Qahwa Library")
            .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

@main struct QahwaWidgets: WidgetBundle {
    var body: some Widget {
        QahwaWidget(kind: "resume", name: "Continue Reading")
        QahwaWidget(kind: "daily", name: "Daily Book")
        QahwaWidget(kind: "discover", name: "Discover")
        QahwaWidget(kind: "collection", name: "My Collection")
        QahwaWidget(kind: "quote", name: "Quote of the Day")
        QahwaWidget(kind: "streak", name: "Reading Time")
        QahwaWidget(kind: "minimal", name: "Minimal Qahwa")
    }
}