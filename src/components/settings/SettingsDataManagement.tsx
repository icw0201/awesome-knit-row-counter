import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { ConfirmModal } from '@components/common/modals';
import { clearAllProjectData } from '@storage/storage';
import IconBox from './IconBox';
import { appTheme } from '@styles/appTheme';

interface SettingsDataManagementProps {}

const SettingsDataManagement: React.FC<SettingsDataManagementProps> = () => {
  const navigation = useNavigation();
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showErrorModal = useCallback((message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  }, []);

  /**
   * 초기화 확인 모달 열기
   */
  const handleResetPress = () => {
    setResetModalVisible(true);
  };

  /**
   * 초기화 실행 및 앱 재시작
   */
  const handleResetConfirm = () => {
    try {
      // 모든 프로젝트 데이터 삭제
      clearAllProjectData();

      // 상태 초기화
      setResetModalVisible(false);

      // 앱을 Main 화면으로 재시작
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error) {
      showErrorModal('초기화 중 오류가 발생했습니다.');
    }
  };

  /**
   * 초기화 모달 닫기 및 상태 초기화
   */
  const handleResetModalClose = () => {
    setResetModalVisible(false);
  };

  return (
    <>
      <View className="mb-8">
        <Text className={`mb-3 px-1 text-sm font-semibold ${appTheme.tw.text.primary['500']}`}>
          데이터 관리
        </Text>
        <IconBox
          title="초기화하기"
          iconName="trash-2"
          onPress={handleResetPress}
        />
      </View>

      <ConfirmModal
        visible={resetModalVisible}
        onClose={handleResetModalClose}
        title="초기화"
        description="정말 프로젝트 정보를 모두 삭제하시겠습니까?"
        onConfirm={handleResetConfirm}
        confirmText="삭제"
        cancelText="취소"
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

export default SettingsDataManagement;
