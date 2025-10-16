import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { rtdb } from "../database/firebase";
import { ref, set, get, child } from "firebase/database";
import { globalStyles } from "../styles";

export default function AdminRegisterScreen({ navigation }) {
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleRegister = async () => {
    if (!companyName || !companyCode || !adminEmail || !adminPassword) {
      Alert.alert("Fejl", "Udfyld alle felter!");
      return;
    }

    // Tjek om virksomhedskode allerede findes
    const dbRef = ref(rtdb);
    const companySnap = await get(child(dbRef, `companies/${companyCode}`));
    if (companySnap.exists()) {
      Alert.alert("Fejl", "Virksomhedskoden er allerede i brug!");
      return;
    }

    // Opret virksomhed
    await set(ref(rtdb, `companies/${companyCode}`), {
      name: companyName,
      code: companyCode,
    });

    // Opret admin-bruger (nu under admins)
    const adminId = Date.now();
    await set(ref(rtdb, `companies/${companyCode}/admins/${adminId}`), {
      firstName: "Admin",
      lastName: "Bruger",
      email: adminEmail,
      password: adminPassword,
      companyCode,
      companyName,
      role: "admin",
      approved: true,
    });

    Alert.alert(
      "Succes",
      "Virksomhed og admin oprettet! Du kan nu logge ind som admin.",
      [{ text: "OK", onPress: () => navigation.navigate("Login") }]
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAwareScrollView
            contentContainerStyle={[globalStyles.container, { paddingBottom: 100 }]}
            showsVerticalScrollIndicator={false}
            enableOnAndroid
            extraScrollHeight={100}
            keyboardOpeningTime={0}
          >
            <Text style={globalStyles.title}>Opret virksomhed & admin</Text>

            <Text>Virksomhedsnavn:</Text>
            <TextInput
              placeholder="Virksomhedsnavn"
              value={companyName}
              onChangeText={setCompanyName}
              style={globalStyles.input}
              returnKeyType="next"
            />

            <Text>Virksomhedskode:</Text>
            <TextInput
              placeholder="Kode (unik)"
              value={companyCode}
              onChangeText={setCompanyCode}
              style={globalStyles.input}
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text>Admin email:</Text>
            <TextInput
              placeholder="Email"
              value={adminEmail}
              onChangeText={setAdminEmail}
              style={globalStyles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />

            <Text>Admin password:</Text>
            <TextInput
              placeholder="Password"
              value={adminPassword}
              onChangeText={setAdminPassword}
              style={globalStyles.input}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
            />

            <View style={globalStyles.button}>
              <Button title="Opret virksomhed & admin" onPress={handleRegister} />
            </View>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
