// Modal styles
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  
  modalBackdrop: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.overlay 
  },
  
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  
  modalTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: colors.text, 
    marginBottom: 20, 
    textAlign: 'center' 
  },
});
