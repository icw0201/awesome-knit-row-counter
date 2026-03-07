/**
 * postinstall: @react-native-voice/voice 패치
 * 1. Android build.gradle: com.android.support → AndroidX
 * 2. Android VoiceModule.java: getName() "RCTVoice" → "Voice" (JS의 NativeModules.Voice와 맞춤)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'node_modules', '@react-native-voice', 'voice');
if (!fs.existsSync(root)) {
  process.exit(0);
}

// 1) build.gradle AndroidX
const buildGradlePath = path.join(root, 'android', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  if (content.includes('com.android.support:appcompat-v7')) {
    content = content.replace(
      /def supportVersion = rootProject\.hasProperty\('supportLibVersion'\) \? rootProject\.supportLibVersion : DEFAULT_SUPPORT_LIB_VERSION\s*\n\n/g,
      ''
    );
    content = content.replace(
      /implementation "com\.android\.support:appcompat-v7:\$\{supportVersion\}"/,
      "implementation 'androidx.appcompat:appcompat:1.6.1'"
    );
    fs.writeFileSync(buildGradlePath, content);
    console.log('Patched @react-native-voice/voice android/build.gradle for AndroidX');
  }
}

// 2) VoiceModule.java: getName() "RCTVoice" → "Voice"
const voiceModulePath = path.join(root, 'android', 'src', 'main', 'java', 'com', 'wenkesj', 'voice', 'VoiceModule.java');
if (fs.existsSync(voiceModulePath)) {
  let content = fs.readFileSync(voiceModulePath, 'utf8');
  if (content.includes('return "RCTVoice"')) {
    content = content.replace('return "RCTVoice"', 'return "Voice"');
    fs.writeFileSync(voiceModulePath, content);
    console.log('Patched @react-native-voice/voice VoiceModule.java getName() → "Voice"');
  }
}
