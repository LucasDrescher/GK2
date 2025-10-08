import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { rtdb } from "../database/firebase";
import { ref, onValue } from "firebase/database";
import { globalStyles } from "../styles";

export default function ShiftListScreen({ route }) {
  const { userId, companyCode } = route.params || {}; // får begge fra EmployeeHome
  const [shifts, setShifts] = useState([]);
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    if (!userId) {
      console.log("[SHIFTS] Ingen userId modtaget i route");
      return;
    }

    console.log("[SHIFTS] userId fra route:", userId);

    // Hent medarbejder-data
    const empRef = ref(rtdb, `companies/${companyCode}/employees/` + userId);
    onValue(empRef, (snapshot) => {
      const empData = snapshot.val();
      console.log("[SHIFTS] medarbejderdata:", empData);

      if (empData) {
        setEmployee(empData);

        if (empData.approved) {
          // Brug companyCode fra employee eller fallback fra route
          const code = empData.companyCode || companyCode;
          const shiftsRef = ref(rtdb, `companies/${code}/shifts`);

          onValue(shiftsRef, (snap) => {
            const shiftData = snap.val();
            console.log("[SHIFTS] rå vagter fra Firebase:", shiftData);

            if (shiftData) {
              const arr = Object.entries(shiftData).map(([id, s]) => ({
                id,
                ...s,
              }));
              console.log("[SHIFTS] arr efter mapping:", arr);
              setShifts(arr);
            } else {
              console.log("[SHIFTS] ingen vagter fundet i databasen");
              setShifts([]);
            }
          });
        }
      }
    });
  }, [userId, companyCode]);

  if (!employee) {
    return (
      <View style={globalStyles.container}>
        <Text>Henter medarbejderdata...</Text>
      </View>
    );
  }

  if (!employee.approved) {
    return (
      <View style={globalStyles.container}>
        <Text>Din tilmelding skal godkendes af lederen</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Dine vagter</Text>
      {shifts.length === 0 ? (
        <Text>Ingen vagter fundet</Text>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 15 }}>
              <Text>Dato: {item.date}</Text>
              <Text>Tid: {item.time}</Text>
              <Text>Rolle: {item.role}</Text>
              <Text>Sted: {item.location}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
