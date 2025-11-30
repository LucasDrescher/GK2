// Dashboard specific styles
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const dashboardStyles = StyleSheet.create({
  dashboardContainer: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  
  dashboardHeader: {
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.surface,
  },
  
  dashboardTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: colors.text 
  },
  
  tabContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.surface,
  },
  
  tab: { 
    paddingHorizontal: 12, 
    paddingVertical: 10 
  },
  
  activeTab: { 
    borderBottomWidth: 3, 
    borderBottomColor: colors.primary 
  },
  
  tabText: { 
    color: colors.textLight, 
    fontSize: 16 
  },
  
  activeTabText: { 
    color: colors.primary, 
    fontWeight: '600', 
    fontSize: 16 
  },
  
  tabContent: { 
    flex: 1, 
    padding: 12 
  },
  
  subsectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 8, 
    color: colors.text 
  },
  
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
});
