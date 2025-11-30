// Menu styles
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const menuStyles = StyleSheet.create({
  moreMenuContainer: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  
  moreMenuItemsContainer: {
    backgroundColor: colors.surface,
    marginTop: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  
  moreMenuItemLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  
  moreMenuIcon: { 
    marginRight: 12 
  },
  
  moreMenuItemText: { 
    fontSize: 16, 
    color: colors.text 
  },
});
