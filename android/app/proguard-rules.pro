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

# react-native-iap 15.x / Nitro Modules
# 릴리즈 R8에서 Nitro HybridObject/JNI 진입점이 제거되면 JS 초기화가 중단되어
# 내부 테스트 빌드에서 흰 화면에 머물 수 있습니다.
-keep class com.margelo.nitro.** { *; }
-keep class com.margelo.nitro.iap.** { *; }
-keepclassmembers class * {
  native <methods>;
}

# Add any project specific keep options here:
