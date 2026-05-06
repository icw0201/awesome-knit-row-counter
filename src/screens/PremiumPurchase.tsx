// src/screens/PremiumPurchase.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star } from 'lucide-react-native';
import clsx from 'clsx';
import { useIsFocused } from '@react-navigation/native';

import { premiumPreviewCarouselSlides } from '@assets/images';
import { useAppThemeSync } from '@hooks/useAppThemeSync';
import { appTheme } from '@styles/appTheme';
import { screenStyles, safeAreaEdges } from '@styles/screenStyles';
import RoundedButton from '@components/common/RoundedButton';
import { useIapContext } from '../providers/IapProvider';

const premiumPurchaseFeatureLines = [
  '추가 색상 테마 4종',
  '사용자 지정 음성 인식 명령어',
  '데이터 내보내기&파일 데이터 불러오기',
  '개발자의 감사',
] as const;

/** 캐러셀 한 바퀴 너비 (카드 폭 + 간격) */
const CAROUSEL_CARD_WIDTH = 126;
const CAROUSEL_CARD_HEIGHT = 224;
const CAROUSEL_GAP = 12;

/** 구매 / 구매 복원 — 동일한 가로 박스(React Native flex에서 확실한 기준) */
const CTA_MAX_WIDTH = 320;

const styles = StyleSheet.create({
  ctaBlock: {
    width: '100%',
    maxWidth: CTA_MAX_WIDTH,
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  themeCarouselContent: {
    flexDirection: 'row',
    gap: CAROUSEL_GAP,
    paddingBottom: 4,
  },
  themeCard: {
    width: CAROUSEL_CARD_WIDTH,
    height: CAROUSEL_CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
  },
  themeCardImage: {
    width: CAROUSEL_CARD_WIDTH,
    height: CAROUSEL_CARD_HEIGHT,
  },
});

function getCarouselLoopWidth(itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }
  return itemCount * CAROUSEL_CARD_WIDTH + (itemCount - 1) * CAROUSEL_GAP;
}

/** 스토어 원문(예: Item is already owned)을 화면용 안내로 바꿉니다. */
function getPremiumPurchaseErrorMessage(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (
    lower.includes('already owned') ||
    lower.includes('item_already_owned')
  ) {
    return '이미 이 상품을 보유 중입니다. 아래 「구매 복원」을 눌러 스토어에서 구매 내역을 다시 불러와 보세요.';
  }
  return raw;
}

/**
 * 프리미엄 일회성 구매 안내 화면 (Figma: 프리미엄 구독 프레임)
 * 결제 플로우는 Google Play Billing 연동 시 버튼 핸들러에 연결합니다.
 */
