// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { getDefaultHeaderLeft, getDefaultHeaderRight, getDefaultTitle } from './HeaderOptions';
import { StatusBar } from 'react-native';
import { appTheme } from '@styles/appTheme';

// 화면 컴포넌트들 import
import CounterDetail from '@screens/CounterDetail';
import Main from '@screens/Main';
import ProjectDetail from '@screens/ProjectDetail';
import Setting from '@screens/Setting';
import InfoScreen from '@screens/InfoScreen';
import WaySetting from '@screens/WaySetting';
import PremiumPurchase from '@screens/PremiumPurchase';

// 네비게이션 파라미터 타입 정의
export type RootStackParamList = {
  App: undefined;
  Home: undefined;
  Main: undefined;
  Setting: undefined;
  PremiumPurchase: undefined;
  ProjectDetail: { projectId: string };
  CounterDetail: { counterId: string };
  InfoScreen: { itemId: string };
  WaySetting: { counterId: string };
};

// 네비게이션 스택 생성
const Stack = createNativeStackNavigator<RootStackParamList>();

// 앱의 메인 네비게이션 컴포넌트
const AppNavigator = () => (
  <NavigationContainer>
    {/* 상태바 설정 */}
    <StatusBar
      barStyle="dark-content"
      backgroundColor={appTheme.colors.primary['50']}
    />

    {/* 네비게이션 스택 설정 */}
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        animation: 'fade', // 화면 전환 애니메이션
      }}
    >
      {/* 메인 화면 - 프로젝트 목록 */}
      <Stack.Screen
        name="Main"
        component={Main}
        options={({ navigation: _navigation }) => ({
          ...getDefaultTitle('프로젝트 목록'),
        })}
      />

      {/* 카운터 상세 화면 */}
      <Stack.Screen
        name="CounterDetail"
        component={CounterDetail}
        options={({ navigation, route: _route }) => ({
          ...getDefaultHeaderLeft(navigation),
          ...getDefaultTitle(''),
        })}
      />

      {/* 프로젝트 상세 화면 */}
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetail}
        options={({ navigation, route: _route }) => ({
          ...getDefaultHeaderLeft(navigation),
          ...getDefaultTitle(''),
        })}
      />

      {/* 설정 화면 */}
      <Stack.Screen
        name="Setting"
        component={Setting}
        options={({ navigation, route: _route }) => ({
          ...getDefaultHeaderLeft(navigation),
          ...getDefaultTitle('설정'),
        })}
      />

      {/* 프리미엄 구매 */}
      <Stack.Screen
        name="PremiumPurchase"
        component={PremiumPurchase}
        options={({ navigation, route: _route }) => ({
          ...getDefaultHeaderLeft(navigation),
          ...getDefaultTitle('프리미엄 버전'),
          headerStyle: { backgroundColor: appTheme.colors.white },
          headerShadowVisible: true,
        })}
      />

      {/* 정보 화면 */}
      <Stack.Screen
        name="InfoScreen"
        component={InfoScreen}
        options={({ navigation, route: _route }) => ({
          ...getDefaultHeaderLeft(navigation),
          ...getDefaultHeaderRight(navigation),
          ...getDefaultTitle(''),
        })}
      />

      {/* Way 설정 화면 */}
      <Stack.Screen
        name="WaySetting"
        component={WaySetting}
        options={({ navigation, route: _route }) => ({
          ...getDefaultHeaderLeft(navigation),
          ...getDefaultHeaderRight(navigation),
          ...getDefaultTitle('어쩌미 알림 단 설정'),
        })}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
