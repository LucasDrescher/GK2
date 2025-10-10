import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from "react-native-safe-area-context";
import { rtdb } from "../database/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import { globalStyles } from "../styles";



export default function AdminShiftList({ route, navigation }) {
  const { companyCode } = route.params || {};
  const [shifts, setShifts] = useState(null);
  const [employees, setEmployees] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    area: "",
    contactPerson: "",
    startTime: "",
    endTime: "",
    assignedTo: [],
    date: new Date(),
  });
  const [searchText, setSearchText] = useState("");
  const [shiftSearchText, setShiftSearchText] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState("list"); // "list" eller "week"

  // Hent vagter og medarbejdere
  useEffect(() => {
    if (!companyCode) return;
    const shiftRef = ref(rtdb, `companies/${companyCode}/shifts`);
    const unsubscribe = onValue(shiftRef, (snap) => {
      const data = snap.val();
      setShifts(data || {});
    });

    const empRef = ref(rtdb, `companies/${companyCode}/employees`);
    const unsubEmp = onValue(empRef, (snap) => {
      const data = snap.val();
      // Filtrer kun godkendte medarbejdere
      const approvedEmployees = {};
      if (data) {
        Object.entries(data).forEach(([id, emp]) => {
          if (emp.approved === true && emp.role === "employee") {
            approvedEmployees[id] = emp;
          }
        });
      }
      setEmployees(approvedEmployees);
    });

    return () => {
      unsubscribe();
      unsubEmp();
    };
  }, [companyCode]);

  // Hjælpefunktioner til dato og tid
  const formatDate = (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('da-DK', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (date) => {
    return date.toTimeString().slice(0, 5); // HH:MM
  };

  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getShiftsForDate = (date) => {
    const dateStr = formatDate(date);
    return Object.entries(shifts).filter(([id, shift]) => {
      return shift.date === dateStr;
    });
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const onStartTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (selectedTime) {
      setFormData({ ...formData, startTime: formatTime(selectedTime) });
    }
  };

  const onEndTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (selectedTime) {
      setFormData({ ...formData, endTime: formatTime(selectedTime) });
    }
  };

  const toggleEmployee = (employeeId, employeeName) => {
    const currentAssigned = formData.assignedTo || [];
    const employeeData = { id: employeeId, name: employeeName };
    
    const isAssigned = currentAssigned.some(emp => emp.id === employeeId);
    
    if (isAssigned) {
      // Fjern medarbejder
      const updatedAssigned = currentAssigned.filter(emp => emp.id !== employeeId);
      setFormData({ ...formData, assignedTo: updatedAssigned });
    } else {
      // Tilføj medarbejder
      setFormData({ ...formData, assignedTo: [...currentAssigned, employeeData] });
    }
  };

  const removeEmployee = (employeeId) => {
    const updatedAssigned = formData.assignedTo.filter(emp => emp.id !== employeeId);
    setFormData({ ...formData, assignedTo: updatedAssigned });
  };

  // Filtrer medarbejdere baseret på søgetekst
  const filteredEmployees = Object.entries(employees).filter(([id, emp]) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const email = emp.email?.toLowerCase() || "";
    const search = searchText.toLowerCase();
    
    return fullName.includes(search) || email.includes(search);
  });

  // Filtrer vagter baseret på søgetekst (kun medarbejdernavne)
  const filteredShifts = shifts ? Object.entries(shifts).filter(([id, shift]) => {
    const search = shiftSearchText.toLowerCase();
    const assignedEmployees = Array.isArray(shift.assignedTo) 
      ? shift.assignedTo.map(emp => (emp.name || emp).toLowerCase()).join(" ")
      : (shift.assignedTo?.toLowerCase() || "");
    
    return assignedEmployees.includes(search);
  }) : [];

  const openModal = (shiftId = null, presetDate = null) => {
    if (shiftId && shifts && shifts[shiftId]) {
      setEditingId(shiftId);
      const shiftData = shifts[shiftId];
      setFormData({
        ...shiftData,
        date: shiftData.date ? new Date(shiftData.date) : new Date(),
        assignedTo: Array.isArray(shiftData.assignedTo) ? shiftData.assignedTo : 
                   shiftData.assignedTo ? [{ name: shiftData.assignedTo }] : [],
      });
    } else {
      setEditingId(null);
      setFormData({
        area: "",
        contactPerson: "",
        startTime: "",
        endTime: "",
        assignedTo: [],
        date: presetDate || new Date(),
      });
    }
    setSearchText("");
    setModalVisible(true);
  };

  const saveShift = async () => {
    if (
      !formData.area.trim() ||
      !formData.contactPerson.trim() ||
      !formData.startTime.trim() ||
      !formData.endTime.trim()
    ) {
      return Alert.alert("Udfyld alle felter!");
    }

    const shiftData = {
      ...formData,
      date: formatDate(formData.date),
    };

    try {
      if (editingId) {
        await update(ref(rtdb, `companies/${companyCode}/shifts/${editingId}`), shiftData);
        Alert.alert("Vagt opdateret");
      } else {
        await push(ref(rtdb, `companies/${companyCode}/shifts`), shiftData);
        Alert.alert("Ny vagt oprettet");
      }
      setModalVisible(false);
      setSearchText("");
    } catch (e) {
      Alert.alert("Fejl: " + e.message);
    }
  };

  const deleteShift = async (id) => {
    try {
      await remove(ref(rtdb, `companies/${companyCode}/shifts/${id}`));
      Alert.alert("Vagt slettet");
    } catch (e) {
      Alert.alert("Fejl: " + e.message);
    }
  };

  if (shifts === null) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={[globalStyles.center, { marginTop: 50 }]}>
          <ActivityIndicator />
          <Text>Indlæser vagter…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ids = shifts ? Object.keys(shifts) : [];
  const weekDays = getWeekDays(currentWeek);

  const renderDayView = () => {
    const today = new Date();
    const todayShifts = getShiftsForDate(today);

    return (
      <ScrollView style={{ flex: 1 }}>
        {/* Dagens vagter */}
        <View style={globalStyles.dayHeader}>
          <Text style={globalStyles.dayHeaderText}>
            {formatDateDisplay(today)}
          </Text>
        </View>

        {todayShifts.length === 0 ? (
          <View style={[globalStyles.center, { marginTop: 50 }]}>
            <Text style={{ textAlign: "center", color: "#666" }}>
              Ingen vagter i dag
            </Text>
          </View>
        ) : (
          todayShifts.map(([shiftId, shift]) => (
            <TouchableOpacity
              key={shiftId}
              style={globalStyles.shiftCard}
              onPress={() => openModal(shiftId)}
            >
              <View style={globalStyles.shiftTimeContainer}>
                <Text style={globalStyles.shiftTime}>
                  {shift.startTime}–{shift.endTime}
                </Text>
              </View>
              <View style={globalStyles.shiftDetails}>
                <Text style={globalStyles.shiftArea}>{shift.area}</Text>
                <Text style={globalStyles.shiftContact}>
                  Kontakt: {shift.contactPerson}
                </Text>
                <Text style={globalStyles.shiftEmployees}>
                  👷 {Array.isArray(shift.assignedTo) && shift.assignedTo.length > 0
                    ? shift.assignedTo.map(emp => emp.name || emp).join(", ")
                    : "Ikke tildelt"}
                </Text>
              </View>
              <TouchableOpacity
                style={globalStyles.deleteBtn}
                onPress={() => deleteShift(shiftId)}
              >
                <Text style={globalStyles.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  const renderWeekView = () => {
    return (
      <ScrollView style={{ flex: 1 }}>
        {/* Uge navigation */}
        <View style={globalStyles.weekNavigation}>
          <TouchableOpacity
            style={globalStyles.navBtn}
            onPress={() => {
              const prevWeek = new Date(currentWeek);
              prevWeek.setDate(currentWeek.getDate() - 7);
              setCurrentWeek(prevWeek);
            }}
          >
            <Text style={globalStyles.navBtnText}>◀</Text>
          </TouchableOpacity>
          
          <Text style={globalStyles.weekText}>
            Uge {Math.ceil((currentWeek - new Date(currentWeek.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))}
          </Text>
          
          <TouchableOpacity
            style={globalStyles.navBtn}
            onPress={() => {
              const nextWeek = new Date(currentWeek);
              nextWeek.setDate(currentWeek.getDate() + 7);
              setCurrentWeek(nextWeek);
            }}
          >
            <Text style={globalStyles.navBtnText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Ugedage */}
        {weekDays.map((day, index) => {
          const dayShifts = getShiftsForDate(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          
          return (
            <View key={index} style={[
              globalStyles.weekDay,
              isWeekend && globalStyles.weekendDay
            ]}>
              <View style={globalStyles.weekDayHeader}>
                <Text style={globalStyles.weekDayHeaderText}>
                  {formatDateDisplay(day)}
                </Text>
                <TouchableOpacity
                  style={globalStyles.addShiftBtn}
                  onPress={() => openModal(null, day)}
                >
                  <Text style={globalStyles.addShiftBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {dayShifts.length === 0 ? (
                <Text style={globalStyles.noShiftsText}>Ingen vagter</Text>
              ) : (
                dayShifts.map(([shiftId, shift]) => (
                  <TouchableOpacity
                    key={shiftId}
                    style={globalStyles.weekShiftCard}
                    onPress={() => openModal(shiftId)}
                  >
                    <Text style={globalStyles.weekShiftTime}>
                      {shift.startTime}–{shift.endTime}
                    </Text>
                    <Text style={globalStyles.weekShiftArea}>{shift.area}</Text>
                    <Text style={globalStyles.weekShiftEmployees}>
                      {Array.isArray(shift.assignedTo) && shift.assignedTo.length > 0
                        ? `${shift.assignedTo.length} medarbejdere`
                        : "Ikke tildelt"}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerText}>📋 Vagtplan</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={globalStyles.viewToggleBtn}
            onPress={() => setViewMode(viewMode === 'list' ? 'week' : 'list')}
          >
            <Text style={globalStyles.viewToggleBtnText}>
              {viewMode === 'list' ? '📅' : '📋'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={globalStyles.addBtn}
            onPress={() => openModal()}
          >
            <Text style={globalStyles.addBtnText}>➕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Søgefelt kun for listevisning */}
      {viewMode === 'list' && ids.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <TextInput
            style={globalStyles.shiftInput}
            placeholder="Søg vagter efter medarbejdernavn..."
            placeholderTextColor="#888"
            value={shiftSearchText}
            onChangeText={setShiftSearchText}
          />
        </View>
      )}

      {ids.length === 0 ? (
        <View style={[globalStyles.center, { marginTop: 50 }]}>
          <Text style={{ textAlign: "center" }}>Ingen vagter oprettet endnu</Text>
        </View>
      ) : (
        viewMode === 'list' ? renderDayView() : renderWeekView()
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={globalStyles.container}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={globalStyles.modalTitle}>{editingId ? "Rediger vagt" : "Opret ny vagt"}</Text>

            <TextInput
              style={globalStyles.shiftInput}
              placeholder="Område (fx Bar 1, Podium)"
              placeholderTextColor="#888"
              value={formData.area}
              onChangeText={(t) => setFormData({ ...formData, area: t })}
            />

            <TextInput
              style={globalStyles.shiftInput}
              placeholder="Kontaktperson (Teamleder)"
              placeholderTextColor="#888"
              value={formData.contactPerson}
              onChangeText={(t) => setFormData({ ...formData, contactPerson: t })}
            />

            {/* Dato og tid sektion */}
            <Text style={globalStyles.sectionTitle}>📅 Dato og tid</Text>
            
            <View style={globalStyles.dateTimeSection}>
              {/* Dato vælger */}
              <View style={globalStyles.dateTimeGroup}>
                <TouchableOpacity
                  style={[globalStyles.modernDateTimeBtn, showDatePicker && globalStyles.modernDateTimeBtnActive]}
                  onPress={() => setShowDatePicker(!showDatePicker)}
                >
                  <View style={globalStyles.dateTimeBtnContent}>
                    <Text style={globalStyles.dateTimeBtnIcon}>📅</Text>
                    <Text style={globalStyles.dateTimeBtnLabel}>Dato</Text>
                    <Text style={globalStyles.dateTimeBtnValue}>
                      {formatDate(formData.date)}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <View style={globalStyles.modernPickerContainer}>
                    <DateTimePicker
                      value={formData.date}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'compact' : 'default'}
                      onChange={onDateChange}
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={globalStyles.modernPickerDoneBtn}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={globalStyles.modernPickerDoneBtnText}>✓ Færdig</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Start og slut tid i samme række */}
              <View style={globalStyles.timeRow}>
                <TouchableOpacity
                  style={[globalStyles.modernDateTimeBtn, showStartTimePicker && globalStyles.modernDateTimeBtnActive]}
                  onPress={() => setShowStartTimePicker(!showStartTimePicker)}
                >
                  <View style={globalStyles.dateTimeBtnContent}>
                    <Text style={globalStyles.dateTimeBtnIcon}>🕐</Text>
                    <Text style={globalStyles.dateTimeBtnLabel}>Start</Text>
                    <Text style={globalStyles.dateTimeBtnValue}>
                      {formData.startTime || "Vælg tid"}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[globalStyles.modernDateTimeBtn, showEndTimePicker && globalStyles.modernDateTimeBtnActive]}
                  onPress={() => setShowEndTimePicker(!showEndTimePicker)}
                >
                  <View style={globalStyles.dateTimeBtnContent}>
                    <Text style={globalStyles.dateTimeBtnIcon}>🕕</Text>
                    <Text style={globalStyles.dateTimeBtnLabel}>Slut</Text>
                    <Text style={globalStyles.dateTimeBtnValue}>
                      {formData.endTime || "Vælg tid"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Time pickers */}
              {showStartTimePicker && (
                <View style={globalStyles.modernPickerContainer}>
                  <DateTimePicker
                    value={formData.startTime ? new Date(`2000-01-01T${formData.startTime}:00`) : new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={onStartTimeChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={globalStyles.modernPickerDoneBtn}
                      onPress={() => setShowStartTimePicker(false)}
                    >
                      <Text style={globalStyles.modernPickerDoneBtnText}>✓ Færdig</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {showEndTimePicker && (
                <View style={globalStyles.modernPickerContainer}>
                  <DateTimePicker
                    value={formData.endTime ? new Date(`2000-01-01T${formData.endTime}:00`) : new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={onEndTimeChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={globalStyles.modernPickerDoneBtn}
                      onPress={() => setShowEndTimePicker(false)}
                    >
                      <Text style={globalStyles.modernPickerDoneBtnText}>✓ Færdig</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <Text style={globalStyles.sectionTitle}>Tilknyt medarbejdere</Text>
            
            {/* Vis nuværende tilknyttede medarbejdere */}
            {formData.assignedTo && formData.assignedTo.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[globalStyles.sectionTitle, { fontSize: 14, color: "#666" }]}>Nuværende tilknyttede:</Text>
                {formData.assignedTo.map((emp, index) => (
                  <View key={index} style={globalStyles.assignedEmployeeContainer}>
                    <Text style={globalStyles.assignedEmployeeText}>
                      {emp.name || emp}
                    </Text>
                    <TouchableOpacity
                      style={globalStyles.removeBtn}
                      onPress={() => removeEmployee(emp.id || index)}
                    >
                      <Text style={globalStyles.removeBtnText}>❌</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Søgefelt */}
            <Text style={[globalStyles.sectionTitle, { fontSize: 14, color: "#666" }]}>Tilgængelige godkendte medarbejdere:</Text>
            
            {Object.keys(employees).length > 0 && (
              <TextInput
                style={[globalStyles.shiftInput, { marginBottom: 10 }]}
                placeholder="Søg medarbejder (navn eller email)..."
                placeholderTextColor="#888"
                value={searchText}
                onChangeText={setSearchText}
              />
            )}

            {Object.keys(employees).length === 0 ? (
              <Text style={{ textAlign: "center", marginVertical: 16, color: "#666" }}>
                Ingen godkendte medarbejdere endnu
              </Text>
            ) : filteredEmployees.length === 0 ? (
              <Text style={{ textAlign: "center", marginVertical: 16, color: "#666" }}>
                Ingen medarbejdere fundet for "{searchText}"
              </Text>
            ) : (
              filteredEmployees.map(([id, emp]) => {
                const isAssigned = formData.assignedTo.some(assigned => assigned.id === id);
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      globalStyles.assignBtn,
                      isAssigned && globalStyles.assignBtnSelected
                    ]}
                    onPress={() => toggleEmployee(id, `${emp.firstName} ${emp.lastName}`)}
                  >
                    <Text style={[
                      globalStyles.assignText,
                      isAssigned && globalStyles.assignTextSelected
                    ]}>
                      {isAssigned ? "✓ " : ""}{emp.firstName} {emp.lastName}
                    </Text>
                    <Text style={[globalStyles.assignText, { fontSize: 12, color: "#666" }]}>
                      {emp.email}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}

            <View style={{ marginTop: 24 }}>
              <Button title="Gem" onPress={saveShift} color="#007AFF" />
              <View style={{ height: 12 }} />
              <Button title="Annuller" onPress={() => {
                setModalVisible(false);
                setSearchText(""); // Ryd søgefeltet når modal annulleres
              }} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