const PremiumPurchase: React.FC = () => {
  useAppThemeSync();
  const isFocused = useIsFocused();
  const {
    premiumUnlocked,
    iapReady,
    premiumDisplayPrice,
    purchasePremium,
    restorePremium,
    purchaseBusy,
    restoreBusy,
    lastError,
    clearLastError,
    resetLocalPremiumForTesting,
  } = useIapContext();

  const carouselRef = useRef<ScrollView>(null);
  const scrollXRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const slideCount = premiumPreviewCarouselSlides.length;
  const loopWidth = getCarouselLoopWidth(slideCount);
  const carouselTiles = [
    ...premiumPreviewCarouselSlides,
    ...premiumPreviewCarouselSlides,
  ];

  useEffect(() => {
    if (!isFocused || loopWidth <= 0) {
      return;
    }
    const step = 0.45;

    const tick = () => {
      scrollXRef.current += step;
      if (scrollXRef.current >= loopWidth) {
        scrollXRef.current -= loopWidth;
      }
      carouselRef.current?.scrollTo({
        x: scrollXRef.current,
        animated: false,
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isFocused, loopWidth]);

  const purchaseButtonTitle = premiumDisplayPrice
    ? `${premiumDisplayPrice}에 구매하기`
    : '구매하기';

  const handlePurchase = () => {
    clearLastError();
    void purchasePremium();
  };

  const handleRestore = () => {
    clearLastError();
    void restorePremium();
  };

  return (
    <SafeAreaView style={screenStyles.flex1} edges={safeAreaEdges}>
      <ScrollView
        contentContainerStyle={screenStyles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-1 pt-2">
          <View className="mb-3 w-full flex-row items-center justify-center gap-2 px-2">
            <Star size={24} color={appTheme.colors.premiumGold} fill={appTheme.colors.premiumGold} />
            <View className="min-w-0 flex-1">
              <Text className="text-center text-xl font-bold text-black">
                프리미엄 버전을{'\n'}사용해보세요!
              </Text>
            </View>
            <Star size={24} color={appTheme.colors.premiumGold} fill={appTheme.colors.premiumGold} />
          </View>

          <Text className="mb-8 px-2 text-center text-lg text-black">
            한 번의 결제로{'\n'}모든 유료 기능을 사용할 수 있습니다.
          </Text>

          {premiumUnlocked ? (
            <View
              className={clsx(
                'mb-4 w-full max-w-[340px] rounded-[10px] border bg-white px-4 py-3',
                appTheme.tw.border.primary['300']
              )}
            >
              <Text className="text-center text-base font-semibold text-black">
                이 기기에서 프리미엄이 활성화되어 있습니다.
              </Text>
            </View>
          ) : null}

          <View
            className={clsx(
              'mb-6 w-full max-w-[340px] rounded-[10px] border bg-white px-4 py-4',
              appTheme.tw.border.primary['300']
            )}
          >
            {premiumPurchaseFeatureLines.map((line, index) => (
              <View key={line}>
                <View className="flex-row items-center gap-2 py-3">
                  <Star size={22} color={appTheme.colors.premiumGold} fill={appTheme.colors.premiumGold} />
                  <Text className="flex-1 text-lg text-black">{line}</Text>
                </View>
                {index !== premiumPurchaseFeatureLines.length - 1 ? (
                  <View className="h-px w-full bg-lightgray" />
                ) : null}
              </View>
            ))}
          </View>

          <Text className="mb-2 self-start text-sm text-darkgray">
            테마 색상 미리보기
          </Text>
          <ScrollView
            ref={carouselRef}
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            className="mb-8 w-full"
            contentContainerStyle={styles.themeCarouselContent}
          >
            {carouselTiles.map((slide, index) => (
              <View key={`${slide.id}-${index}`} style={styles.themeCard}>
                <Image
                  source={slide.source}
                  style={styles.themeCardImage}
                  resizeMode="cover"
                  accessibilityLabel={slide.label}
                />
                <View className="absolute bottom-0 left-0 right-0 bg-white/90 px-1.5 py-1">
                  <Text
                    className="text-center text-[10px] font-semibold text-black"
                    numberOfLines={1}
                  >
                    {slide.label}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.ctaBlock} className="mb-4">
            <RoundedButton
              onPress={handlePurchase}
              title={purchaseButtonTitle}
              colorStyle="light"
              containerClassName="w-full mx-0"
              disabled={purchaseBusy || !iapReady || premiumUnlocked}
            />
            {!iapReady ? (
              <View className="mt-2 flex-row items-center justify-center gap-2">
                <ActivityIndicator size="small" />
                <Text className="text-sm text-darkgray">스토어 연결 중…</Text>
              </View>
            ) : null}
            {purchaseBusy ? (
              <View className="mt-2 items-center">
                <ActivityIndicator size="small" />
              </View>
            ) : null}
            <TouchableOpacity
              onPress={handleRestore}
              activeOpacity={0.7}
              disabled={restoreBusy || !iapReady}
              className="mt-2 w-full items-center py-1"
            >
              {restoreBusy ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text
                  className={clsx(
                    'text-center text-base font-bold',
                    appTheme.tw.text.primary['950']
                  )}
                >
                  구매 복원
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetLocalPremiumForTesting}
              activeOpacity={0.7}
              className="mt-4 w-full items-center rounded-lg bg-lightgray py-2"
              accessibilityLabel="기기 로컬에 저장된 프리미엄 해제 상태로 초기화"
            >
              <Text className="text-center text-sm text-mediumgray">
                프리미엄 상태 초기화 (로컬)
              </Text>
            </TouchableOpacity>
          </View>

          {lastError ? (
            <Text
              className={clsx(
                'mt-4 max-w-[320px] px-2 text-center text-sm',
                appTheme.tw.text.emphasisRed
              )}
            >
              {getPremiumPurchaseErrorMessage(lastError)}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PremiumPurchase;
