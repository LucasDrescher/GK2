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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles } from "../styles";
import { rtdb } from "../database/firebase";
import { ref, push, update, remove, onValue } from "firebase/database";
import { storage } from "../database/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminCreateEventScreen({ route, navigation }) {
  const { companyCode, event: existingEvent, eventId } = route.params || {};
  // Only treat as editing when this screen was opened via the EditEvent route
  const isEditing = Boolean(route.name === 'EditEvent' && existingEvent && eventId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [endTime, setEndTime] = useState(new Date());
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState("");

  // Prefill when editing
  React.useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title || "");
      setDescription(existingEvent.description || "");
      
      // Parse date string to Date object
      if (existingEvent.date) {
        const [year, month, day] = existingEvent.date.split('-').map(Number);
        setDate(new Date(year, month - 1, day));
      }
      
      // Parse time strings to Date objects
      if (existingEvent.startTime) {
        const [hours, minutes] = existingEvent.startTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes);
        setStartTime(timeDate);
      }
      
      if (existingEvent.endTime) {
        const [hours, minutes] = existingEvent.endTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes);
        setEndTime(timeDate);
      }
      
      setLocation(existingEvent.location || "");
    }
  }, [existingEvent]);

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

  const handleSave = async () => {
    if (!validate()) return;

    const event = {
      title: title.trim(),
      description: description.trim() || null,
      date: formatDate(date),
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      location: location.trim() || null,
      assignedTo: selectedEmployees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })),
      createdAt: Date.now(),
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
          await push(eventsRef, event);
          // After creating, allow creating another or go back
          Alert.alert("Succes", "Event oprettet.", [
            {
              text: "Opret et mere",
              onPress: () => {
                // clear form for next input
                setTitle("");
                setDescription("");
                setDate(new Date());
                setStartTime(new Date());
                setEndTime(new Date());
                setLocation("");
                setSelectedEmployees([]);
              },
            },
            { text: "Tilbage", onPress: () => navigation.goBack() },
          ]);
        }
    } catch (err) {
      Alert.alert("Fejl", err.message || "Kunne ikke gemme event");
    } finally {
      setSaving(false);
    }
  };

  const handleAddExpense = async () => {
    if (!eventId && !isEditing) {
      Alert.alert('Fejl', 'Du skal først gemme eventet før du kan tilføje udgifter.');
      return;
    }

    if (!expenseDesc.trim() || !expenseAmount.trim()) {
      Alert.alert('Validering', 'Beskrivelse og beløb skal udfyldes');
      return;
    }

    let receiptUrl = expenseReceiptUrl || null;

    // If a local file path was provided (not implemented picker), upload to storage
    // Here we only support direct URL input; if you want picker support, I can add expo-document-picker.

    try {
      const expensesRef = ref(rtdb, `companies/${companyCode}/events/${eventId || ''}/expenses`);
      const expenseObj = {
        description: expenseDesc.trim(),
        amount: parseFloat(expenseAmount),
        receiptUrl,
        createdAt: Date.now(),
      };
      await push(expensesRef, expenseObj);
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseReceiptUrl('');
      Alert.alert('Succes', 'Udgift tilføjet');
    } catch (err) {
      Alert.alert('Fejl', err.message || 'Kunne ikke tilføje udgift');
    }
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
    <SafeAreaView style={globalStyles.eventScreenContainer}>
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
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
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
                    {formatTime(startTime)}
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
                    {formatTime(endTime)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Time pickers */}
            {showStartTimePicker && (
              <View style={globalStyles.modernPickerContainer}>
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  onChange={(event, selectedTime) => {
                    if (Platform.OS === 'android') {
                      setShowStartTimePicker(false);
                    }
                    if (selectedTime) setStartTime(selectedTime);
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
                  value={endTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  onChange={(event, selectedTime) => {
                    if (Platform.OS === 'android') {
                      setShowEndTimePicker(false);
                    }
                    if (selectedTime) setEndTime(selectedTime);
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

          {/* Medarbejdere Section */}
          <View style={globalStyles.eventSection}>
            <Text style={globalStyles.eventSectionTitle}>Tildel medarbejdere</Text>
            {employees.length === 0 ? (
              <Text style={globalStyles.eventEmptyText}>Ingen godkendte medarbejdere</Text>
            ) : (
              <View style={globalStyles.eventEmployeeList}>
                {employees.map(emp => {
                  const selected = selectedEmployees.some(e => e.id === emp.id);
                  return (
                    <TouchableOpacity 
                      key={emp.id} 
                      onPress={() => toggleSelectEmployee(emp)} 
                      style={[globalStyles.eventEmployeeItem, selected && globalStyles.eventEmployeeItemSelected]}
                    >
                      <View style={globalStyles.eventEmployeeInfo}>
                        <View style={[globalStyles.eventAvatar, selected && globalStyles.eventAvatarSelected]}>
                          <Text style={[globalStyles.eventAvatarText, selected && globalStyles.eventAvatarTextSelected]}>
                            {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                          </Text>
                        </View>
                        <Text style={[globalStyles.eventEmployeeName, selected && globalStyles.eventEmployeeNameSelected]}>
                          {emp.firstName} {emp.lastName}
                        </Text>
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={24} color="#007AFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Udgifter Section */}
          {isEditing && (
            <View style={globalStyles.eventSection}>
              <Text style={globalStyles.eventSectionTitle}>Udgifter</Text>
              {expenses.length === 0 ? (
                <Text style={globalStyles.eventEmptyText}>Ingen udgifter tilføjet</Text>
              ) : (
                <View style={globalStyles.eventExpenseList}>
                  {expenses.map(ex => (
                    <View key={ex.id} style={globalStyles.eventExpenseItem}>
                      <View style={globalStyles.eventExpenseIcon}>
                        <Ionicons name="receipt-outline" size={20} color="#007AFF" />
                      </View>
                      <View style={globalStyles.eventExpenseDetails}>
                        <Text style={globalStyles.eventExpenseDescription}>{ex.description}</Text>
                        <Text style={globalStyles.eventExpenseAmount}>{ex.amount} kr</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={globalStyles.eventAddExpenseContainer}>
                <TextInput 
                  style={globalStyles.eventInput} 
                  value={expenseDesc} 
                  onChangeText={setExpenseDesc} 
                  placeholder="Beskrivelse" 
                  placeholderTextColor="#999"
                />
                <TextInput 
                  style={globalStyles.eventInput} 
                  value={expenseAmount} 
                  onChangeText={setExpenseAmount} 
                  placeholder="Beløb (f.eks. 125.50)" 
                  placeholderTextColor="#999"
                  keyboardType="numeric" 
                />
                <TouchableOpacity style={globalStyles.eventSecondaryButton} onPress={handleAddExpense}>
                  <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                  <Text style={globalStyles.eventSecondaryButtonText}>Tilføj udgift</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
    </SafeAreaView>
  );
}
