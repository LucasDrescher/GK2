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

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [companyCode, setCompanyCode] = useState("");

  const handleRegister = () => {
    if (!firstName || !lastName || !birthday || !address || !country || !email || !companyCode) {
      Alert.alert("Fejl", "Udfyld alle felter!");
      return;
    }

    const userId = Date.now();

    const companyRef = ref(rtdb);
    get(child(companyRef, `companies/${companyCode}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          Alert.alert("Fejl", "Virksomhedskoden findes ikke!");
          return;
        }

        const companyName = snapshot.val().name;

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
          approved: false,
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
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAwareScrollView
            contentContainerStyle={[globalStyles.container, { paddingBottom: 100 }]}
            showsVerticalScrollIndicator={false}
            enableOnAndroid
            extraScrollHeight={100} // løfter visningen så aktive felter aldrig dækkes
            keyboardOpeningTime={0}
          >
            <Text style={globalStyles.title}>Registrer medarbejder</Text>

            <Text>Fornavn:</Text>
            <TextInput
              placeholder="Fornavn"
              value={firstName}
              onChangeText={setFirstName}
              style={globalStyles.input}
              returnKeyType="next"
            />

            <Text>Efternavn:</Text>
            <TextInput
              placeholder="Efternavn"
              value={lastName}
              onChangeText={setLastName}
              style={globalStyles.input}
              returnKeyType="next"
            />

            <Text>Fødselsdag:</Text>
            <TextInput
              placeholder="dd-mm-yyyy"
              value={birthday}
              onChangeText={setBirthday}
              style={globalStyles.input}
              returnKeyType="next"
            />

            <Text>Adresse:</Text>
            <TextInput
              placeholder="Adresse"
              value={address}
              onChangeText={setAddress}
              style={globalStyles.input}
              returnKeyType="next"
            />

            <Text>Land:</Text>
            <TextInput
              placeholder="Land"
              value={country}
              onChangeText={setCountry}
              style={globalStyles.input}
              returnKeyType="next"
            />

            <Text>Email:</Text>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={globalStyles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />

            <Text>Virksomhedskode:</Text>
            <TextInput
              placeholder="Kode"
              value={companyCode}
              onChangeText={setCompanyCode}
              style={globalStyles.input}
              autoCapitalize="none"
              returnKeyType="done"
            />

            <View style={globalStyles.button}>
              <Button title="Register" onPress={handleRegister} />
            </View>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
