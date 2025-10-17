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
    // Basic validation
    if (!companyName || !companyCode || !adminEmail || !adminPassword) {
      Alert.alert("Fejl", "Udfyld alle felter!");
      return;
    }

    // Firebase keys cannot contain . # $ [ ]
    const forbidden = /[.#$\[\]]/;
    if (forbidden.test(companyCode)) {
      Alert.alert("Fejl", "Virksomhedskode må ikke indeholde . # $ [ eller ] — vælg en anden kode.");
      return;
    }

    try {
      console.log('AdminRegister: checking companyCode=', companyCode);
      // Tjek om virksomhedskode allerede findes
      const dbRef = ref(rtdb);
      const companySnap = await get(child(dbRef, `companies/${companyCode}`));
      if (companySnap.exists()) {
        console.log('AdminRegister: company exists for code', companyCode);
        Alert.alert("Fejl", "Virksomhedskoden er allerede i brug!");
        return;
      }

      // Opret virksomhed
      console.log('AdminRegister: creating company', companyCode);
      await set(ref(rtdb, `companies/${companyCode}`), {
        name: companyName,
        code: companyCode,
      });

      // Opret admin-bruger (nu under admins)
      const adminId = Date.now();
      console.log('AdminRegister: creating admin', adminId);
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

      console.log('AdminRegister: success for', companyCode);
      Alert.alert(
        "Succes",
        "Virksomhed og admin oprettet! Du kan nu logge ind som admin.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (err) {
      console.error('AdminRegister error:', err);
      Alert.alert('Fejl', err?.message || String(err));
    }
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
