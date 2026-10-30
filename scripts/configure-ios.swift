import Foundation
// Parse the project as a property list. Preserve its object graph and linked template sources.
let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let project = root.appendingPathComponent("ios/App/App.xcodeproj/project.pbxproj")
var plist = try PropertyListSerialization.propertyList(from: Data(contentsOf: project), format: nil) as! [String: Any]
var objects = plist["objects"] as! [String: [String: Any]]
for (id, var object) in objects where object["isa"] as? String == "XCBuildConfiguration" {
    var settings = object["buildSettings"] as? [String: Any] ?? [:]
    if settings["PRODUCT_BUNDLE_IDENTIFIER"] != nil {
        settings["PRODUCT_BUNDLE_IDENTIFIER"] = "com.aixelstudio.neonarrow"
        settings["MARKETING_VERSION"] = "1.0"
        settings["CURRENT_PROJECT_VERSION"] = "1"
        settings["TARGETED_DEVICE_FAMILY"] = "1"
        settings["SWIFT_VERSION"] = "5.0"
        object["buildSettings"] = settings
        objects[id] = object
    }
}
// Link the official local XCFrameworks directly. No remote package resolver is required.
let appTarget = "504EC3031FED79650016851F"
let frameworkPhase = objects.first { $0.value["isa"] as? String == "PBXFrameworksBuildPhase" }!.key
let mainGroup = (objects[plist["rootObject"] as! String]!["mainGroup"] as! String)
let names = ["Capacitor", "Cordova"]
var frameworkFiles: [String] = []
var embedFiles: [String] = []
for (index, name) in names.enumerated() {
    let prefix = index == 0 ? "AAAABBBBCCCCDDDD000000" : "AAAABBBBCCCCDDDD000001"
    let ref = prefix + "01", link = prefix + "02", embed = prefix + "03"
    objects[ref] = ["isa":"PBXFileReference", "lastKnownFileType":"wrapper.xcframework", "path":"NeonRuntime/Frameworks/\(name).xcframework", "sourceTree":"SOURCE_ROOT"]
    objects[link] = ["isa":"PBXBuildFile", "fileRef":ref]
    objects[embed] = ["isa":"PBXBuildFile", "fileRef":ref, "settings":["ATTRIBUTES":["CodeSignOnCopy", "RemoveHeadersOnCopy"]]]
    frameworkFiles.append(link); embedFiles.append(embed)
    var group = objects[mainGroup]!, children = group["children"] as! [String]
    if !children.contains(ref) { children.append(ref) }
    group["children"] = children; objects[mainGroup] = group
}
var phase = objects[frameworkPhase]!
phase["files"] = frameworkFiles; objects[frameworkPhase] = phase
let embedPhase = "AAAABBBBCCCCDDDDEEEE0001"
objects[embedPhase] = ["isa":"PBXCopyFilesBuildPhase", "buildActionMask":"2147483647", "dstPath":"", "dstSubfolderSpec":"10", "files":embedFiles, "name":"Embed Frameworks", "runOnlyForDeploymentPostprocessing":"0"]
var target = objects[appTarget]!, phases = target["buildPhases"] as! [String]
if !phases.contains(embedPhase) { phases.append(embedPhase) }
target["buildPhases"] = phases; target["packageProductDependencies"] = [String](); objects[appTarget] = target
let projectID = plist["rootObject"] as! String
var projectObject = objects[projectID]!
projectObject["packageReferences"] = [String](); objects[projectID] = projectObject
plist["objects"] = objects
func openStep(_ value: Any) -> String {
    if let dict = value as? [String: Any] { return "{\n" + dict.keys.sorted().map { openStep($0) + " = " + openStep(dict[$0]!) + ";" }.joined(separator: "\n") + "\n}" }
    if let array = value as? [Any] { return "(" + array.map(openStep).joined(separator: ",") + (array.isEmpty ? "" : ",") + ")" }
    if let text = value as? String { return String(data: try! JSONSerialization.data(withJSONObject: text, options: [.fragmentsAllowed, .withoutEscapingSlashes]), encoding: .utf8)! }
    return String(describing: value)
}
try ("// !$*UTF8*$!\n" + openStep(plist) + "\n").write(to: project, atomically: true, encoding: .utf8)
let infoURL = root.appendingPathComponent("ios/App/App/Info.plist")
var info = try PropertyListSerialization.propertyList(from: Data(contentsOf: infoURL), format: nil) as! [String: Any]
info["CFBundleDisplayName"] = "Neon Arrow"
info["CFBundleDevelopmentRegion"] = "fr"
info["CFBundleLocalizations"] = ["fr", "en"]
info["UISupportedInterfaceOrientations"] = ["UIInterfaceOrientationPortrait"]
info["UIUserInterfaceStyle"] = "Dark"
info["ITSAppUsesNonExemptEncryption"] = false
info.removeValue(forKey: "UIRequiredDeviceCapabilities")
try PropertyListSerialization.data(fromPropertyList: info, format: .xml, options: 0).write(to: infoURL, options: .atomic)
let sceneURL = root.appendingPathComponent("ios/App/App/SceneDelegate.swift")
let scene = try String(contentsOf: sceneURL, encoding: .utf8).replacingOccurrences(of: "CAPBridgeViewController()", with: "NeonBridgeViewController()")
try scene.write(to: sceneURL, atomically: true, encoding: .utf8)
let mainURL = root.appendingPathComponent("ios/App/App/Base.lproj/Main.storyboard")
let main = try String(contentsOf: mainURL, encoding: .utf8).replacingOccurrences(of: "customClass=\"CAPBridgeViewController\" customModule=\"Capacitor\"", with: "customClass=\"NeonBridgeViewController\" customModule=\"App\"")
try main.write(to: mainURL, atomically: true, encoding: .utf8)
print("Configured Neon Arrow iOS")
