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
});
