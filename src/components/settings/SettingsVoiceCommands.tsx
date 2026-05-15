import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import TextInputBox, { TextInputBoxRef } from '@components/common/TextInputBox';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { useIapContext } from '@provider/IapProvider';
import {
  getCustomVoiceCommandInputsSetting,
  getSelectedVoiceCommandModeSetting,
  setCustomVoiceCommandInputsSetting,
  setSelectedVoiceCommandModeSetting,
  type CustomVoiceCommandInputsSetting,
  type VoiceCommandSettingMode,
} from '@storage/settings';
import { appTheme } from '@styles/appTheme';
import SettingsAccordion from './SettingsAccordion';
import SettingsSectionHeader from './SettingsSectionHeader';

type VoiceCommandGroupKey =
  | 'mainDecrease'
  | 'mainIncrease'
  | 'subDecrease'
  | 'subIncrease';

interface VoiceCommandRowConfig {
  key: VoiceCommandGroupKey;
  sectionTitle: string;
  label: string;
  placeholders: [string, string, string];
}

const DEFAULT_VOICE_COMMAND_SECTIONS = [
  {
    title: '본 카운터',
    description: '연지(현지, 연기) / 곤지(군지, 건지)',
  },
  {
    title: '보조 카운터',
    description: '청실(청신, 창신) / 홍실(홍신, 동실)',
  },
] as const;

const VOICE_COMMAND_ROW_CONFIGS: VoiceCommandRowConfig[] = [
  {
    key: 'mainDecrease',
    sectionTitle: '본 카운터',
    label: '카운트 감소',
    placeholders: ['딸기', '달기', '탈기'],
  },
  {
    key: 'mainIncrease',
    sectionTitle: '본 카운터',
    label: '카운트 증가',
    placeholders: ['사과', '사와', '서과'],
  },
  {
    key: 'subDecrease',
    sectionTitle: '보조 카운터',
    label: '카운트 감소',
    placeholders: ['루크', '무크', '구크'],
  },
  {
    key: 'subIncrease',
    sectionTitle: '보조 카운터',
    label: '카운트 증가',
    placeholders: ['제이', '체이', '데이'],
  },
];

const VOICE_COMMAND_INPUT_ORDER = VOICE_COMMAND_ROW_CONFIGS.flatMap((config) =>
  config.placeholders.map((_, index) => ({
    key: config.key,
    index,
    id: `${config.key}-${index}`,
  }))
);

const PREMIUM_OVERLAY_STYLE = { mixBlendMode: 'multiply' } as const;

/**
 * 설정 화면의 음성인식 명령어 설정 섹션
 */
