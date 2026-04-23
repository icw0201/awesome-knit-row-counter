// src/components/settings/SettingsLinks.tsx
import React from 'react';
import { View, Text, Linking } from 'react-native';
import InAppReview from 'react-native-in-app-review';
import { PLAY_STORE_URL, RELEASE_NOTES_URL } from '@constants/storeUrls';
import IconBox from './IconBox';

interface SettingsLinksProps {}

/**
 * 설정 화면의 외부 링크 버튼들을 묶은 컴포넌트
 * - 기본: 플레이스토어 기준 (인앱 리뷰 시도 → 실패 시 스토어 링크)
 * - 원스토어 AAB 빌드 시: handleReviewPress를 아래 주석 블록 코드로 교체 후 빌드
 */
const SettingsLinks: React.FC<SettingsLinksProps> = () => {
  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  // 플레이스토어용: 인앱 리뷰 시도 후, 안 되면 스토어 링크로 폴백
  const handleReviewPress = async () => {
    try {
      if (InAppReview.isAvailable()) {
        await InAppReview.RequestInAppReview();
        return; // 인앱 리뷰 성공 시 링크는 열지 않음
      }
    } catch {
      // In-App Review 실패 시 아래 폴백으로 진행
    }
    openExternalLink(PLAY_STORE_URL);
  };

  /*
   * [원스토어 AAB 빌드 시] 위 handleReviewPress 대신 아래를 사용 (링크로만 이동)
   * storeUrls에서 ONE_STORE_URL import 추가 후:
   *
   * const handleReviewPress = () => {
   *   Linking.openURL(ONE_STORE_URL).catch(() => {});
   * };
   */

  const handleStoreLinkPress = () => {
    openExternalLink(PLAY_STORE_URL);
  };

  const handleReleaseNotesPress = () => {
    openExternalLink(RELEASE_NOTES_URL);
  };

  const handleContactPress = () => {
    const subject = encodeURIComponent('어쩜! 단수 카운터 문의');
    const body = encodeURIComponent(
      [
        '출시 버전* : (설정 페이지의 하단에서 확인해서 입력해주세요)',
        '기기 정보 : ',
      ].join('\n')
    );
    const email = 'Gaebal0201@gmail.com';
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    openExternalLink(url);
  };

  return (
    <View className="mb-8">
      <Text className="mb-3 px-1 text-sm font-semibold text-darkgray">
        앱 정보
      </Text>
      <IconBox
        title="별점 남기기"
        iconName="star"
        onPress={handleReviewPress}
      />
      <IconBox
        title="문의하기"
        iconName="mail"
        onPress={handleContactPress}
      />
      <IconBox
        title="스토어 링크"
        iconName="external-link"
        onPress={handleStoreLinkPress}
      />
      <IconBox
        title="출시 노트"
        iconName="file-text"
        onPress={handleReleaseNotesPress}
      />
    </View>
  );
};

export default SettingsLinks;
