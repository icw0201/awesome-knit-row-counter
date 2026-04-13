// src/components/settings/SettingsLinks.tsx
import React from 'react';
import { View, Linking } from 'react-native';
import { ONE_STORE_URL, RELEASE_NOTES_URL } from '@constants/storeUrls';
import IconBox from './IconBox';

interface SettingsLinksProps {}

/**
 * 설정 화면의 외부 링크 버튼들을 묶은 컴포넌트
 * - 원스토어 배포 기준: 별점/스토어 링크는 ONE_STORE_URL로 연결
 *   (Google Play 인앱 리뷰 API는 원스토어와 연동되지 않음)
 */
const SettingsLinks: React.FC<SettingsLinksProps> = () => {
  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const handleReviewPress = () => {
    openExternalLink(ONE_STORE_URL);
  };

  const handleStoreLinkPress = () => {
    openExternalLink(ONE_STORE_URL);
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
