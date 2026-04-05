// src/screens/InfoScreen.tsx

import React, { useRef } from 'react';
import { ScrollView, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TextInputBox, { TextInputBoxRef } from '@components/common/TextInputBox';
import RoundedButton from '@components/common/RoundedButton';
import { ConfirmModal } from '@components/common/modals';
import { screenStyles, safeAreaEdges } from '@styles/screenStyles';

import { useItemInfo } from '@hooks/useItemInfo';

/**
 * 정보 화면 컴포넌트
 * 프로젝트나 카운터의 상세 정보(시작일, 종료일, 게이지, 실, 바늘, 기타 메모)를
 * 편집하고 저장할 수 있는 화면입니다.
 */
const InfoScreen = () => {
  const {
    // 폼 상태
    title,
    setTitle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    gauge,
    setGauge,
    yarn,
    setYarn,
    needle,
    setNeedle,
    notes,
    setNotes,
    isRootLevelItem,
    itemType,
    // 모달 상태
    showSaveConfirmModal,
    showTitleErrorModal,
    setShowTitleErrorModal,
    // 핸들러
    handleSave,
    handleSaveConfirm,
    handleModalClose,
    handleCancel,
    // 상태
    isSaveButtonActive,
  } = useItemInfo();

  // TextInputBox refs
  const titleInputRef = useRef<TextInputBoxRef>(null);
  const startDateInputRef = useRef<TextInputBoxRef>(null);
  const endDateInputRef = useRef<TextInputBoxRef>(null);
  const gaugeInputRef = useRef<TextInputBoxRef>(null);
  const titleFieldText = itemType === 'counter' ? '카운터명' : '프로젝트명';

  return (
    <SafeAreaView style={screenStyles.flex1} edges={safeAreaEdges}>
      <KeyboardAvoidingView
        style={screenStyles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80} // 헤더 높이 조정
      >
        <ScrollView contentContainerStyle={screenStyles.scrollViewContent}>
          {/* 제목 입력 필드 */}
          <TextInputBox
            ref={titleInputRef}
            label={titleFieldText}
            value={title}
            onChangeText={setTitle}
            placeholder={titleFieldText}
            type="text"
            required
            returnKeyType={isRootLevelItem ? 'next' : 'done'}
            onSubmitEditing={
              isRootLevelItem ? () => startDateInputRef.current?.focus() : undefined
            }
            blurOnSubmit={!isRootLevelItem}
          />

          {isRootLevelItem && (
            <>
              {/* 날짜 입력 필드들 (좌우 배치) */}
              <View className="flex-row justify-between">
                <View className="flex-1 mr-2">
                  <TextInputBox
                    ref={startDateInputRef}
                    label="시작일"
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="yyyy.mm.dd"
                    type="date"
                    returnKeyType="next"
                    onSubmitEditing={() => endDateInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
                <View className="flex-1 ml-2">
                  <TextInputBox
                    ref={endDateInputRef}
                    label="종료일"
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="yyyy.mm.dd"
                    type="date"
                    returnKeyType="next"
                    onSubmitEditing={() => gaugeInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* 게이지 입력 필드 */}
              <TextInputBox
                ref={gaugeInputRef}
                label="게이지"
                value={gauge}
                onChangeText={setGauge}
                placeholder="게이지"
                type="longText"
              />

              {/* 실 정보 입력 필드 */}
              <TextInputBox
                label="실"
                value={yarn}
                onChangeText={setYarn}
                placeholder="사용한 실"
                type="longText"
              />

              {/* 바늘 정보 입력 필드 */}
              <TextInputBox
                label="바늘"
                value={needle}
                onChangeText={setNeedle}
                placeholder="사용한 바늘"
                type="longText"
              />

              {/* 기타 메모 입력 필드 */}
              <TextInputBox
                label="기타"
                value={notes}
                onChangeText={setNotes}
                placeholder="기타 정보"
                type="longText"
              />
            </>
          )}

          {/* 하단 액션 버튼들 */}
          <View className="flex-row justify-evenly mt-2">
            {/* 취소 버튼 */}
            <RoundedButton
              title="취소"
              onPress={handleCancel}
              colorStyle="light"
            />

            {/* 저장 버튼 */}
            <RoundedButton
              title="저장"
              onPress={handleSave}
              colorStyle={isSaveButtonActive ? 'vivid' : undefined}
              containerClassName={!isSaveButtonActive ? 'bg-lightgray' : undefined}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 저장 확인 모달 */}
      <ConfirmModal
        visible={showSaveConfirmModal}
        onClose={handleModalClose}
        title="저장하기"
        description="저장하지 않은 내용이 있습니다. 저장하시겠습니까?"
        onConfirm={handleSaveConfirm}
        confirmText="저장"
        cancelText="나가기"
      />

      {/* 제목 필수 에러 모달 */}
      <ConfirmModal
        visible={showTitleErrorModal}
        onClose={() => setShowTitleErrorModal(false)}
        title="이름"
        description="프로젝트명 또는 카운터명은 빈 칸으로 둘 수 없습니다"
        onConfirm={() => setShowTitleErrorModal(false)}
        confirmText="확인"
        cancelText=""
      />
    </SafeAreaView>
  );
};

export default InfoScreen;
