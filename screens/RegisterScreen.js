import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { rtdb } from "../database/firebase";
import { ref, set, get, child } from "firebase/database";
import { globalStyles } from "../styles";

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [companyCode, setCompanyCode] = useState("");

  const handleRegister = () => {
    // Tjek om alle felter er udfyldt
    if (!firstName || !lastName || !birthday || !address || !country || !email || !companyCode) {
      Alert.alert("Fejl", "Udfyld alle felter!");
      return;
    }

    const userId = Date.now();

    // Tjek virksomhedskoden i Firebase
    const companyRef = ref(rtdb);
    get(child(companyRef, `companies/${companyCode}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          Alert.alert("Fejl", "Virksomhedskoden findes ikke!");
          return;
        }

        const companyName = snapshot.val().name;

        // Gem medarbejderdata under employees
        set(ref(rtdb, "employees/" + userId), {
          firstName,
          lastName,
          birthday,
          address,
          country,
          email,
          companyCode,
          companyName,
          role: "employee",
          approved: false // Lederen skal acceptere senere
        })
          .then(() => {
            Alert.alert(
              "Succes",
              "Medarbejder oprettet! Afventer godkendelse fra manager.",
              [{ text: "OK", onPress: () => navigation.navigate("Login") }]
            );
          })
          .catch((error) => Alert.alert("Fejl", error.message));
      })
      .catch((error) => Alert.alert("Fejl", error.message));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={globalStyles.container}>
        <Text style={globalStyles.title}>Registrer medarbejder</Text>

        <Text>Fornavn:</Text>
        <TextInput placeholder="Fornavn" value={firstName} onChangeText={setFirstName} style={globalStyles.input} />

        <Text>Efternavn:</Text>
        <TextInput placeholder="Efternavn" value={lastName} onChangeText={setLastName} style={globalStyles.input} />

        <Text>Fødselsdag:</Text>
        <TextInput placeholder="dd-mm-yyyy" value={birthday} onChangeText={setBirthday} style={globalStyles.input} />

        <Text>Adresse:</Text>
        <TextInput placeholder="Adresse" value={address} onChangeText={setAddress} style={globalStyles.input} />

        <Text>Land:</Text>
        <TextInput placeholder="Land" value={country} onChangeText={setCountry} style={globalStyles.input} />

        <Text>Email:</Text>
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={globalStyles.input} />

        <Text>Virksomhedskode:</Text>
        <TextInput placeholder="Kode" value={companyCode} onChangeText={setCompanyCode} style={globalStyles.input} />

        <View style={globalStyles.button}>
          <Button title="Register" onPress={handleRegister} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
