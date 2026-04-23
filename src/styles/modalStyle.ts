// src/styles/modalStyle.ts

import { StyleSheet } from 'react-native';
import { getAppTheme } from '@styles/appTheme';

export const createModalStyles = () => {
  const theme = getAppTheme();

  return StyleSheet.create({
    overlay: {
      flex: 1,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    container: {
      width: 320, // Tailwind 기준 w-80
      backgroundColor: theme.colors.white,
      borderRadius: 16, // rounded-2xl
      padding: 24, // p-6
      gap: 12, // space-y-6
    },
    title: {
      fontSize: 18, // text-lg
      fontWeight: 'bold',
      color: theme.colors.black,
    },
    description: {
      fontSize: 16, // text-base
      color: theme.colors.darkgray,
      marginTop: 8,
    },
  });
};
