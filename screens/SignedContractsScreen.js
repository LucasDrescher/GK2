import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image } from "react-native";
import { rtdb } from "../database/firebase";
import { ref, onValue } from "firebase/database";
import { globalStyles } from "../styles";

export default function SignedContractsScreen({ route }) {
  const { companyCode } = route.params;
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const employeesRef = ref(rtdb, "employees");
    onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const signed = Object.entries(data)
          .filter(
            ([id, emp]) =>
              emp.companyCode === companyCode &&
              emp.role === "employee" &&
              emp.approved === true &&
              emp.signature // kun medarbejdere der HAR underskrevet
          )
          .map(([id, emp]) => ({ id, ...emp }));
        setEmployees(signed);
      } else {
        setEmployees([]);
      }
    });
  }, [companyCode]);

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Underskrevne kontrakter</Text>
      {employees.length === 0 ? (
        <Text>Ingen kontrakter underskrevet endnu</Text>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 20, borderBottomWidth: 1, paddingBottom: 10 }}>
              <Text style={{ fontWeight: "bold" }}>
                {item.firstName} {item.lastName}
              </Text>
              <Text>Email: {item.email}</Text>
              <Text>Adresse: {item.address}, {item.country}</Text>
              <Text>Virksomhed: {item.companyName}</Text>
              <Text style={{ marginTop: 10 }}>Underskrift:</Text>
              <Image
                source={{ uri: item.signature }}
                style={{ width: 250, height: 80, resizeMode: "contain" }}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}
