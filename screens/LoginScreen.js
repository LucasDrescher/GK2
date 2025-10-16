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
    get(child(dbRef, "companies"))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          Alert.alert("Fejl", "Ingen virksomheder fundet");
          return;
        }
        const companies = snapshot.val();
        let foundUser = null;
        let foundCompanyCode = null;
        let foundUserId = null;
        // Gennemgå alle virksomheder og deres admins/employees
        Object.entries(companies).forEach(([companyCode, companyData]) => {
          // Tjek admins
          if (companyData && companyData.admins) {
            Object.entries(companyData.admins).forEach(([userId, u]) => {
              const userEmail = ((u && u.email) || "").toLowerCase().trim();
              const userPassword = ((u && u.password) || "").trim();
              const userCompanyCode = ((u && u.companyCode) || "").toString().trim();
              if (!foundUser && userEmail === normEmail && userPassword === normPassword) {
                foundUser = { id: userId, ...u };
                foundCompanyCode = companyCode;
                foundUserId = userId;
              }
              if (!foundUser && userEmail === normEmail && !userPassword && userCompanyCode === normPassword) {
                foundUser = { id: userId, ...u };
                foundCompanyCode = companyCode;
                foundUserId = userId;
              }
            });
          }
          // Tjek employees
          if (companyData && companyData.employees) {
            Object.entries(companyData.employees).forEach(([userId, u]) => {
              const userEmail = ((u && u.email) || "").toLowerCase().trim();
              const userPassword = ((u && u.password) || "").trim();
              const userCompanyCode = ((u && u.companyCode) || "").toString().trim();
              if (!foundUser && userEmail === normEmail && userPassword === normPassword) {
                foundUser = { id: userId, ...u };
                foundCompanyCode = companyCode;
                foundUserId = userId;
              }
              if (!foundUser && userEmail === normEmail && !userPassword && userCompanyCode === normPassword) {
                foundUser = { id: userId, ...u };
                foundCompanyCode = companyCode;
                foundUserId = userId;
              }
            });
          }
        });

        if (!foundUser) {
          Alert.alert("Fejl", "Forkert email, password eller virksomhedskode");
          return;
        }

        if (foundUser.role === "admin") {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "AdminHome",
                params: { companyCode: foundCompanyCode },
              },
            ],
          });
          return;
        }

        if (foundUser.role === "employee") {
          if (!foundUser.approved) {
            Alert.alert("Info", "Din tilmelding skal godkendes af lederen");
            return;
          }
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "EmployeeHome",
                params: { userId: foundUserId, companyCode: foundCompanyCode },
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
