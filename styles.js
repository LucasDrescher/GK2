// styles.js
import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 5,
  },
  
  // AdminShiftList styles - Kompakt version
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  
  // Buttons
  addBtn: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    fontSize: 20,
    color: "#fff",
  },
  viewToggleBtn: {
    backgroundColor: "#6c757d",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  viewToggleBtnText: {
    fontSize: 18,
  },
  
  // Day & Week view
  dayHeader: {
    backgroundColor: "#007AFF",
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  dayHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  
  // Shift cards
  shiftCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  shiftTimeContainer: {
    marginRight: 16,
  },
  shiftTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  shiftDetails: {
    flex: 1,
  },
  shiftArea: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  shiftContact: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  shiftEmployees: {
    fontSize: 14,
    color: "#28a745",
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 18,
  },
  
  // Week navigation
  weekNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    marginBottom: 16,
  },
  navBtn: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  navBtnText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  weekText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  weekDay: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  weekendDay: {
    backgroundColor: "#f8f9fa",
  },
  weekDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#007AFF",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  weekDayHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  addShiftBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  addShiftBtnText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  noShiftsText: {
    padding: 16,
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  // Admin Dashboard styles
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  dashboardHeader: {
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff'
  },
  dashboardTitle: { fontSize: 22, fontWeight: '700', color: '#111' },
  tabContainer: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { paddingHorizontal: 12, paddingVertical: 10 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#007AFF' },
  tabText: { color: '#666' },
  activeTabText: { color: '#007AFF', fontWeight: '600' },
  tabContent: { flex: 1, padding: 12 },
  subsectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 14, color: '#666', marginTop: 6 },
  top3Container: { marginTop: 16 },
  employeeBadge: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 8 },
  employeeName: { fontSize: 16, fontWeight: '600' },
  employeeStats: { fontSize: 14, color: '#666' },
  naText: { color: '#666', fontStyle: 'italic', marginTop: 8 },
  // Common/shared styles for previously inline styles
  safeAreaWhite: { flex: 1, backgroundColor: '#fff' },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  modalPickerContainer: { height: 240, width: '100%', justifyContent: 'center' },
  fullWidth: { width: '100%' },
  countryTextLight: { color: '#888' },
  countryTextDark: { color: '#000' },
  rowGap8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex1: { flex: 1 },
  passportThumb: { width: 64, height: 44, borderRadius: 6 },
  imageFullContain: { width: '100%', height: 400, resizeMode: 'contain' },
  textMuted: { color: '#333' },
  centerAligned: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  blueLink: { color: 'blue' },
  cameraWrapper: { flex: 1, position: 'relative', backgroundColor: 'black' },
  cameraView: { flex: 1, width: '100%' },
  overlayAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  topRightPadding16: { alignItems: 'flex-end', padding: 16 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 20 },
  smallPadding: { padding: 8 },
  snapButtonOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  snapButtonInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  zoomControls: { alignItems: 'center' },
  // Small helpers for admin lists
  centerTextMuted: { textAlign: 'center', color: '#666' },
  paddingH16T16: { paddingHorizontal: 16, paddingTop: 16 },
  marginTop24: { marginTop: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  smallHeight12: { height: 12 },
  weekShiftCard: {
    backgroundColor: "#f8f9fa",
    margin: 8,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#28a745",
  },
  weekShiftTime: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  weekShiftArea: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  weekShiftEmployees: {
    fontSize: 12,
    color: "#666",
  },
  
  // Modal & Forms
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  shiftInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 12,
  },
  
  // Kompakt Date/Time - Start og slut tid i samme række
  dateTimeSection: {
    marginBottom: 20,
  },
  dateTimeGroup: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  modernDateTimeBtn: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
    alignItems: "center",
  },
  modernDateTimeBtnActive: {
    borderColor: "#007AFF",
    backgroundColor: "#e7f3ff",
  },
  dateTimeBtnContent: {
    alignItems: "center",
  },
  dateTimeBtnIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  dateTimeBtnLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  dateTimeBtnValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  modernPickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  modernPickerDoneBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: "center",
  },
  modernPickerDoneBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  
  // Employee assignment
  assignedEmployeeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e7f3ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  assignedEmployeeText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  removeBtn: {
    padding: 4,
  },
  removeBtnText: {
    fontSize: 16,
  },
  assignBtn: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  assignBtnSelected: {
    backgroundColor: "#e7f3ff",
    borderColor: "#007AFF",
  },
  assignText: {
    fontSize: 16,
    color: "#333",
  },
  assignTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },

  // EmployeeManagement styles
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  employeeCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  employeeDetails: {
    marginTop: 5,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contractStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitleEmployee: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  statusBadgeLarge: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTextLarge: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 130,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  // Vagter sektion i medarbejder detaljer
  shiftsContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f9ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  shiftsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  shiftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'white',
    borderRadius: 6,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  shiftDateArea: {
    flex: 1,
  },
  shiftDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  shiftArea: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  shiftTime: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  noShiftsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  signatureContainer: {
    marginBottom: 20,
  },
  signatureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  signatureImage: {
    width: '100%',
    height: 100,
    resizeMode: 'contain',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  deleteButton: {
    backgroundColor: '#FF5722',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // AdminShiftList toggle styles
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // More Menu styles (MoreMenuScreen & EmployeeMoreScreen)
  moreMenuContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  moreMenuHeader: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  moreMenuHeaderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  moreMenuItemsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  moreMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreMenuIcon: {
    marginRight: 12,
  },
  moreMenuItemText: {
    fontSize: 16,
    color: '#333',
  },

  // AdminCreateEventScreen styles
  eventScreenContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  eventScrollView: {
    flex: 1,
  },
  eventContent: {
    padding: 16,
    paddingBottom: 40,
  },
  eventSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  eventInputContainer: {
    marginBottom: 16,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  eventInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  eventTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  eventDateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  eventDateTimeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDateTimeTextContainer: {
    marginLeft: 12,
  },
  eventDateTimeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  eventDateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  eventTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventHalfWidth: {
    width: '48%',
  },
  eventEmployeeList: {
    gap: 8,
  },
  eventEmployeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  eventEmployeeItemSelected: {
    backgroundColor: '#e7f3ff',
    borderColor: '#007AFF',
  },
  eventEmployeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventAvatarSelected: {
    backgroundColor: '#007AFF',
  },
  eventAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  eventAvatarTextSelected: {
    color: '#fff',
  },
  eventEmployeeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  eventEmployeeNameSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  eventEmptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  eventExpenseList: {
    gap: 8,
    marginBottom: 16,
  },
  eventExpenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  eventExpenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e7f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventExpenseDetails: {
    flex: 1,
  },
  eventExpenseDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  eventExpenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  eventAddExpenseContainer: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  eventSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  eventSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  eventActionButtons: {
    gap: 12,
    marginTop: 8,
  },
  eventPrimaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  eventButtonDisabled: {
    opacity: 0.6,
  },
  eventPrimaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  eventDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ff3b30',
    gap: 8,
  },
  eventDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  eventModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  eventModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  eventModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  eventModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  eventModalCancelButton: {
    fontSize: 17,
    color: '#666',
  },
  eventModalDoneButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  eventPicker: {
    width: '100%',
    height: 200,
  },

  // ShiftListScreen (medarbejder vagtoversigt) styles
  // Employee shift card styles (for ShiftListScreen)
  employeeShiftCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  shiftCardPast: {
    opacity: 0.6,
    borderLeftColor: "#999",
  },
  shiftCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  shiftCardDate: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
  },
  pastBadge: {
    backgroundColor: "#999",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pastBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  shiftCardBody: {
    gap: 12,
  },
  shiftCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  shiftCardLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#555",
    width: 80,
  },
  shiftCardValue: {
    fontSize: 15,
    color: "#222",
    flex: 1,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
  },
});
