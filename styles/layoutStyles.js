// Common layout styles
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const layoutStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  
  safeAreaWhite: { 
    flex: 1, 
    backgroundColor: colors.surface 
  },
  
  // Flex utilities
  flex1: { 
    flex: 1 
  },
  
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  centerAligned: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  fullWidth: { 
    width: '100%' 
  },
  
  // Empty state
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 50 
  },
});
