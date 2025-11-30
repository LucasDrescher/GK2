// Centraliseret export af alle styles
import { StyleSheet } from 'react-native';

// Import farver
export { colors } from './colors';

// Import opdelte styles
import { layoutStyles } from './layoutStyles';
import { buttonStyles } from './buttonStyles';
import { inputStyles } from './inputStyles';
import { cardStyles } from './cardStyles';
import { textStyles } from './textStyles';
import { dashboardStyles } from './dashboardStyles';
import { modalStyles } from './modalStyles';
import { headerStyles } from './headerStyles';
import { menuStyles } from './menuStyles';
import { eventStyles } from './eventStyles';
import { cameraStyles } from './cameraStyles';

// Kombiner alle styles til globalStyles for backward compatibility
export const globalStyles = StyleSheet.create({
  ...layoutStyles,
  ...buttonStyles,
  ...inputStyles,
  ...cardStyles,
  ...textStyles,
  ...dashboardStyles,
  ...modalStyles,
  ...headerStyles,
  ...menuStyles,
  ...eventStyles,
  ...cameraStyles,
});

// Export individuelle style grupper for de der ønsker mere granulær import
export {
  layoutStyles,
  buttonStyles,
  inputStyles,
  cardStyles,
  textStyles,
  dashboardStyles,
  modalStyles,
  headerStyles,
  menuStyles,
  eventStyles,
  cameraStyles,
};

