import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { rtdb } from "../database/firebase";
import { ref, onValue } from "firebase/database";
import { globalStyles } from "../styles";

export default function EmployeeListScreen({ route }) {
  const { companyCode } = route.params;
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const employeesRef = ref(rtdb, "employees");
    onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allEmployees = Object.entries(data)
          .filter(([id, emp]) => emp.companyCode === companyCode)
          .map(([id, emp]) => ({ id, ...emp }));
        setEmployees(allEmployees);
      } else {
        setEmployees([]);
      }
    });
  }, [companyCode]);

  const getStatusText = (status) => {
    if (status === true) return "✅ Godkendt";
    if (status === false) return "⏳ Afventer";
    if (status === "rejected") return "❌ Afvist";
    return "Ukendt";
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Alle medarbejdere</Text>
      {employees.length === 0 ? (
        <Text>Ingen medarbejdere registreret endnu</Text>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                marginBottom: 15,
                padding: 15,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 10,
              }}
            >
              <Text style={{ fontWeight: "bold" }}>
                {item.firstName} {item.lastName}
              </Text>
              <Text>Fødselsdag: {item.birthday}</Text>
              <Text>Adresse: {item.address}</Text>
              <Text>Land: {item.country}</Text>
              <Text>Email: {item.email}</Text>
              <Text>Virksomhed: {item.companyName}</Text>
              <Text>Status: {getStatusText(item.approved)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
