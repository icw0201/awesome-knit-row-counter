import Expo
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
// 기존 UIResponder/AppDelegate 구현은 bare React Native 기준으로는 충분했지만,
// 이번 브랜치에서 Expo 모듈과 expo-speech-recognition을 함께 쓰게 되면서
// Expo 초기화 생명주기를 받는 ExpoAppDelegate로 바꾸는 것이 필요해졌습니다.
// 그래서 기존 베이스 클래스는 삭제해도 무방했고, 그대로 두면 Expo 모듈 초기화가 빠질 수 있었습니다.
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    // 기존 RCTReactNativeFactory(delegate:)는 bare RN 기본 팩토리였고,
    // Expo 플러그인/모듈 초기화 훅을 통과시키지 못하므로 ExpoReactNativeFactory로 교체했습니다.
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "SimpleKnitCounter",
      in: window,
      launchOptions: launchOptions
    )

    // 기존 코드는 true를 바로 반환했지만, ExpoAppDelegate가 후처리하는 생명주기 연결을 살리려면
    // super.application(...)을 호출해야 합니다. direct return true 코드는 그래서 삭제해도 안전합니다.
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}

// 기존 RCTDefaultReactNativeFactoryDelegate는 기본 RN 번들 경로만 알면 되는 bare 구조였고,
// 이번 브랜치에서는 expo-dev-client / Expo virtual entry를 이해하는 delegate가 필요해
// ExpoReactNativeFactoryDelegate로 교체했습니다.
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
    // needed to return the correct URL for expo-dev-client.
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // 예전의 self.bundleURL() 고정 반환은 index 기준 bare RN 엔트리만 바라봤습니다.
    // Expo dev client가 이미 계산한 bundleURL이 있으면 그것을 우선 사용하고,
    // 없을 때만 아래 fallback(bundleURL())을 쓰도록 바꿨습니다.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    // develop의 "index" 엔트리는 bare RN 기본값이라 삭제해도 무방했습니다.
    // Expo는 플러그인/app config가 반영된 가상 엔트리(.expo/.virtual-metro-entry)를 사용해야
    // dev 환경에서 네이티브 모듈 연결과 Metro 해석이 올바르게 동작합니다.
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
