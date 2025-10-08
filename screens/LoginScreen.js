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
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const normEmail = (email || "").toLowerCase().trim();
    const normPassword = (password || "").trim();

    if (!normEmail || !normPassword) {
      Alert.alert("Fejl", "Udfyld både email og password");
      return;
    }

    const dbRef = ref(rtdb);
    get(child(dbRef, "employees"))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          Alert.alert("Fejl", "Ingen brugere fundet");
          return;
        }

        const data = snapshot.val();
        const users = Object.entries(data).map(([id, u]) => ({
          id,
          ...u,
          email: ((u && u.email) || "").toLowerCase().trim(),
          password: ((u && u.password) || "").trim(),
          companyCode: ((u && u.companyCode) || "").toString().trim(),
          role: (u && u.role) || "employee",
          approved: !!(u && u.approved),
        }));


        // Først prøv at finde bruger med email+password (nyt flow)
        let user = users.find(
          (u) => u.email === normEmail && u.password === normPassword
        );

        // Hvis ikke fundet, prøv fallback: email+companyCode (gammelt flow)
        if (!user) {
          user = users.find(
            (u) => u.email === normEmail && !u.password && u.companyCode === normPassword
          );
        }

        if (!user) {
          Alert.alert("Fejl", "Forkert email, password eller virksomhedskode");
          return;
        }

        if (user.role === "admin") {
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
            Alert.alert("Info", "Din tilmelding skal godkendes af lederen");
            return;
          }
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


        <Text>Password:</Text>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={globalStyles.input}
          autoCapitalize="none"
          secureTextEntry
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
        <View style={{ marginTop: 10 }}>
          <Button
            title="Opret virksomhed & admin"
            onPress={() => navigation.navigate("AdminRegisterScreen")}
          />
        </View>

        {/* MIDLOERTIDIGE TESTKNAPPER */}
        <View style={{ marginTop: 30 }}>
          <Button
            title="[TEST] Gå til EmployeeHome"
            color="#888"
            onPress={() => navigation.reset({
              index: 0,
              routes: [
                { name: "EmployeeHome", params: { userId: "testUser1", companyCode: "2000" } },
              ],
            })}
          />
        </View>
        <View style={{ marginTop: 10 }}>
          <Button
            title="[TEST] Gå til AdminHome"
            color="#888"
            onPress={() => navigation.reset({
              index: 0,
              routes: [
                { name: "AdminHome", params: { companyCode: "2000" } },
              ],
            })}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
