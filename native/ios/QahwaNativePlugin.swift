import Capacitor
import WidgetKit

/** Add this bridged plugin to the Capacitor app target, not the widget extension. */
@objc(QahwaNativePlugin)
public class QahwaNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "QahwaNativePlugin"
    public let jsName = "QahwaNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateWidgets", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listDevicePdfs", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPendingPdf", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getReadablePdf", returnType: CAPPluginReturnPromise)
    ]
    @objc func updateWidgets(_ call: CAPPluginCall) {
        guard let json = call.getString("json"), let defaults = UserDefaults(suiteName: "group.app.lovable.qahwa") else { call.reject("App Group is not configured"); return }
        defaults.set(json, forKey: "qahwa_widget_payload")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
    @objc func getPendingPdf(_ call: CAPPluginCall) { call.resolve() }
    @objc func listDevicePdfs(_ call: CAPPluginCall) {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
        let files = documents.flatMap { FileManager.default.enumerator(at: $0, includingPropertiesForKeys: [.fileSizeKey, .contentModificationDateKey]) }
        var entries: [[String: Any]] = []
        while let url = files?.nextObject() as? URL {
            guard url.pathExtension.lowercased() == "pdf" else { continue }
            let info = try? url.resourceValues(forKeys: [.fileSizeKey, .contentModificationDateKey])
            let id = "local-" + Data(url.path.utf8).base64EncodedString().replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "=", with: "")
            entries.append(["id": id, "title": url.deletingPathExtension().lastPathComponent, "fileName": url.lastPathComponent, "uri": url.absoluteString,
                "size": info?.fileSize ?? 0, "modifiedAt": ISO8601DateFormatter().string(from: info?.contentModificationDate ?? Date())])
        }
        call.resolve(["files": entries, "limited": true])
    }
    @objc func getReadablePdf(_ call: CAPPluginCall) {
        guard let raw = call.getString("uri"), let url = URL(string: raw), url.isFileURL,
              let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first,
              url.standardizedFileURL.path.hasPrefix(docs.standardizedFileURL.path + "/") else { call.reject("Document access not granted"); return }
        call.resolve(["uri": url.absoluteString])
    }
}