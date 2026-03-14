import React from 'react';
import { ChevronLeft, Settings, Trash2, Info, ArrowDownUp, Timer } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './AppNavigator';

import { View, TouchableOpacity } from 'react-native';
import ActivateToggle from '@components/common/ActivateToggle';

export const getDefaultHeaderLeft = (
  navigation: any
) => ({
  headerLeft: () => (
    <View className="mr-2 items-center">
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <ChevronLeft size={28} color="black" />
      </TouchableOpacity>
    </View>
  ),
});

//setting only (Info 페이지)
export const getDefaultHeaderRight = (
  navigation: NativeStackNavigationProp<RootStackParamList>
) => ({
  headerRight: () => (
    <TouchableOpacity onPress={() => navigation.navigate('Setting')}>
      <Settings size={24} color="black" />
    </TouchableOpacity>
  ),
});

//지우기, 세팅 (Main페이지)
export const getHeaderRightWithEditAndSettings = (
  navigation: NativeStackNavigationProp<RootStackParamList>,
  onEditPress: () => void,
  onSortPress: () => void
): React.JSX.Element => {
  return (
    <View className="flex-row">
      <TouchableOpacity onPress={onSortPress} style={{ marginRight: 12 }}>
        <ArrowDownUp size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onEditPress} style={{ marginRight: 12 }}>
        <Trash2 size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Setting')}>
        <Settings size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
};

//인포, 지우기, 세팅 (프로젝트 Detail 페이지)
export const getHeaderRightWithInfoEditAndSettings = (
  navigation: NativeStackNavigationProp<RootStackParamList>,
  onInfoPress: () => void,
  onEditPress: () => void,
  onSortPress: () => void
): React.JSX.Element => {
  return (
    <View className="flex-row">
      <TouchableOpacity onPress={onInfoPress} style={{ marginRight: 13 }}>
        <Info size={26} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onSortPress} style={{ marginRight: 12 }}>
        <ArrowDownUp size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onEditPress} style={{ marginRight: 12 }}>
        <Trash2 size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Setting')}>
        <Settings size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
};

//활성이, 인포, 세팅 (CounterDetail전용)
export const getHeaderRightWithActivateInfoSettings = (
  navigation: NativeStackNavigationProp<RootStackParamList>,
  mascotIsActive: boolean,
  onActivatePress: () => void,
  timerIsActive: boolean,
  onTimerPress: () => void,
  counterId: string,
  onInfoPress: () => void
): React.JSX.Element => {
  return (
    <View className="flex-row items-center">
      {/* Timer 아이콘 */}
      <TouchableOpacity onPress={onTimerPress} style={{ marginRight: 13 }}>
        <Timer size={24} color={timerIsActive ? 'black' : '#B8B8B8'} />
      </TouchableOpacity>

      {/* 활성 아이콘 */}
      <View style={{ marginRight: 13 }}>
        <ActivateToggle
          mascotIsActive={mascotIsActive}
          onToggle={onActivatePress}
          onLongPress={() => navigation.navigate('WaySetting', { counterId })}
        />
      </View>

      {/* Info 버튼 */}
      <TouchableOpacity onPress={onInfoPress} style={{ marginRight: 12 }}>
        <Info size={26} color="black" />
      </TouchableOpacity>

      {/* 설정 */}
      <TouchableOpacity onPress={() => navigation.navigate('Setting')} style={{ marginRight: 4 }}>
        <Settings size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
};

export const getDefaultTitle = (title: string) => ({
  title,
});
