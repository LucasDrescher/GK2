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
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { rtdb } from "../database/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import { GlobalStyle as GS, Farver } from "../styles/GlobalStyle";

// Hvis du vil bruge datetimepicker:
// import DateTimePicker from '@react-native-community/datetimepicker';

export default function AdminShiftList({ navigation }) {
  const [shifts, setShifts] = useState(null);
  const [employees, setEmployees] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    area: "",
    contactPerson: "",
    startTime: "",
    endTime: "",
    assignedTo: "",
  });

  // Hent vagter og medarbejdere
  useEffect(() => {
    const shiftRef = ref(rtdb, "Shifts");
    const unsubscribe = onValue(shiftRef, (snap) => {
      const data = snap.val();
      setShifts(data || {});
    });

    const empRef = ref(rtdb, "Employees");
    const unsubEmp = onValue(empRef, (snap) => {
      const data = snap.val();
      setEmployees(data || {});
    });

    return () => {
      unsubscribe();
      unsubEmp();
    };
  }, []);

  const openModal = (shiftId = null) => {
    if (shiftId && shifts[shiftId]) {
      setEditingId(shiftId);
      setFormData({ ...shifts[shiftId] });
    } else {
      setEditingId(null);
      setFormData({
        area: "",
        contactPerson: "",
        startTime: "",
        endTime: "",
        assignedTo: "",
      });
    }
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

    try {
      if (editingId) {
        await update(ref(rtdb, `Shifts/${editingId}`), formData);
        Alert.alert("Vagt opdateret");
      } else {
        await push(ref(rtdb, "Shifts"), formData);
        Alert.alert("Ny vagt oprettet");
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert("Fejl: " + e.message);
    }
  };

  const deleteShift = async (id) => {
    try {
      await remove(ref(rtdb, `Shifts/${id}`));
      Alert.alert("Vagt slettet");
    } catch (e) {
      Alert.alert("Fejl: " + e.message);
    }
  };

  if (shifts === null) {
    return (
      <SafeAreaView style={GS.container}>
        <View style={[GS.center, { marginTop: 50 }]}>
          <ActivityIndicator />
          <Text>Indlæser vagter…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ids = Object.keys(shifts);

  return (
    <SafeAreaView style={GS.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>📋 Admin – Vagtplan</Text>
        <Button title="➕ Ny vagt" onPress={() => openModal()} color={Farver.primær} />
      </View>

      {ids.length === 0 ? (
        <View style={[GS.center, { marginTop: 50 }]}>
          <Text style={{ textAlign: "center" }}>Ingen vagter oprettet endnu</Text>
        </View>
      ) : (
        <FlatList
          data={ids}
          keyExtractor={(id) => id}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
          renderItem={({ item: id }) => {
            const shift = shifts[id];
            return (
              <TouchableOpacity
                style={styles.cardContainer}
                onPress={() => openModal(id)}
              >
                <Text style={styles.cardTitle}>{shift.area}</Text>
                <Text style={styles.cardText}>Kontaktperson: {shift.contactPerson}</Text>
                <Text style={styles.cardText}>
                  🕒 {shift.startTime} – {shift.endTime}
                </Text>
                <Text style={styles.cardText}>
                  👷 Medarbejder: {shift.assignedTo || "Ikke tildelt"}
                </Text>
                <Button title="❌ Slet" color="red" onPress={() => deleteShift(id)} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={GS.container}>
          <ScrollView contentContainerStyle={[GS.skærmIndhold, { paddingHorizontal: 16, paddingTop: 20 }]}>
            <Text style={styles.modalTitle}>{editingId ? "Rediger vagt" : "Opret ny vagt"}</Text>

            <TextInput
              style={styles.input}
              placeholder="Område (fx Bar 1, Podium)"
              placeholderTextColor="#888"
              value={formData.area}
              onChangeText={(t) => setFormData({ ...formData, area: t })}
            />

            <TextInput
              style={styles.input}
              placeholder="Kontaktperson (Teamleder)"
              placeholderTextColor="#888"
              value={formData.contactPerson}
              onChangeText={(t) => setFormData({ ...formData, contactPerson: t })}
            />

            <TextInput
              style={styles.input}
              placeholder="Vagtstart (fx 18:00)"
              placeholderTextColor="#888"
              value={formData.startTime}
              onChangeText={(t) => setFormData({ ...formData, startTime: t })}
            />
            {/* Hvis du vil bruge DateTimePicker til starttid, kan du indsætte her */}

            <TextInput
              style={styles.input}
              placeholder="Vagtslut (fx 23:00)"
              placeholderTextColor="#888"
              value={formData.endTime}
              onChangeText={(t) => setFormData({ ...formData, endTime: t })}
            />
            {/* Hvis du vil bruge DateTimePicker til sluttid, kan du indsætte her */}

            <Text style={styles.sectionTitle}>Tilknyt medarbejder</Text>
            {Object.keys(employees).length === 0 ? (
              <Text style={{ textAlign: "center" }}>Ingen medarbejdere endnu</Text>
            ) : (
              Object.entries(employees).map(([id, emp]) => (
                <TouchableOpacity
                  key={id}
                  style={styles.assignBtn}
                  onPress={() => setFormData({ ...formData, assignedTo: emp.name })}
                >
                  <Text style={styles.assignText}>{emp.name}</Text>
                </TouchableOpacity>
              ))
            )}

            <View style={{ marginTop: 24 }}>
              <Button title="Gem" onPress={saveShift} color={Farver.primær} />
              <View style={{ height: 12 }} />
              <Button title="Annuller" onPress={() => setModalVisible(false)} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },
  cardContainer: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#222",
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    color: "#000", // Synlig tekst
  },
  assignBtn: {
    padding: 10,
    backgroundColor: "#e0e0e0",
    marginVertical: 4,
    borderRadius: 8,
  },
  assignText: {
    color: "#222",
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
    color: "#007AFF",
  },
});
