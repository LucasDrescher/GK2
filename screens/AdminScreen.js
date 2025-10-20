import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, Alert } from "react-native";
import { rtdb } from "../database/firebase";
import { ref, onValue, update } from "firebase/database";
import { globalStyles } from "../styles";

export default function AdminScreen({ route }) {
  const { companyCode } = route.params;
  const [pendingEmployees, setPendingEmployees] = useState([]);

  useEffect(() => {
    const employeesRef = ref(rtdb, `companies/${companyCode}/employees`);
    onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const pending = Object.entries(data)
          .filter(([id, emp]) =>
            emp.approved === false &&
            emp.role === "employee"
          )
          .map(([id, emp]) => ({ id, ...emp }));
        setPendingEmployees(pending);
      } else {
        setPendingEmployees([]);
      }
    });
  }, [companyCode]);

  const handleApprove = (id) => {
    update(ref(rtdb, `companies/${companyCode}/employees/` + id), { approved: true })
      .then(() => Alert.alert("Succes", "Medarbejder godkendt!"))
      .catch((err) => Alert.alert("Fejl", err.message));
  };

  const handleReject = (id) => {
    update(ref(rtdb, `companies/${companyCode}/employees/` + id), { approved: "rejected" })
      .then(() => Alert.alert("Info", "Medarbejder afvist."))
      .catch((err) => Alert.alert("Fejl", err.message));
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Medarbejdere til godkendelse</Text>

      {pendingEmployees.length === 0 ? (
        <Text>Ingen medarbejdere til godkendelse</Text>
      ) : (
        <FlatList
          data={pendingEmployees}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={globalStyles.employeeCard}>
              <Text style={[globalStyles.employeeName, { marginBottom: 5 }]}>
                {item.firstName} {item.lastName}
              </Text>
              <Text>Fødselsdag: {item.birthday}</Text>
              <Text>Adresse: {item.address}</Text>
              <Text>Land: {item.country}</Text>
              <Text>Email: {item.email}</Text>
              <Text>Virksomhedskode: {item.companyCode}</Text>
              <Text>Virksomhed: {item.companyName}</Text>
              <Text>Rolle: {item.role}</Text>
              <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 5 }}>
                  <Button
                    title="Godkend"
                    onPress={() => handleApprove(item.id)}
                    color="green"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                  <Button
                    title="Afvis"
                    onPress={() => handleReject(item.id)}
                    color="red"
                  />
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
