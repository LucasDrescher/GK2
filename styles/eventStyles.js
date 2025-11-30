// Event screen styles
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const eventStyles = StyleSheet.create({
  eventScreenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  eventScrollView: {
    flex: 1,
  },
  
  eventContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  
  eventSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  eventSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  
  eventInputContainer: {
    marginBottom: 16,
  },
  
  eventLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  
  eventInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  
  eventTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  dateTimeGroup: {
    marginBottom: 16,
  },
  
  modernDateTimeBtn: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray300,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  modernDateTimeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  
  modernDateTimeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginLeft: 12,
  },
  
  dateTimeBtnContent: {
    gap: 4,
  },
  
  dateTimeBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  dateTimeBtnValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  
  modernPickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  
  modernPickerDoneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  
  modernPickerDoneBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  eventEmployeeList: {
    maxHeight: 200,
  },
  
  eventEmployeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  
  eventEmployeeSelected: {
    backgroundColor: colors.primaryLight + '30',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  
  eventEmployeeName: {
    fontSize: 16,
    color: colors.text,
  },
  
  eventExpenseList: {
    marginBottom: 16,
  },
  
  eventExpenseItem: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  
  eventExpenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  eventExpenseDetails: {
    flex: 1,
  },
  
  eventExpenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  
  eventExpenseAmount: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  
  eventAddExpenseContainer: {
    gap: 12,
    marginTop: 16,
  },
  
  eventEmptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  eventActionButtons: {
    marginTop: 24,
    gap: 12,
  },
  
  eventPrimaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  eventPrimaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  
  eventSecondaryButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  
  eventSecondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  eventDeleteButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  
  eventDeleteButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  
  eventButtonDisabled: {
    opacity: 0.5,
  },
});
