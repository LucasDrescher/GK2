import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
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
  const [date, setDate] = useState(""); // expected YYYY-MM-DD
  const [startTime, setStartTime] = useState(""); // expected HH:MM
  const [endTime, setEndTime] = useState(""); // expected HH:MM
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
      setDate(existingEvent.date || "");
      setStartTime(existingEvent.startTime || "");
      setEndTime(existingEvent.endTime || "");
      setLocation(existingEvent.location || "");
      // prefilling assigned employees will be handled after employees are loaded
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
    if (!date.trim()) {
      Alert.alert("Validering", "Dato skal udfyldes (YYYY-MM-DD).");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const event = {
      title: title.trim(),
      description: description.trim() || null,
      date: date.trim(),
      startTime: startTime.trim() || null,
      endTime: endTime.trim() || null,
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
                setDate("");
                setStartTime("");
                setEndTime("");
                setLocation("");
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
    <SafeAreaView style={globalStyles.container}>
      <ScrollView>
  <Text style={globalStyles.title}>{isEditing ? 'Rediger event' : 'Opret nyt event'}</Text>

        <Text style={globalStyles.label}>Titel</Text>
        <TextInput
          style={globalStyles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Event titel"
        />

        <Text style={globalStyles.label}>Beskrivelse (valgfri)</Text>
        <TextInput
          style={globalStyles.textarea}
          value={description}
          onChangeText={setDescription}
          placeholder="Kort beskrivelse"
          multiline
        />

        <Text style={globalStyles.label}>Dato (YYYY-MM-DD)</Text>
        <TextInput
          style={globalStyles.input}
          value={date}
          onChangeText={setDate}
          placeholder="2025-12-31"
        />

        <View style={globalStyles.formRow}>
          <View style={[globalStyles.col, { marginRight: 8 }]}> 
            <Text style={globalStyles.label}>Start tid (HH:MM)</Text>
            <TextInput
              style={globalStyles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="08:00"
            />
          </View>
          <View style={globalStyles.col}>
            <Text style={globalStyles.label}>Slut tid (HH:MM)</Text>
            <TextInput
              style={globalStyles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="12:00"
            />
          </View>
        </View>

        <Text style={globalStyles.label}>Lokation (valgfri)</Text>
        <TextInput
          style={globalStyles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="F.eks. København"
        />

        <Text style={[globalStyles.subsectionTitle, { marginTop: 8 }]}>Tildel medarbejdere</Text>
        {employees.length === 0 ? (
          <Text style={globalStyles.noShiftsText}>Ingen godkendte medarbejdere</Text>
        ) : (
          employees.map(emp => {
            const selected = selectedEmployees.some(e => e.id === emp.id);
            return (
              <TouchableOpacity key={emp.id} onPress={() => toggleSelectEmployee(emp)} style={[globalStyles.assignedEmployeeContainer, { backgroundColor: selected ? '#e7f3ff' : '#fff' }]}>
                <Text style={globalStyles.assignedEmployeeText}>{emp.firstName} {emp.lastName}</Text>
                <Text style={{ color: selected ? '#007AFF' : '#666' }}>{selected ? 'Valgt' : 'Vælg'}</Text>
              </TouchableOpacity>
            );
          })
        )}

        <Text style={[globalStyles.subsectionTitle, { marginTop: 12 }]}>Udgifter</Text>
        {expenses.length === 0 ? (
          <Text style={globalStyles.noShiftsText}>Ingen udgifter</Text>
        ) : (
          expenses.map(ex => (
            <View key={ex.id} style={[globalStyles.shiftCard, { marginHorizontal: 0 }] }>
              <View style={{ flex: 1 }}>
                <Text style={globalStyles.shiftArea}>{ex.description}</Text>
                <Text style={globalStyles.shiftContact}>{ex.amount} kr</Text>
                {ex.receiptUrl ? <Text style={globalStyles.shiftEmployees}>Kvittering: {ex.receiptUrl}</Text> : null}
              </View>
            </View>
          ))
        )}

        <Text style={[globalStyles.label, { marginTop: 8 }]}>Tilføj udgift</Text>
        <TextInput style={globalStyles.input} value={expenseDesc} onChangeText={setExpenseDesc} placeholder="Beskrivelse" />
        <TextInput style={globalStyles.input} value={expenseAmount} onChangeText={setExpenseAmount} placeholder="Beløb (f.eks. 125.50)" keyboardType="numeric" />
        <TextInput style={globalStyles.input} value={expenseReceiptUrl} onChangeText={setExpenseReceiptUrl} placeholder="Kvittering URL (valgfri)" />
        <View style={{ marginTop: 8 }}>
          <TouchableOpacity style={globalStyles.formButton} onPress={handleAddExpense}>
            <Text style={{ fontWeight: '600' }}>Tilføj udgift</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            style={globalStyles.formButtonPrimary}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={globalStyles.formButtonText}>{saving ? 'Gemmer...' : (isEditing ? 'Opdater event' : 'Opret event')}</Text>
          </TouchableOpacity>

          {isEditing ? (
            <View style={{ marginTop: 10 }}>
              <TouchableOpacity style={[globalStyles.formButton, { backgroundColor: '#fff' }]} onPress={handleDelete}>
                <Text style={{ color: '#d9534f', fontWeight: '600' }}>Slet event</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
