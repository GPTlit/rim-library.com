# iOS WidgetKit integration — source prepared, not installed

There is currently no iOS Xcode app in this repository. The Swift sources and mascot asset catalog are real WidgetKit code, but the extension cannot run until the following setup is completed on a Mac:

1. Install `@capacitor/ios` with the same major version as Capacitor core and run `npx cap add ios`.
2. In Xcode add a Widget Extension named `QahwaWidgets`, minimum iOS 17, then include `QahwaWidgets.swift` and `Assets.xcassets` in its target. Remove the template's duplicate `@main` declaration.
3. Enable the same App Group (`group.app.lovable.qahwa`) for both the app and extension using your Apple developer team. Add the provided entitlements to the extension and the same App Group entitlement to the app.
4. Add `QahwaNativePlugin.swift` to the app target and register it from the Capacitor bridge (`bridge?.registerPluginInstance(QahwaNativePlugin())`) in a custom `CAPBridgeViewController`.
5. Add the `qahwa` URL scheme to the app's URL types. Widget taps then use the existing Capacitor deep-link handler.
6. Build and test all three widget sizes on an iPhone. WidgetKit may defer the five-minute frame timeline according to its energy budget.

This iOS plugin is the widget/document bridge, not an implementation of Android MediaStore downloads. iOS bookshelf enumeration covers only the app's Documents directory; iOS does not allow scanning the whole device. External iOS PDF association and imports require separate app document-type registration and security-scoped URL handling and are not claimed implemented here.