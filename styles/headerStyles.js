// Header styles for different screens
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  
  moreMenuHeader: {
    backgroundColor: colors.surface,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  
  moreMenuHeaderText: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: colors.text 
  },
});
