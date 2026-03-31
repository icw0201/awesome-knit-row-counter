// src/components/counter/ColorPicker.tsx
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import ColorPickerIcon from '@assets/images/color_picker.svg';
import ColorPicker, { Panel1, Swatches, HueSlider } from 'reanimated-color-picker';
import { RULE_SWATCH_COLORS } from '@constants/colors';
import RoundedButton from '@components/common/RoundedButton';
import BaseModal from '@components/common/modals/BaseModal/BaseModal';

const SWATCH_ROW_SIZE = 5;

interface ColorPickerProps {
  selectedColor: string; // hex 색상 값 (예: '#fc3e39', 필수)
  onSelect: (color: string) => void; // hex 색상 값을 반환
}

/**
 * 컬러 픽커 컴포넌트
 * 클릭 가능한 컬러 픽커 아이콘 버튼 + reanimated-color-picker 모달
 */
const ColorPickerComponent: React.FC<ColorPickerProps> = ({
  selectedColor,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingColor, setPendingColor] = useState(selectedColor);

  const initialColor = selectedColor;

  const handlePress = () => {
    setPendingColor(initialColor);
    setModalVisible(true);
  };

  const handleColorChange = ({ hex }: { hex: string }) => {
    setPendingColor(hex);
  };

  const handleConfirm = () => {
    onSelect(pendingColor);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        className="w-8 h-8 justify-center items-center"
      >
        <ColorPickerIcon
          width={24}
          height={24}
          color={selectedColor}
        />
      </Pressable>

      {/* 색상 선택 모달 */}
      <BaseModal
        visible={modalVisible}
        onClose={handleCancel}
        title="색상 선택"
      >
        <View className="pb-2">
          {/* reanimated-color-picker는 style prop 필요 */}
          <ColorPicker
            value={pendingColor}
            style={{ width: '100%' }} // eslint-disable-line react-native/no-inline-styles
            onCompleteJS={handleColorChange}
            onChangeJS={handleColorChange}
          >
            {/* 2D 색상 패널 */}
            <Panel1 />
            <View className="h-3" />{/* 패널 ↔ Hue 슬라이더 간격 */}
            {/* 색조 슬라이더 */}
            <HueSlider />
            <View className="h-4" />{/* 슬라이더 ↔ 스와치 간격 */}
            <View>
              {/* 스와치 1행 (인덱스 0~4) */}
              <Swatches colors={RULE_SWATCH_COLORS.slice(0, SWATCH_ROW_SIZE)} />
              <View className="h-2" />{/* 스와치 행 간격 */}
              {/* 스와치 2행 (인덱스 5~9) */}
              <Swatches colors={RULE_SWATCH_COLORS.slice(SWATCH_ROW_SIZE, SWATCH_ROW_SIZE * 2)} />
            </View>
          </ColorPicker>
          <View className="mt-4 flex-row justify-evenly">{/* 컨텐츠 ↔ 버튼 영역 간격 */}
            <RoundedButton
              title="취소"
              colorStyle="light"
              onPress={handleCancel}
            />
            <RoundedButton
              title="확인"
              colorStyle="vivid"
              onPress={handleConfirm}
            />
          </View>
        </View>
      </BaseModal>
    </>
  );
};

export default ColorPickerComponent;