const SettingsVoiceCommands: React.FC = () => {
  const { premiumUnlocked } = useIapContext();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [selectedVoiceCommandMode, setSelectedVoiceCommandMode] =
    useState<VoiceCommandSettingMode>('default');
  const [voiceCommandInputs, setVoiceCommandInputs] =
    useState<CustomVoiceCommandInputsSetting>({
      mainDecrease: ['', '', ''],
      mainIncrease: ['', '', ''],
      subDecrease: ['', '', ''],
      subIncrease: ['', '', ''],
    });
  const [voiceCommandSettingsHydrated, setVoiceCommandSettingsHydrated] =
    useState(false);
  const voiceInputRefs = useRef<Record<string, TextInputBoxRef | null>>({});

  useEffect(() => {
    setSelectedVoiceCommandMode(getSelectedVoiceCommandModeSetting());
    setVoiceCommandInputs(getCustomVoiceCommandInputsSetting());
    setVoiceCommandSettingsHydrated(true);
  }, []);

  useEffect(() => {
    if (!voiceCommandSettingsHydrated) {
      return;
    }

    setSelectedVoiceCommandModeSetting(selectedVoiceCommandMode);
  }, [selectedVoiceCommandMode, voiceCommandSettingsHydrated]);

  useEffect(() => {
    if (!voiceCommandSettingsHydrated) {
      return;
    }

    setCustomVoiceCommandInputsSetting(voiceCommandInputs);
  }, [voiceCommandInputs, voiceCommandSettingsHydrated]);

  useEffect(() => {
    if (!voiceCommandSettingsHydrated || premiumUnlocked) {
      return;
    }

    if (selectedVoiceCommandMode === 'custom') {
      setSelectedVoiceCommandMode('default');
    }
  }, [premiumUnlocked, voiceCommandSettingsHydrated, selectedVoiceCommandMode]);

  /**
   * 사용자 지정 음성 명령어 토글 처리
   */
  const handleCustomVoiceCommandsToggle = () => {
    if (!premiumUnlocked) {
      navigation.navigate('PremiumPurchase');
      return;
    }

    setSelectedVoiceCommandMode('custom');
  };

  /**
   * 기본 음성 명령어 설정 선택 처리
   */
  const handleDefaultVoiceCommandsToggle = () => {
    setSelectedVoiceCommandMode('default');
  };

  /**
   * 사용자 지정 음성 명령어 입력 처리
   */
  const handleVoiceCommandInputChange = useCallback((
    key: VoiceCommandGroupKey,
    index: number,
    text: string
  ) => {
    setVoiceCommandInputs((prev) => {
      const nextValues = [...prev[key]] as [string, string, string];
      nextValues[index] = Array.from(text).slice(0, 3).join('');

      return {
        ...prev,
        [key]: nextValues,
      };
    });
  }, []);

  /**
   * 음성 명령어 입력칸의 다음 포커스를 이동한다.
   */
  const handleVoiceCommandSubmitEditing = useCallback((
    key: VoiceCommandGroupKey,
    index: number
  ) => {
    const currentInputIndex = VOICE_COMMAND_INPUT_ORDER.findIndex(
      (item) => item.key === key && item.index === index
    );

    if (currentInputIndex < 0) {
      return;
    }

    const nextInput = VOICE_COMMAND_INPUT_ORDER[currentInputIndex + 1];

    if (nextInput) {
      voiceInputRefs.current[nextInput.id]?.focus();
      return;
    }

    voiceInputRefs.current[`${key}-${index}`]?.blur();
  }, []);

  const mainCounterVoiceCommandRows = VOICE_COMMAND_ROW_CONFIGS.filter(
    (config) => config.sectionTitle === '본 카운터'
  );
  const subCounterVoiceCommandRows = VOICE_COMMAND_ROW_CONFIGS.filter(
    (config) => config.sectionTitle === '보조 카운터'
  );

  // 사용자 설정: 감소/증가 한 행 (`config`당 1행, 입력 3칸 + refs로 다음/완료 포커스)
  const renderVoiceCommandInputRow = useCallback((config: VoiceCommandRowConfig) => {
    return (
      <View key={config.key} className="mb-3 flex-row items-center pl-2">
        {/* 행 라벨 (감소/증가 등) */}
        <View className="w-24 pr-3">
          <Text className="text-base text-black">{config.label}</Text>
        </View>

        <View className="flex-1 pl-3">
          <View className="flex-row">
            {/* 첫 칸: 명령어 */}
            <View className="flex-1 pr-2">
              <TextInputBox
                ref={(ref) => {
                  voiceInputRefs.current[`${config.key}-0`] = ref;
                }}
                label=""
                value={voiceCommandInputs[config.key][0]}
                onChangeText={(text) =>
                  handleVoiceCommandInputChange(config.key, 0, text)
                }
                placeholder={config.placeholders[0]}
                type="text"
                maxLength={2}
                showCounter={false}
                inputClassName="h-auto min-h-11 py-2 text-base text-center"
                containerClassName="mb-0 flex-1"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="center"
                fillWidth={false}
                returnKeyType="next"
                onSubmitEditing={() =>
                  handleVoiceCommandSubmitEditing(config.key, 0)
                }
                blurOnSubmit={false}
              />
            </View>

            {/* 명령어 | 유사어 구분 */}
            <View className="mr-2 self-stretch border-l border-lightgray" />

            {/* 나머지 두 칸: 유사어 */}
            <View className="flex-[2] flex-row">
              {config.placeholders.slice(1).map((placeholder, offset) => {
                const index = offset + 1;

                return (
                  <TextInputBox
                    key={`${config.key}-${index}`}
                    ref={(ref) => {
                      voiceInputRefs.current[`${config.key}-${index}`] = ref;
                    }}
                    label=""
                    value={voiceCommandInputs[config.key][index]}
                    onChangeText={(text) =>
                      handleVoiceCommandInputChange(config.key, index, text)
                    }
                    placeholder={placeholder}
                    type="text"
                    maxLength={2}
                    showCounter={false}
                    inputClassName="h-auto min-h-11 py-2 text-base text-center"
                    containerClassName={`mb-0 flex-1 ${
                      offset === 0 ? '' : 'ml-2'
                    }`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textAlign="center"
                    fillWidth={false}
                    returnKeyType={
                      config.key === 'subIncrease' && index === 2 ? 'done' : 'next'
                    }
                    onSubmitEditing={() =>
                      handleVoiceCommandSubmitEditing(config.key, index)
                    }
                    blurOnSubmit={config.key === 'subIncrease' && index === 2}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  }, [
    handleVoiceCommandInputChange,
    handleVoiceCommandSubmitEditing,
    voiceCommandInputs,
  ]);

  return (
    <View className="mb-6">
      <SettingsSectionHeader title="음성인식 명령어" />

      {/* 카드 1: 기본 명령어 안내(읽기 전용) */}
      <View className="mb-3 rounded-2xl border border-lightgray bg-transparent py-2">
        <SettingsAccordion
          label="기본 설정"
          checked={selectedVoiceCommandMode === 'default'}
          onToggle={handleDefaultVoiceCommandsToggle}
        >
          {DEFAULT_VOICE_COMMAND_SECTIONS.map((section, index) => (
            <View
              key={section.title}
              className={`pl-4 ${
                index === DEFAULT_VOICE_COMMAND_SECTIONS.length - 1 ? 'pb-2' : ''
              } ${
                index === 0 ? 'mb-3' : ''
              }`}
            >
              <Text className="text-base font-semibold text-black">
                {section.title}
              </Text>
              <Text className="pl-4 pt-1 text-base leading-6 text-black">
                {section.description}
              </Text>
            </View>
          ))}
        </SettingsAccordion>
      </View>

      {/* 카드 2: 사용자 지정 2글자×3 입력 (프리미엄 전용 시 multiply·별 오버레이) */}
      <View className="relative overflow-hidden rounded-2xl border border-lightgray bg-transparent">
        <View className="bg-transparent py-2">
          <SettingsAccordion
            label="사용자 설정"
            checked={selectedVoiceCommandMode === 'custom'}
            onToggle={handleCustomVoiceCommandsToggle}
          >
            {/* 본 카운터: 상단 컬럼 라벨(명령어/유사어) + 행 입력 */}
            <View className="mb-4 pl-4">
              <Text className="mb-3 text-base font-medium text-black">
                본 카운터
              </Text>
              <View className="mb-3 flex-row items-end pl-2">
                <View className="w-24 pr-3" />
                <View className="flex-1 pl-3">
                  <View className="flex-row">
                    <View className="flex-1 pr-2">
                      <Text className="text-center text-xs text-darkgray">
                        명령어
                      </Text>
                    </View>
                    <View className="flex-[2]">
                      <Text className="text-center text-xs text-darkgray">
                        유사어
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              {mainCounterVoiceCommandRows.map(renderVoiceCommandInputRow)}
            </View>

            {/* 보조 카운터: 행만 (컬럼 라벨은 위와 동일하게 한 번만) */}
            <View className="pl-4">
              <Text className="mb-3 text-base font-medium text-black">
                보조 카운터
              </Text>
              {subCounterVoiceCommandRows.map(renderVoiceCommandInputRow)}
            </View>
          </SettingsAccordion>
        </View>
        {!premiumUnlocked ? (
          <>
            <View
              className="pointer-events-none absolute inset-0 z-[5] bg-mediumgray"
              style={PREMIUM_OVERLAY_STYLE}
            />
            <TouchableOpacity
              activeOpacity={1}
              className="absolute inset-0 z-[10]"
              onPress={() => navigation.navigate('PremiumPurchase')}
              accessibilityRole="button"
              accessibilityLabel="사용자 설정, 프리미엄 전용"
              accessibilityHint="탭하면 프리미엄 구매 화면으로 이동합니다."
            />
            <View className="pointer-events-none absolute top-2 right-4 z-20 h-[52px] w-6 items-center justify-center">
              <Star
                size={22}
                color={appTheme.colors.premiumGold}
                fill={appTheme.colors.premiumGold}
              />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
};

export default SettingsVoiceCommands;
