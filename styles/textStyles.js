// Text styles
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const textStyles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  
  text: {
    fontSize: 16,
    color: colors.text,
  },
  
  textLight: {
    fontSize: 14,
    color: colors.textLight,
  },
  
  textMuted: { 
    color: colors.textMuted 
  },
  
  itemText: {
    fontSize: 16,
    marginBottom: 5,
    color: colors.text,
  },
  
  emptyText: { 
    fontSize: 16, 
    color: colors.textLight, 
    textAlign: 'center' 
  },
  
  noShiftsText: { 
    padding: 16, 
    textAlign: 'center', 
    color: colors.textLight, 
    fontStyle: 'italic' 
  },
  
  employeeName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.text, 
    marginBottom: 4 
  },
  
  employeeEmail: { 
    fontSize: 14, 
    color: colors.textLight 
  },
  
  shiftTime: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: colors.primary 
  },
  
  shiftArea: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: colors.text, 
    marginBottom: 4 
  },
  
  shiftContact: { 
    fontSize: 14, 
    color: colors.textLight, 
    marginBottom: 4 
  },
  
  shiftEmployees: { 
    fontSize: 14, 
    color: colors.success 
  },
  
  statNumber: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: colors.text 
  },
  
  statLabel: { 
    fontSize: 14, 
    color: colors.textLight, 
    marginTop: 6, 
    textAlign: 'center' 
  },
  
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.text, 
    marginTop: 20, 
    marginBottom: 12 
  },
  
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  
  permissionText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  
  blueLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
