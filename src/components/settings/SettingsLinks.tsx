// src/components/settings/SettingsLinks.tsx
import React from 'react';
import { View, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import InAppReview from 'react-native-in-app-review';
import {
  ONE_STORE_INSTALLER_PACKAGE,
  ONE_STORE_URL,
  PLAY_STORE_URL,
} from '@constants/storeUrls';
import IconBox from './IconBox';

/** getInstallerPackageName 대기 최대 시간 (멈춤 방지) */
const INSTALLER_TIMEOUT_MS = 2500;

interface SettingsLinksProps {}

/**
 * 설정 화면의 외부 링크 버튼들을 묶은 컴포넌트
 */
const SettingsLinks: React.FC<SettingsLinksProps> = () => {
  /**
   * 외부 링크 열기 (리뷰/문의)
   * @param type - 링크 타입 ('review' | 'contact')
   */
  const handlePress = async (type: 'review' | 'contact') => {
    if (type === 'review') {
      const installer = await Promise.race([
        DeviceInfo.getInstallerPackageName(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('installer timeout')), INSTALLER_TIMEOUT_MS)
        ),
      ]).catch(() => null);

      const isOneStore = installer === ONE_STORE_INSTALLER_PACKAGE;

      if (isOneStore) {
        Linking.openURL(ONE_STORE_URL).catch(() => {});
        return;
      }

      // 플레이스토어 또는 설치처 미확인: 인앱 리뷰 시도 후, 안 되면 링크로 폴백
      try {
        if (InAppReview.isAvailable()) {
          await InAppReview.RequestInAppReview();
          return; // 인앱 리뷰 성공 시 링크는 열지 않음
        }
      } catch {
        // In-App Review 실패 시 아래 폴백으로 진행
      }

      Linking.openURL(PLAY_STORE_URL).catch(() => {});
    } else if (type === 'contact') {
      // 문의 이메일 링크
      const subject = encodeURIComponent('어쩜! 단수 카운터 문의');
      const email = 'Gaebal0201@gmail.com';
      const url = `mailto:${email}?subject=${subject}`;

      Linking.openURL(url).catch(() => {
        // 에러 처리 (필요시 추가)
      });
    }
  };
  return (
    <View className="mb-8">
      <IconBox
        title="별점 남기기"
        iconName="star"
        onPress={() => handlePress('review')}
      />
      <IconBox
        title="문의하기"
        iconName="mail"
        onPress={() => handlePress('contact')}
      />
    </View>
  );
};

export default SettingsLinks;
