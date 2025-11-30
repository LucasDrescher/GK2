import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { rtdb } from "../../database/firebase";
import { ref, get, child } from "firebase/database";
import { globalStyles, colors } from "../../styles";
import { Input, Button } from "../../components";

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
                params: { companyCode: foundCompanyCode, userId: foundUserId },
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
          
          // Tjek om medarbejderen har underskrevet kontrakt
          if (!foundUser.contract || !foundUser.contract.signedAt) {
            // Redirect til kontraktunderskrift
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Contract",
                  params: { userId: foundUserId, companyCode: foundCompanyCode },
                },
              ],
            });
            return;
          }
          
          // Alt OK - gå til EmployeeHome
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
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView
        style={globalStyles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={globalStyles.container}>
          <Text style={globalStyles.title}>Login</Text>

          <Input
            label="Email"
            placeholder="Indtast din email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Password"
            placeholder="Indtast dit password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            secureTextEntry
          />

          <Button 
            title="Login" 
            onPress={handleLogin}
            style={{ marginTop: 10 }}
          />

          <Button
            title="Opret bruger"
            variant="secondary"
            onPress={() => navigation.navigate("Register")}
            style={{ marginTop: 10 }}
          />
          
          <Button
            title="Opret virksomhed & admin"
            variant="secondary"
            onPress={() => navigation.navigate("AdminRegisterScreen")}
            style={{ marginTop: 10 }}
          />

          {/* MIDLERTIDIGE TESTKNAPPER */}
          <View style={{ marginTop: 30, gap: 10 }}>
            <Button
              title="[TEST] Gå til EmployeeHome"
              variant="secondary"
              onPress={() => navigation.reset({
                index: 0,
                routes: [
                  { name: "EmployeeHome", params: { userId: "testUser1", companyCode: "2000" } },
                ],
              })}
            />
            <Button
              title="[TEST] Gå til AdminHome"
              variant="secondary"
              onPress={() => navigation.reset({
                index: 0,
                routes: [
                  { name: "AdminHome", params: { companyCode: "2000", userId: "adminTest1" } },
                ],
              })}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
