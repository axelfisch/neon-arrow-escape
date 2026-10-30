# Official native runtime

`Frameworks/Capacitor.xcframework` and `Frameworks/Cordova.xcframework` are the official 8.5.3 release binaries from ionic-team/capacitor-swift-pm. They are linked directly in App.xcodeproj and omitted from Git. The prepared project ZIP includes them.

Run `npm run ios:sync` from the repository root to install them and copy the web build. The script verifies downloaded archive SHA-256 values pinned from the official 8.5.3 Package.swift. Full MIT notice ships in public/licenses/capacitor-MIT.txt.
