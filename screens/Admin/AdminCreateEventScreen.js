import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../styles";
import { rtdb } from "../../database/firebase";
import { ref, push, update, remove, onValue, get } from "firebase/database";
import { storage } from "../../database/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminCreateEventScreen({ route, navigation }) {
  const { companyCode, userId, event: existingEvent, eventId } = route.params || {};
  // Only treat as editing when this screen was opened via the EditEvent route
  const isEditing = Boolean(route.name === 'EditEvent' && existingEvent && eventId);

  const [title, setTitle] = useState(isEditing ? existingEvent?.title || "" : "");
  const [description, setDescription] = useState(isEditing ? existingEvent?.description || "" : "");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(isEditing ? existingEvent?.startTime || "09:00" : "09:00");
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [endTime, setEndTime] = useState(isEditing ? existingEvent?.endTime || "17:00" : "17:00");
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [location, setLocation] = useState(isEditing ? existingEvent?.location || "" : "");
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState(isEditing ? existingEvent?.assignedEmployees || {} : {}); // { employeeId: { ...employeeData, hoursWorked, totalCost } }
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [currentEmployeeHours, setCurrentEmployeeHours] = useState("");
  const [employeeShiftStart, setEmployeeShiftStart] = useState("");
  const [employeeShiftEnd, setEmployeeShiftEnd] = useState("");
  const [showShiftStartPicker, setShowShiftStartPicker] = useState(false);
  const [showShiftEndPicker, setShowShiftEndPicker] = useState(false);
  const [selectedEmployeeToAdd, setSelectedEmployeeToAdd] = useState(null);
  const [showHoursPicker, setShowHoursPicker] = useState(false);
  const [expenses, setExpenses] = useState(isEditing && existingEvent?.expenses ? existingEvent.expenses : []);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState("");
  const [totalBudget, setTotalBudget] = useState(isEditing && existingEvent?.totalBudget ? existingEvent.totalBudget.toString() : ""); // Samlet budget for hele eventet

  // Prefill when editing
  React.useEffect(() => {
    if (isEditing && existingEvent) {
      setTitle(existingEvent.title || "");
      setDescription(existingEvent.description || "");
      
      // Parse date string to Date object
      if (existingEvent.date) {
        const [year, month, day] = existingEvent.date.split('-').map(Number);
        setDate(new Date(year, month - 1, day));
      }
      
      // Parse time strings to time strings (already in HH:MM format)
      if (existingEvent.startTime) {
        setStartTime(existingEvent.startTime);
      }
      
      if (existingEvent.endTime) {
        setEndTime(existingEvent.endTime);
      }
      
      setLocation(existingEvent.location || "");
      
      // Load assigned employees with hours
      if (existingEvent.assignedEmployees) {
        setAssignedEmployees(existingEvent.assignedEmployees);
      }
      
      // Load expenses
      if (existingEvent.expenses && Array.isArray(existingEvent.expenses)) {
        setExpenses(existingEvent.expenses);
      }
      
      // Load total budget
      if (existingEvent.totalBudget) {
        setTotalBudget(existingEvent.totalBudget.toString());
      }
    }
  }, [isEditing, existingEvent]);

  // Load employees for this company so we can assign them to events
  React.useEffect(() => {
    if (!companyCode) return;
    const empRef = ref(rtdb, `companies/${companyCode}/employees`);
    const unsubscribe = onValue(empRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data)
        .filter(([id, emp]) => emp && emp.role === 'employee' && emp.approved === true)
        .map(([id, emp]) => ({ id, ...emp }));
      setEmployees(list);

      // If editing and existingEvent has assignedTo, try to preselect matching employees
      if (existingEvent && existingEvent.assignedTo) {
        const assigned = existingEvent.assignedTo.map(a => {
          // a might be {id, name} or just id or name
          if (a && typeof a === 'object' && a.id) return a.id;
          return String(a);
        });

        const matched = list.filter(emp => assigned.includes(emp.id) || assigned.includes(`${emp.firstName} ${emp.lastName}`));
        setSelectedEmployees(matched);
      }
    });

    return () => unsubscribe();
  }, [companyCode, existingEvent]);

  // Load expenses when editing existing event
  React.useEffect(() => {
    if (!companyCode || !eventId) return;
    const expensesRef = ref(rtdb, `companies/${companyCode}/events/${eventId}/expenses`);
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setExpenses(list);
    });
    return () => unsubscribe();
  }, [companyCode, eventId]);

  const validate = () => {
    if (!companyCode) {
      Alert.alert("Fejl", "Manglende virksomheds-kode.");
      return false;
    }
    if (!title.trim()) {
      Alert.alert("Validering", "Titel skal udfyldes.");
      return false;
    }
    return true;
  };

  // Helper functions for hours/time conversion
  const hoursToTimeString = (hours) => {
    if (!hours) return "0:00";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const timeStringToHours = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours + (minutes / 60);
  };

  const hoursToDate = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m);
    return date;
  };

  const formatDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (dateObj) => {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateDisplay = (dateObj) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString('da-DK', options);
  };

  // Hjælpefunktion til at konvertere tid string (HH:MM) til Date objekt for picker
  const getTimeAsDate = (timeStr) => {
    const now = new Date();
    
    // Hvis der er en gyldig tid string, brug den
    if (timeStr && timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      
      if (!isNaN(h) && !isNaN(m)) {
        now.setHours(h, m, 0, 0);
        return now;
      }
    }
    
    // Ellers returner bare nuværende tid
    return now;
  };

  // Beregn total lønomkostning for eventet
  const calculateTotalWageCost = () => {
    return Object.values(assignedEmployees).reduce((sum, emp) => sum + (emp.totalCost || 0), 0);
  };

  // Tilføj medarbejder til event med timer
  const handleAddEmployeeToEvent = async (employee) => {
    // Tjek om medarbejderen har en kontrakt med timeløn
    if (!employee.contract || !employee.contract.hourlyWage) {
      Alert.alert("Fejl", `${employee.firstName} ${employee.lastName} har ingen timeløn i sin kontrakt.`);
      return;
    }

    setSelectedEmployeeToAdd(employee);
    setCurrentEmployeeHours("");
    setShowEmployeeModal(true);
  };

  // Gem medarbejder med timer
  const handleSaveEmployeeHours = async () => {
    if (!selectedEmployeeToAdd) return;
    
    // Valider start og slut tid
    if (!employeeShiftStart || !employeeShiftEnd) {
      Alert.alert("Validering", "Vælg både start- og sluttid for vagten");
      return;
    }

    // Beregn antal timer fra start og slut tid
    const [startHour, startMin] = employeeShiftStart.split(':').map(Number);
    const [endHour, endMin] = employeeShiftEnd.split(':').map(Number);
    const hours = (endHour + endMin/60) - (startHour + startMin/60);
    
    if (hours <= 0) {
      Alert.alert("Validering", "Sluttid skal være efter starttid");
      return;
    }

    const hourlyWage = parseFloat(selectedEmployeeToAdd.contract.hourlyWage);
    const totalCost = hourlyWage * hours;

    const employeeData = {
      employeeId: selectedEmployeeToAdd.id,
      firstName: selectedEmployeeToAdd.firstName,
      lastName: selectedEmployeeToAdd.lastName,
      hourlyWage: hourlyWage,
      hoursWorked: hours,
      shiftStart: employeeShiftStart,
      shiftEnd: employeeShiftEnd,
      totalCost: totalCost,
    };

    setAssignedEmployees({
      ...assignedEmployees,
      [selectedEmployeeToAdd.id]: employeeData,
    });

    // Opret automatisk en vagt for medarbejderen
    try {
      const shiftData = {
        date: formatDate(date),
        startTime: employeeShiftStart,
        endTime: employeeShiftEnd,
        area: title.trim(),
        location: location.trim() || '',
        assignedTo: [{
          id: selectedEmployeeToAdd.id,
          name: `${selectedEmployeeToAdd.firstName} ${selectedEmployeeToAdd.lastName}`
        }],
        createdAt: Date.now(),
        eventId: eventId || 'pending', // Link til event
        hoursWorked: hours,
        isFromEvent: true, // Flag for at identificere vagter fra events
      };

      await push(ref(rtdb, `companies/${companyCode}/shifts`), shiftData);
    } catch (error) {
      console.error('Kunne ikke oprette vagt:', error);
      // Fortsæt alligevel - vagt er optional
    }

    setShowEmployeeModal(false);
    setSelectedEmployeeToAdd(null);
    setCurrentEmployeeHours("");
    setEmployeeShiftStart("");
    setEmployeeShiftEnd("");
  };

  // Fjern medarbejder fra event
  const handleRemoveEmployeeFromEvent = (employeeId) => {
    const updated = { ...assignedEmployees };
    delete updated[employeeId];
    setAssignedEmployees(updated);
  };

  const handleSave = async () => {
    if (!validate()) return;

    const totalWageCost = calculateTotalWageCost();
    const totalBudgetValue = parseFloat(totalBudget) || 0;
    
    // Beregn total udgifter fra expenses array
    const totalExpensesFromList = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    
    const totalExpenses = totalWageCost + totalExpensesFromList;
    const wagePercentage = totalBudgetValue > 0 ? (totalWageCost / totalBudgetValue) * 100 : 0;
    const expensePercentage = totalBudgetValue > 0 ? (totalExpenses / totalBudgetValue) * 100 : 0;
    const remainingBudget = totalBudgetValue - totalExpenses;

    const event = {
      title: title.trim(),
      description: description.trim() || null,
      date: formatDate(date),
      startTime: startTime,
      endTime: endTime,
      location: location.trim() || null,
      assignedTo: selectedEmployees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })),
      assignedEmployees: assignedEmployees, // Medarbejdere med timer og omkostninger
      expenses: expenses, // Liste af udgifter med beskrivelse og beløb
      totalWageCost: totalWageCost, // Total lønomkostning
      totalBudget: totalBudgetValue, // Samlet budget
      otherExpenses: totalExpensesFromList, // Andre udgifter (beregnet fra expenses array)
      totalExpenses: totalExpenses, // Samlet udgifter (løn + andre)
      wagePercentage: wagePercentage, // Lønprocent
      expensePercentage: expensePercentage, // Total udgiftsprocent
      remainingBudget: remainingBudget, // Resterende budget (saldo)
      createdAt: isEditing ? existingEvent.createdAt : Date.now(),
    };

    setSaving(true);
    try {
      const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
        if (isEditing) {
          // Update existing
          await update(ref(rtdb, `companies/${companyCode}/events/${eventId}`), event);
          Alert.alert("Succes", "Event opdateret.", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
        } else {
          // Create new
          const newEventRef = await push(eventsRef, event);
          const newEventId = newEventRef.key;
          
          // Opret automatisk en event-chat
          try {
            const chatMembers = {};
            
            // Tilføj admin
            chatMembers[userId] = {
              role: 'admin',
              joinedAt: Date.now(),
            };
            
            // Tilføj alle tildelte medarbejdere
            Object.entries(assignedEmployees).forEach(([empId, empData]) => {
              chatMembers[empId] = {
                role: 'employee',
                firstName: empData.firstName,
                lastName: empData.lastName,
                joinedAt: Date.now(),
              };
            });
            
            const chatData = {
              name: title.trim(),
              type: 'event',
              eventId: newEventId,
              createdBy: userId,
              createdAt: Date.now(),
              lastMessageTime: Date.now(),
              members: chatMembers,
              messageCount: 0,
              lastMessage: 'Event chat oprettet',
            };
            
            await push(ref(rtdb, `companies/${companyCode}/chats`), chatData);
          } catch (chatError) {
            console.error('Kunne ikke oprette event chat:', chatError);
            // Fortsæt alligevel - chat er optional
          }
          
          Alert.alert("Event oprettet", "Dit event er nu oprettet.", [
            { 
              text: "OK", 
              onPress: () => {
                // Reset all fields
                setTitle("");
                setDescription("");
                setDate(new Date());
                setStartTime("09:00");
                setEndTime("17:00");
                setLocation("");
                setSelectedEmployees([]);
                setAssignedEmployees({});
                setExpenses([]);
                setTotalBudget("");
                
                // Navigate back to event plan
                navigation.navigate('AdminShiftList', { companyCode });
              }
            },
          ]);
        }
    } catch (err) {
      Alert.alert("Fejl", err.message || "Kunne ikke gemme event");
    } finally {
      setSaving(false);
    }
  };

  const handleAddExpense = () => {
    if (!expenseDesc.trim() || !expenseAmount.trim()) {
      Alert.alert('Validering', 'Beskrivelse og beløb skal udfyldes');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validering', 'Indtast et gyldigt beløb');
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      description: expenseDesc.trim(),
      amount: amount,
      createdAt: Date.now(),
    };

    setExpenses([...expenses, newExpense]);
    setExpenseDesc('');
    setExpenseAmount('');
  };

  const toggleSelectEmployee = (emp) => {
    const exists = selectedEmployees.some(e => e.id === emp.id);
    if (exists) {
      setSelectedEmployees(selectedEmployees.filter(e => e.id !== emp.id));
    } else {
      setSelectedEmployees([...selectedEmployees, emp]);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    Alert.alert('Slet event', 'Er du sikker på du vil slette dette event?', [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Slet', style: 'destructive', onPress: async () => {
          try {
            await remove(ref(rtdb, `companies/${companyCode}/events/${eventId}`));
            Alert.alert('Slettet', 'Event slettet', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          } catch (err) {
            Alert.alert('Fejl', err.message || 'Kunne ikke slette event');
          }
        }
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 32,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Text style={{ 
          fontSize: 32, 
          fontWeight: '800', 
          color: colors.white,
          marginBottom: 4,
        }}>
          Opret Event
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
          Planlæg et nyt event
        </Text>
      </LinearGradient>

      <ScrollView style={globalStyles.eventScrollView} showsVerticalScrollIndicator={false}>
        <View style={globalStyles.eventContent}>
          
          {/* Titel Section */}
          <View style={globalStyles.eventSection}>
            <Text style={globalStyles.eventSectionTitle}>Event detaljer</Text>
            
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Titel</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={title}
                onChangeText={setTitle}
                placeholder="F.eks. Årsfest 2025"
                placeholderTextColor="#999"
              />
            </View>

            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Beskrivelse</Text>
              <TextInput
                style={[globalStyles.eventInput, globalStyles.eventTextArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Kort beskrivelse af eventet..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Lokation</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={location}
                onChangeText={setLocation}
                placeholder="F.eks. København"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Dato & Tid Section */}
          <View style={globalStyles.eventSection}>
            <Text style={globalStyles.eventSectionTitle}>Dato og tid</Text>
            
            {/* Dato vælger */}
            <View style={globalStyles.dateTimeGroup}>
              <TouchableOpacity
                style={[globalStyles.modernDateTimeBtn, showDatePicker && globalStyles.modernDateTimeBtnActive]}
                onPress={() => setShowDatePicker(!showDatePicker)}
              >
                <View style={globalStyles.dateTimeBtnContent}>
                  <Text style={globalStyles.dateTimeBtnLabel}>Dato</Text>
                  <Text style={globalStyles.dateTimeBtnValue}>
                    {formatDateDisplay(date)}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {showDatePicker && (
                <View style={globalStyles.modernPickerContainer}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (selectedDate) setDate(selectedDate);
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={globalStyles.modernPickerDoneBtn}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={globalStyles.modernPickerDoneBtnText}>Færdig</Text>
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
                  <Text style={globalStyles.dateTimeBtnLabel}>Start</Text>
                  <Text style={globalStyles.dateTimeBtnValue}>
                    {startTime}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[globalStyles.modernDateTimeBtn, showEndTimePicker && globalStyles.modernDateTimeBtnActive]}
                onPress={() => setShowEndTimePicker(!showEndTimePicker)}
              >
                <View style={globalStyles.dateTimeBtnContent}>
                  <Text style={globalStyles.dateTimeBtnLabel}>Slut</Text>
                  <Text style={globalStyles.dateTimeBtnValue}>
                    {endTime}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Time pickers */}
            {showStartTimePicker && (
              <View style={globalStyles.modernPickerContainer}>
                <DateTimePicker
                  key={`start-${startTime}`}
                  value={getTimeAsDate(startTime)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  textColor="#000000"
                  locale="da-DK"
                  onChange={(event, selectedTime) => {
                    if (Platform.OS === 'android') {
                      setShowStartTimePicker(false);
                    }
                    if (selectedTime) {
                      setStartTime(formatTime(selectedTime));
                    }
                  }}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={globalStyles.modernPickerDoneBtn}
                    onPress={() => setShowStartTimePicker(false)}
                  >
                    <Text style={globalStyles.modernPickerDoneBtnText}>Færdig</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {showEndTimePicker && (
              <View style={globalStyles.modernPickerContainer}>
                <DateTimePicker
                  key={`end-${endTime}`}
                  value={getTimeAsDate(endTime)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  textColor="#000000"
                  locale="da-DK"
                  onChange={(event, selectedTime) => {
                    if (Platform.OS === 'android') {
                      setShowEndTimePicker(false);
                    }
                    if (selectedTime) {
                      setEndTime(formatTime(selectedTime));
                    }
                  }}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={globalStyles.modernPickerDoneBtn}
                    onPress={() => setShowEndTimePicker(false)}
                  >
                    <Text style={globalStyles.modernPickerDoneBtnText}>Færdig</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Vagtplan Section */}
          <View style={globalStyles.eventSection}>
            <Text style={globalStyles.eventSectionTitle}>Vagtplan</Text>
            
            {/* Tilføj medarbejder knap */}
            <TouchableOpacity
              style={globalStyles.eventSecondaryButton}
              onPress={() => {
                const availableEmployees = employees.filter(emp => 
                  !assignedEmployees[emp.id] && emp.contract && emp.contract.hourlyWage
                );
                if (availableEmployees.length === 0) {
                  Alert.alert("Info", "Alle medarbejdere med kontrakter er allerede tilknyttet, eller der er ingen godkendte medarbejdere med timeløn.");
                  return;
                }
                setShowEmployeeModal(true);
              }}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.primary} />
              <Text style={globalStyles.eventSecondaryButtonText}>Tilføj medarbejder</Text>
            </TouchableOpacity>
            
            {/* Liste over tilknyttede medarbejdere med timer */}
            {Object.keys(assignedEmployees).length === 0 ? (
              <Text style={globalStyles.eventEmptyText}>Ingen medarbejdere tilknyttet endnu</Text>
            ) : (
              <React.Fragment>
                {/* Header */}
                <View style={{ 
                  flexDirection: 'row', 
                  paddingVertical: 8, 
                  paddingHorizontal: 12,
                  backgroundColor: colors.gray100,
                  borderRadius: 8,
                  marginBottom: 8,
                }}>
                  <Text style={{ flex: 2, fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>Navn</Text>
                  <Text style={{ flex: 1.5, fontSize: 12, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' }}>Tidsrum</Text>
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' }}>Timeløn</Text>
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: colors.textSecondary, textAlign: 'right' }}>I alt</Text>
                  <View style={{ width: 40 }} />
                </View>

                {/* Medarbejder rækker */}
                {Object.values(assignedEmployees).map((emp) => (
                  <View 
                    key={emp.employeeId}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: colors.gray200,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 2, fontSize: 14, fontWeight: '600', color: colors.text }}>
                        {emp.firstName} {emp.lastName}
                      </Text>
                      <View style={{ flex: 1.5, alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: colors.text }}>
                          {emp.shiftStart} - {emp.shiftEnd}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                          ({emp.hoursWorked.toFixed(1)}t)
                        </Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, color: colors.text, textAlign: 'center' }}>
                        {emp.hourlyWage} kr
                      </Text>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.primary, textAlign: 'right' }}>
                        {emp.totalCost.toFixed(2)} kr
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveEmployeeFromEvent(emp.employeeId)}
                        style={{ width: 40, alignItems: 'center' }}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </React.Fragment>
            )}
          </View>

          {/* Økonomi Section */}
          <View style={globalStyles.eventSection}>
            <Text style={globalStyles.eventSectionTitle}>Økonomi</Text>
            
            {/* Samlet budget input */}
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Samlet budget (kr)</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={totalBudget}
                onChangeText={setTotalBudget}
                placeholder="F.eks. 50000"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Lønomkostninger (auto-beregnet) */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: colors.gray50,
              borderRadius: 8,
              marginTop: 8,
              borderWidth: 1,
              borderColor: colors.gray200,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Lønomkostninger:</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {calculateTotalWageCost().toFixed(2)} kr
              </Text>
            </View>

            {/* Udgifter */}
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Udgifter</Text>
              
              {expenses.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  {expenses.map((ex) => (
                    <View 
                      key={ex.id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: colors.surface,
                        borderRadius: 8,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: colors.gray200,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                          {ex.description}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.primary, marginTop: 2 }}>
                          {ex.amount} kr
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setExpenses(expenses.filter(e => e.id !== ex.id));
                        }}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Tilføj udgift inputs */}
              <View style={globalStyles.eventInputContainer}>
                <Text style={globalStyles.eventLabel}>Beskrivelse af udgiften</Text>
                <TextInput
                  style={globalStyles.eventInput}
                  value={expenseDesc}
                  onChangeText={setExpenseDesc}
                  placeholder="F.eks. Leje af lokale"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={globalStyles.eventInputContainer}>
                <Text style={globalStyles.eventLabel}>Udgiftens beløb (kr)</Text>
                <TextInput
                  style={globalStyles.eventInput}
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  placeholder="F.eks. 5000"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity 
                style={globalStyles.eventSecondaryButton}
                onPress={handleAddExpense}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={globalStyles.eventSecondaryButtonText}>Tilføj udgift</Text>
              </TouchableOpacity>
            </View>

            {/* Saldo */}
            {totalBudget && parseFloat(totalBudget) > 0 && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 12,
                backgroundColor: colors.primaryLight,
                borderRadius: 8,
                marginTop: 16,
                borderWidth: 2,
                borderColor: colors.primary,
              }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary }}>Saldo:</Text>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '800', 
                  color: (parseFloat(totalBudget) - calculateTotalWageCost() - expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)) < 0 
                    ? colors.error 
                    : colors.success 
                }}>
                  {(parseFloat(totalBudget) - calculateTotalWageCost() - expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)).toFixed(2)} kr
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={globalStyles.eventActionButtons}>
            <TouchableOpacity
              style={[globalStyles.eventPrimaryButton, saving && globalStyles.eventButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={globalStyles.eventPrimaryButtonText}>
                {saving ? 'Gemmer...' : (isEditing ? 'Opdater event' : 'Opret event')}
              </Text>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity style={globalStyles.eventDeleteButton} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                <Text style={globalStyles.eventDeleteButtonText}>Slet event</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Modal til at tilføje medarbejder med timer */}
      <Modal
        visible={showEmployeeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowEmployeeModal(false);
                  setSelectedEmployeeToAdd(null);
                  setCurrentEmployeeHours("");
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.gray200,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 16 }}>
              Tilføj medarbejder til event
            </Text>

            {!selectedEmployeeToAdd ? (
              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
                  Vælg en medarbejder:
                </Text>
                {employees
                  .filter(emp => !assignedEmployees[emp.id] && emp.contract && emp.contract.hourlyWage)
                  .map((emp) => (
                    <TouchableOpacity
                      key={emp.id}
                      onPress={() => setSelectedEmployeeToAdd(emp)}
                      style={{
                        padding: 16,
                        backgroundColor: colors.surface,
                        borderRadius: 8,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: colors.gray200,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                        {emp.firstName} {emp.lastName}
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                        Timeløn: {emp.contract.hourlyWage} kr/time
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            ) : (
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                  {selectedEmployeeToAdd.firstName} {selectedEmployeeToAdd.lastName}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
                  Timeløn: {selectedEmployeeToAdd.contract.hourlyWage} kr/time
                </Text>

                {/* Starttid */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                  Starttid
                </Text>
                <TouchableOpacity
                  style={[globalStyles.modernDateTimeBtn, showShiftStartPicker && globalStyles.modernDateTimeBtnActive]}
                  onPress={() => setShowShiftStartPicker(!showShiftStartPicker)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <Text style={globalStyles.modernDateTimeBtnText}>
                    {employeeShiftStart || "Vælg starttid"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.primary} />
                </TouchableOpacity>

                {showShiftStartPicker && (
                  <View style={globalStyles.modernPickerContainer}>
                    <DateTimePicker
                      value={employeeShiftStart ? getTimeAsDate(employeeShiftStart) : getTimeAsDate(startTime || "09:00")}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      textColor="#000000"
                      locale="da-DK"
                      onChange={(event, selectedTime) => {
                        if (Platform.OS === 'android') {
                          setShowShiftStartPicker(false);
                        }
                        if (selectedTime) {
                          setEmployeeShiftStart(formatTime(selectedTime));
                        }
                      }}
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={globalStyles.modernPickerDoneBtn}
                        onPress={() => setShowShiftStartPicker(false)}
                      >
                        <Text style={globalStyles.modernPickerDoneBtnText}>Færdig</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Sluttid */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 16 }}>
                  Sluttid
                </Text>
                <TouchableOpacity
                  style={[globalStyles.modernDateTimeBtn, showShiftEndPicker && globalStyles.modernDateTimeBtnActive]}
                  onPress={() => setShowShiftEndPicker(!showShiftEndPicker)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <Text style={globalStyles.modernDateTimeBtnText}>
                    {employeeShiftEnd || "Vælg sluttid"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.primary} />
                </TouchableOpacity>

                {showShiftEndPicker && (
                  <View style={globalStyles.modernPickerContainer}>
                    <DateTimePicker
                      value={employeeShiftEnd ? getTimeAsDate(employeeShiftEnd) : getTimeAsDate(endTime || "17:00")}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      textColor="#000000"
                      locale="da-DK"
                      onChange={(event, selectedTime) => {
                        if (Platform.OS === 'android') {
                          setShowShiftEndPicker(false);
                        }
                        if (selectedTime) {
                          setEmployeeShiftEnd(formatTime(selectedTime));
                        }
                      }}
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={globalStyles.modernPickerDoneBtn}
                        onPress={() => setShowShiftEndPicker(false)}
                      >
                        <Text style={globalStyles.modernPickerDoneBtnText}>Færdig</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Beregnet omkostning */}
                {employeeShiftStart && employeeShiftEnd && (
                  <View style={{
                    padding: 12,
                    backgroundColor: colors.primaryLight,
                    borderRadius: 8,
                    marginTop: 16,
                  }}>
                    <Text style={{ fontSize: 14, color: colors.primary }}>
                      Tidsrum: {employeeShiftStart} - {employeeShiftEnd}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.primary, marginTop: 4 }}>
                      Timer: {(() => {
                        const [startHour, startMin] = employeeShiftStart.split(':').map(Number);
                        const [endHour, endMin] = employeeShiftEnd.split(':').map(Number);
                        const hours = (endHour + endMin/60) - (startHour + startMin/60);
                        return hours > 0 ? hours.toFixed(2) : '0.00';
                      })()} timer
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.primary, marginTop: 4 }}>
                      Beregnet omkostning: {(() => {
                        const [startHour, startMin] = employeeShiftStart.split(':').map(Number);
                        const [endHour, endMin] = employeeShiftEnd.split(':').map(Number);
                        const hours = (endHour + endMin/60) - (startHour + startMin/60);
                        return (parseFloat(selectedEmployeeToAdd.contract.hourlyWage) * Math.max(0, hours)).toFixed(2);
                      })()} kr
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedEmployeeToAdd(null);
                      setCurrentEmployeeHours("");
                      setEmployeeShiftStart("");
                      setEmployeeShiftEnd("");
                    }}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 8,
                      backgroundColor: colors.gray200,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Tilbage</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveEmployeeHours}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.white }}>Tilføj</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}
