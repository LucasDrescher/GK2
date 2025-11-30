// Camera specific styles
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const cameraStyles = StyleSheet.create({
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  
  cameraView: {
    flex: 1,
  },
  
  overlayAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  
  topRightPadding16: {
    alignSelf: 'flex-end',
    padding: 16,
  },
  
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  
  snapButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  
  snapButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
  },
  
  zoomControls: {
    flexDirection: 'column',
    gap: 8,
  },
  
  smallPadding: {
    padding: 8,
  },
  
  passportStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
