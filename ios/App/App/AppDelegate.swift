import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

// Local Capacitor plugin. Kept in the template's existing target source file.
import AVFoundation

@objc(NeonBridgeViewController)
class NeonBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(NeonDevicePlugin())
        webView?.scrollView.bounces = false
        view.backgroundColor = UIColor(red: 7/255, green: 11/255, blue: 22/255, alpha: 1)
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
    }
    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }
}

@objc(NeonDevicePlugin)
public class NeonDevicePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NeonDevicePlugin"
    public let jsName = "NeonDevice"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "readStore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeStore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "impact", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise)
    ]
    private let io = DispatchQueue(label: "com.aixelstudio.neonarrow.storage")
    private var observers: [NSObjectProtocol] = []
    public override func load() {
        for name in [UIApplication.willResignActiveNotification, UIScene.willDeactivateNotification] {
            observers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                self?.notifyListeners("inactive", data: [:])
            })
        }
        observers.append(NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] notification in
            if let type = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt, type == AVAudioSession.InterruptionType.began.rawValue {
                self?.notifyListeners("inactive", data: [:])
            }
        })
    }
    deinit { observers.forEach { NotificationCenter.default.removeObserver($0) } }
    private func storeURL() throws -> URL {
        let folder = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true).appendingPathComponent("NeonArrow", isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder.appendingPathComponent("save-v1.json")
    }
    @objc func readStore(_ call: CAPPluginCall) {
        io.async {
            do {
                let url = try self.storeURL()
                if !FileManager.default.fileExists(atPath: url.path) { call.resolve(["value": NSNull()]); return }
                let data = try Data(contentsOf: url)
                guard let text = String(data: data, encoding: .utf8) else { call.reject("Invalid save encoding"); return }
                call.resolve(["value": text])
            } catch { call.reject("Cannot read save", nil, error) }
        }
    }
    @objc func writeStore(_ call: CAPPluginCall) {
        guard let text = call.getString("value"), let data = text.data(using: .utf8), data.count <= 2_000_000 else { call.reject("Invalid save payload"); return }
        io.async {
            do {
                guard (try JSONSerialization.jsonObject(with: data)) is [String: String] else { call.reject("Invalid save object"); return }
                try data.write(to: self.storeURL(), options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
                call.resolve()
            } catch { call.reject("Cannot write save", nil, error) }
        }
    }
    @objc func impact(_ call: CAPPluginCall) {
        let kind = call.getString("kind") ?? "start"
        DispatchQueue.main.async {
            if kind == "win" { UINotificationFeedbackGenerator().notificationOccurred(.success) }
            else if kind == "blocked" { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
            else if kind == "select" { UISelectionFeedbackGenerator().selectionChanged() }
            else { UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: kind == "undo" ? 0.35 : 0.5) }
            call.resolve()
        }
    }
    @objc func share(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty, text.count <= 2000 else { call.reject("Invalid share text"); return }
        DispatchQueue.main.async {
            guard let presenter = self.bridge?.viewController, presenter.presentedViewController == nil else { call.reject("Share already presented"); return }
            let sheet = UIActivityViewController(activityItems: [text], applicationActivities: nil)
            sheet.popoverPresentationController?.sourceView = presenter.view
            sheet.popoverPresentationController?.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1)
            sheet.completionWithItemsHandler = { _, _, _, error in
                if let error { call.reject("Sharing failed", nil, error) } else { call.resolve() }
            }
            presenter.present(sheet, animated: !UIAccessibility.isReduceMotionEnabled)
        }
    }
}
