import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../constants/colors';

export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : LightColors;
}
