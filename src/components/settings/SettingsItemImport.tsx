import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Star } from 'lucide-react-native';

import { ConfirmModal } from '@components/common/modals';
import type { RootStackParamList } from '@navigation/AppNavigator';
import { useIapContext } from '@provider/IapProvider';
import { appTheme } from '@styles/appTheme';
import { colorStyles } from '@styles/colorStyles';
import {
  getBundledItemImportDocument,
  getItemImportSummary,
  importItemImportDocument,
  pickItemImportDocument,
} from '@storage/backup';
import type { ItemImportDocument } from '@storage/types';
import IconBox from './IconBox';
import SettingsSectionHeader from './SettingsSectionHeader';

interface SettingsItemImportProps {}

const PREMIUM_OVERLAY_STYLE = StyleSheet.create({
  overlay: {
    mixBlendMode: 'multiply',
  },
}).overlay;

const SettingsItemImport: React.FC<SettingsItemImportProps> = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { premiumUnlocked } = useIapContext();
  const { containerClassName, textClassName } = colorStyles.light;
  const onNoticeConfirmRef = useRef<(() => void) | null>(null);

  const [pendingImportDocument, setPendingImportDocument] = useState<ItemImportDocument | null>(
    null
  );
  const [importConfirmVisible, setImportConfirmVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const resetToMain = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  }, [navigation]);

  const showErrorModal = useCallback((message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  }, []);

  const showNoticeModal = useCallback((
    title: string,
    description: string,
    onConfirm?: () => void
  ) => {
    onNoticeConfirmRef.current = onConfirm ?? null;
    setNoticeTitle(title);
    setNoticeMessage(description);
    setNoticeModalVisible(true);
  }, []);

  const getReadableErrorMessage = useCallback((error: unknown) => {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return '처리 중 오류가 발생했습니다.';
  }, []);

  const prepareImportDocument = useCallback((document: ItemImportDocument) => {
    setPendingImportDocument(document);
    setImportConfirmVisible(true);
  }, []);

  const handleSampleItemImportPress = useCallback(async () => {
    if (isBusy) {
      return;
    }

    setIsBusy(true);

    try {
      const document = getBundledItemImportDocument();
      prepareImportDocument(document);
    } catch (error) {
      showErrorModal(getReadableErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }, [getReadableErrorMessage, isBusy, prepareImportDocument, showErrorModal]);

  const handleItemImportPress = useCallback(async () => {
    if (isBusy) {
      return;
    }

    setIsBusy(true);

    try {
      const document = await pickItemImportDocument();

      if (!document) {
        return;
      }

      prepareImportDocument(document);
    } catch (error) {
      showErrorModal(getReadableErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }, [getReadableErrorMessage, isBusy, prepareImportDocument, showErrorModal]);

  const handleImportConfirm = useCallback(async () => {
    if (!pendingImportDocument) {
      return;
    }

    setIsBusy(true);

    try {
      await importItemImportDocument(pendingImportDocument);
      setPendingImportDocument(null);
      showNoticeModal(
        '프로젝트 불러오기 완료',
        '프로젝트 데이터를 불러왔습니다.\n확인을 누르면 메인 화면으로 돌아갑니다.',
        resetToMain
      );
    } catch (error) {
      console.error('SettingsItemImport: import item document failed', error);
      showErrorModal(getReadableErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }, [
    getReadableErrorMessage,
    pendingImportDocument,
    resetToMain,
    showErrorModal,
    showNoticeModal,
  ]);

  const handleNoticeConfirm = useCallback(() => {
    const callback = onNoticeConfirmRef.current;
    onNoticeConfirmRef.current = null;
    callback?.();
  }, []);

  const importDescription = pendingImportDocument
    ? (() => {
      const summary = getItemImportSummary(pendingImportDocument);

      return [
        '불러오기를 진행하면 현재 기기의 데이터에 프로젝트가 추가됩니다.',
        '',
        `프로젝트: ${summary.projectCount}개`,
        `카운터: ${summary.counterCount}개`,
        `전체 항목: ${summary.totalItems}개`,
      ].join('\n');
    })()
    : '';

  return (
    <>
      <View className="mb-8">
        <SettingsSectionHeader
          title="프로젝트 불러오기"
          tooltipText={
            [
              '어쩜 전용 파일을 제공하는 도안을 구매하셨다면, 미리 세팅된 프로젝트 파일을 불러와 사용하세요!',
              '',
              '불러오기 전용 json 파일을 제작하고 싶은 도아너라면, 문의하기를 통해 연락 주세요. 협업해주시는 도아너님께 프리미엄 앱 코드를 발송해드립니다.',
            ].join('\n')
          }
        />
        <Text className={`px-2 pb-2 text-xs ${appTheme.tw.text.darkgray}`}>
          목표단수, 알림설정이 미리 세팅된 프로젝트 파일을{'\n'}
          불러올 수 있습니다.
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await handleSampleItemImportPress();
          }}
          activeOpacity={0.7}
          disabled={isBusy}
        >
          <View className={`m-1.5 rounded-2xl p-4 ${containerClassName}`}>
            <View className="flex-row items-center justify-between py-3">
              <Text className={`text-base font-semibold ${textClassName}`}>
                {isBusy ? '처리 중...' : '맛보기 프로젝트 불러오기'}
              </Text>
              <Text className={`text-sm font-bold ${appTheme.tw.text.primary['500']}`}>
                try it!
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View className="relative">
          <IconBox
            title={isBusy ? '처리 중...' : '프로젝트 불러오기'}
            iconName="upload"
            disabled={!premiumUnlocked || isBusy}
            onPress={async () => {
              await handleItemImportPress();
            }}
          />
          {!premiumUnlocked ? (
            <>
              <View
                className="pointer-events-none absolute -inset-2 z-[5] rounded-2xl bg-mediumgray overflow-hidden"
                style={PREMIUM_OVERLAY_STYLE}
              />
              <TouchableOpacity
                activeOpacity={1}
                className="absolute -inset-2 z-[10] rounded-2xl"
                onPress={() => navigation.navigate('PremiumPurchase')}
                accessibilityRole="button"
                accessibilityLabel="프로젝트 불러오기, 프리미엄 전용"
                accessibilityHint="탭하면 프리미엄 구매 화면으로 이동합니다."
              />
              <View className="pointer-events-none absolute inset-y-0 right-4 z-[20] w-6 items-center justify-center">
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

      <ConfirmModal
        visible={importConfirmVisible}
        onClose={() => {
          setImportConfirmVisible(false);
          setPendingImportDocument(null);
        }}
        title="프로젝트 불러오기"
        description={importDescription}
        onConfirm={async () => {
          await handleImportConfirm();
        }}
        confirmText="불러오기"
        cancelText="취소"
      />

      <ConfirmModal
        visible={noticeModalVisible}
        onClose={() => {
          onNoticeConfirmRef.current = null;
          setNoticeModalVisible(false);
        }}
        title={noticeTitle}
        description={noticeMessage}
        onConfirm={handleNoticeConfirm}
        confirmText="확인"
        cancelText=""
      />

      <ConfirmModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title="오류"
        description={errorMessage}
        onConfirm={() => setErrorModalVisible(false)}
        confirmText="확인"
        cancelText=""
      />
    </>
  );
};

export default SettingsItemImport;
