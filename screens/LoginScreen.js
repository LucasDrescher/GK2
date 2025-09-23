import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { rtdb } from "../database/firebase";
import { ref, get, child } from "firebase/database";
import { globalStyles } from "../styles";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [companyCode, setCompanyCode] = useState("");

  const handleLogin = () => {
    const normEmail = (email || "").toLowerCase().trim();
    const normCode = (companyCode || "").toString().trim();

    if (!normEmail || !normCode) {
      Alert.alert("Fejl", "Udfyld både email og virksomhedskode");
      return;
    }

    console.log("[LOGIN] input:", { normEmail, normCode });

    const dbRef = ref(rtdb);
    get(child(dbRef, "employees"))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          console.log("[LOGIN] employees tom/ikke fundet");
          Alert.alert("Fejl", "Ingen brugere fundet");
          return;
        }

        const data = snapshot.val();
        console.log("[LOGIN] rå data fra Firebase:", data);

        
        const users = Object.entries(data).map(([id, u]) => ({
          id,
          ...u,
          email: ((u && u.email) || "").toLowerCase().trim(),
          companyCode: ((u && u.companyCode) || "").toString().trim(),
          role: (u && u.role) || "employee",
          approved: !!(u && u.approved),
        }));

        console.log("[LOGIN] normaliserede users:", users);

        
        const user = users.find(
          (u) => u.email === normEmail && u.companyCode === normCode
        );

        console.log("[LOGIN] matchet user:", user);

        if (!user) {
          Alert.alert("Fejl", "Forkert email eller virksomhedskode");
          return;
        }

        
        if (user.role === "admin") {
          console.log("[LOGIN] admin login OK → AdminHome");

          
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "AdminHome",
                params: { companyCode: user.companyCode },
              },
            ],
          });
          return;
        }

        if (user.role === "employee") {
          if (!user.approved) {
            console.log("[LOGIN] employee ikke godkendt endnu");
            Alert.alert("Info", "Din tilmelding skal godkendes af lederen");
            return;
          }
          console.log("[LOGIN] employee godkendt → EmployeeHome, userId:", user.id);

          
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "EmployeeHome",
                params: { userId: user.id, companyCode: user.companyCode },
              },
            ],
          });
          return;
        }

        Alert.alert("Fejl", "Ugyldig brugerrolle");
      })
      .catch((error) => {
        console.log("[LOGIN] fejl ved get employees:", error);
        Alert.alert("Fejl", error.message);
      });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={globalStyles.container}>
        <Text style={globalStyles.title}>Login</Text>

        <Text>Email:</Text>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={globalStyles.input}
        />

        <Text>Virksomhedskode:</Text>
        <TextInput
          placeholder="Kode"
          value={companyCode}
          onChangeText={setCompanyCode}
          style={globalStyles.input}
          autoCapitalize="none"
        />

        <View style={globalStyles.button}>
          <Button title="Login" onPress={handleLogin} />
        </View>

        <View style={{ marginTop: 10 }}>
          <Button
            title="Opret bruger"
            onPress={() => navigation.navigate("Register")}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
