# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# 릴리즈 난독화 시 Reanimated/TurboModule 관련 클래스가 제거되면
# 음성 배너/애니메이션을 포함한 런타임 동작이 깨질 수 있어 keep 규칙을 추가했습니다.
# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
# OkHttp — R8이 okhttp3.Callback 등을 제거/축약하면 브리지리스 초기화에서
# BridgelessReact: "Incomplete hierarchy for class NativeResponse, unresolved classes [okhttp3.Callback]"
# 같은 오류 후 흰 화면이 납니다 (로그 확인됨 · pid 연관).
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class okio.** { *; }
# react-native-iap 15.x / Nitro Modules
# 릴리즈 R8에서 Nitro HybridObject/JNI 진입점이 제거되면 JS 초기화가 중단되어
# 내부 테스트 빌드에서 흰 화면에 머물 수 있습니다.
-keep class com.margelo.nitro.** { *; }
-keep class com.margelo.nitro.iap.** { *; }
# Play Billing 클라이언트(연동 초기 리플렉션/내부 타입 이름 유지)
-keep class com.android.billingclient.api.** { *; }

# react-native-mmkv (Turbo 네이티브 모듈 + JNI 쪽 이름 유지 — R8이 제거하면 MMKV 접근 단계에서 네이티브 크래시 가능)
-keep class com.mrousavy.mmkv.** { *; }
-keepclassmembers class * {
  native <methods>;
}

# expo-speech-recognition — 릴리즈 R8이 RecognitionSupportCallback·모듈 내부 클래스를 축소하면
# getSupportedLocales()가 실패하거나 빈 결과만 돌아가 debug에서는 정상·Play 릴리즈에서만
# "온디바이스 모델 없음"으로 오진될 수 있습니다.
-keep class expo.modules.speechrecognition.** { *; }

# Add any project specific keep options here:
