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
import LinearGradient from 'react-native-linear-gradient';
import { Star } from 'lucide-react-native';
import clsx from 'clsx';
import { useIsFocused } from '@react-navigation/native';

import { premiumPreviewCarouselSlides } from '@assets/images';
import { PREMIUM_FEATURES_PANEL_SHADOW_GRADIENT_TOP } from '@constants/colors';
import { useAppThemeSync } from '@hooks/useAppThemeSync';
import {
  APP_COLOR_THEME_OPTIONS,
  appTheme,
  type AppColorThemeOption,
} from '@styles/appTheme';
import { screenStyles, safeAreaEdges } from '@styles/screenStyles';
import RoundedButton from '@components/common/RoundedButton';
import { useIapContext } from '@provider/IapProvider';

// 유료 기능 설명 줄에 붙는 추가 테마 색상 칩(4종) 데이터
const PREMIUM_EXTRA_THEME_CHIP_OPTIONS: AppColorThemeOption[] = (
  ['lavender', 'honeyBanana', 'olive', 'gray'] as const
).map((value) => APP_COLOR_THEME_OPTIONS.find((o) => o.value === value)!);

/** 캐러셀 한 바퀴 너비 (카드 폭 + 간격) */
const CAROUSEL_CARD_WIDTH = 126;
const CAROUSEL_CARD_HEIGHT = 224;
const CAROUSEL_GAP = 12;

/** 구매 / 구매 복원 — 동일한 가로 박스(React Native flex에서 확실한 기준) */
const CTA_MAX_WIDTH = 320;

// 테마 미리보기 캐러셀·하단 CTA 등 TW 대신 StyleSheet로 둔 레이아웃
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

// 무한 스크롤 루프용으로 복제된 캐러셀 타일의 가로 픽셀 너비 합산
function getCarouselLoopWidth(itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }
  return itemCount * CAROUSEL_CARD_WIDTH + (itemCount - 1) * CAROUSEL_GAP;
}

/** ScrollView content padding(16) + 상단 래퍼 px-1(4)만큼 상쇄해 가로 풀블리드 */
const PREMIUM_FEATURES_BLEED_X = 20;

// --- 2분할 테마 칩 · 스토어 오류 문구 변환 ---
/** 설정 칩(SettingsSingleSelect)과 동일한 상·하 2분할(200 / 400) 미리보기 — 라벨 없음 */
function PremiumSplitThemeChip({ option }: { option: AppColorThemeOption }) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={option.label}
      className="h-7 w-7 overflow-hidden rounded-md"
      collapsable={false}
    >
      <View className="flex-1 flex-col" collapsable={false}>
        <View className="flex-1" style={{ backgroundColor: option.primary200 }} />
        <View className="flex-1" style={{ backgroundColor: option.primary400 }} />
      </View>
    </View>
  );
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
  // 테마 저장값 구독, IAP 준비/가격/구매·복원, 프리미엄 보유 여부
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

  // 테마 미리보기 가로 캐러셀(프레임 기반 자동 스크롤)
  const carouselRef = useRef<ScrollView>(null);
  const scrollXRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const slideCount = premiumPreviewCarouselSlides.length;
  const loopWidth = getCarouselLoopWidth(slideCount);
  const carouselTiles = [
    ...premiumPreviewCarouselSlides,
    ...premiumPreviewCarouselSlides,
  ];

  // 화면 포커스 시 타일을 옆으로 계속 밀어 무한 스크롤처럼 보이게 함
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

  // 구매 버튼 라벨(스토어 가격 반영) 및 구매·복원 탭 핸들러
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

  const screenBackgroundColor = appTheme.colors.premiumPurchaseScreenBackground;
  const premiumFeaturesPanelShadowColors = [
    PREMIUM_FEATURES_PANEL_SHADOW_GRADIENT_TOP,
    appTheme.colors.transparent,
  ] as const;

  // --- UI 트리: 안전영역 → 스크롤 → 히어로·유료 패널·미리보기·결제 ---
  return (
    <SafeAreaView
      style={[screenStyles.flex1, { backgroundColor: screenBackgroundColor }]}
      edges={safeAreaEdges}
    >
      <ScrollView
        contentContainerStyle={screenStyles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 세로 스크롤 본문: 히어로 → 패널 → 캐러셀 → CTA */}
        <View className="items-center px-1 pt-2">
          {/* 헤더: 금색 별 + 메인 카피 */}
          <View className="mb-3 flex-row items-center justify-center gap-3 px-2">
            <Star size={24} color={appTheme.colors.premiumGold} fill={appTheme.colors.premiumGold} />
            <Text className="text-center text-xl font-bold text-black">
              프리미엄 버전을{'\n'}사용해보세요!
            </Text>
            <Star size={24} color={appTheme.colors.premiumGold} fill={appTheme.colors.premiumGold} />
          </View>

          {/* 서브 카피(결제 1회 안내) */}
          <Text className="mb-8 px-2 text-center text-lg text-black">
            한 번의 결제로{'\n'}모든 유료 기능을 사용할 수 있습니다.
          </Text>

          {/* 이미 프리미엄인 경우 짧은 상태 박스 */}
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

          {/* 유료 기능 4행 + 테마 칩 + 패널 테두리 + 하단 그림자 막대 */}
          <View
            className="mb-6 self-stretch"
            style={{ marginHorizontal: -PREMIUM_FEATURES_BLEED_X }}
          >
            <View
              className={clsx(
                'border-y bg-white/70 px-4 py-4',
                appTheme.tw.border.primary['300']
              )}
            >
              <View className="items-center justify-center px-2 py-3">
                <Text className="w-full text-center text-lg font-bold leading-[22px] tracking-tight text-black">
                  추가 색상 테마 4종
                </Text>
                <View className="mt-2 flex-row flex-wrap items-center justify-center">
                  {PREMIUM_EXTRA_THEME_CHIP_OPTIONS.map((opt) => (
                    <View key={opt.value} className="mx-1">
                      <PremiumSplitThemeChip option={opt} />
                    </View>
                  ))}
                </View>
              </View>
              <View className={clsx('h-px w-[55%] self-center', appTheme.tw.bg.primary['200'])} />

              <View className="items-center justify-center px-2 py-3">
                <Text className="w-full text-center text-lg font-bold leading-[22px] tracking-tight text-black">
                  사용자 지정 음성 인식 명령어
                </Text>
              </View>
              <View className={clsx('h-px w-[55%] self-center', appTheme.tw.bg.primary['200'])} />

              <View className="items-center justify-center px-2 py-3">
                <Text className="w-full text-center text-lg font-bold leading-[22px] tracking-tight text-black">
                  데이터 내보내기&파일 데이터 불러오기
                </Text>
              </View>
              <View className={clsx('h-px w-[55%] self-center', appTheme.tw.bg.primary['200'])} />

              <View className="items-center justify-center px-2 py-3">
                <Text className="w-full text-center text-sm font-normal leading-[18px] text-black">
                  개발자의 감사
                </Text>
              </View>
            </View>
            <LinearGradient
              pointerEvents="none"
              colors={[...premiumFeaturesPanelShadowColors]}
              locations={[0, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ height: 10 }}
            />
          </View>

          {/* 유료 테마 스킨 카드 가로 캐러셀(라벨 오버레이) */}
          <Text className="mb-2 self-start text-sm text-darkgray">
            유료 기능 미리보기
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

          {/* 결제·복원·개발용 로컬 초기화 */}
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

          <Text
            className={clsx(
              'mt-4 max-w-[320px] px-2 text-center text-sm',
              appTheme.tw.text.darkgray
            )}
          >
            본 상품은 디지털 콘텐츠의 특성상 구매 후 즉시 콘텐츠가 제공되어 청약철회가 제한됩니다.
          </Text>

          {/* Billing 오류 시 스토어 문구를 한국어 안내로 치환해 표시 */}
          {lastError ? (
            <Text
              className={clsx(
                'mt-2 max-w-[320px] px-2 text-center text-sm',
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
