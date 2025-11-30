import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Modal,
  Pressable,
  Vibration,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePicker from '@react-native-community/datetimepicker';
import CountryPicker from 'react-native-country-picker-modal';
import { rtdb } from "../../database/firebase";
import { ref, set, get, child } from "firebase/database";
import { globalStyles } from "../../styles";

export default function AdminRegisterScreen({ navigation }) {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nationality, setNationality] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [address, setAddress] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleRegister = async () => {
    // Basic validation
    if (!companyName || !companyAddress || !companyCode || !firstName || !lastName || !adminEmail || !adminPassword) {
      Alert.alert("Fejl", "Udfyld alle påkrævede felter!");
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: adminEmail,
        password: adminPassword,
        birthDate: birthDate.trim(),
        nationality: nationality.trim(),
        address: address.trim(),
        companyCode,
        companyName,
        companyAddress: companyAddress.trim(),
        role: "admin",
        approved: true,
        createdAt: Date.now(),
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
        <KeyboardAwareScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
          enableOnAndroid
          extraScrollHeight={150}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
        >
            <Text style={globalStyles.title}>Opret virksomhed & admin</Text>

            <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>Virksomhedsoplysninger</Text>
            
            <Text>Virksomhedsnavn:</Text>
            <TextInput
              placeholder="Virksomhedsnavn"
              value={companyName}
              onChangeText={setCompanyName}
              style={globalStyles.input}
              returnKeyType="next"
            />

            <Text>Virksomhedens adresse:</Text>
            <TextInput
              placeholder="Vejnavn 123, 1234 By"
              value={companyAddress}
              onChangeText={setCompanyAddress}
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

            <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>Personlige oplysninger</Text>

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
            <Pressable onPress={() => {
              Vibration.vibrate(10);
              setShowDatePicker(true);
            }}>
              <Text
                style={[globalStyles.input, { paddingVertical: 14, color: birthDate ? '#000' : '#888' }]}
              >
                {birthDate || 'Vælg fødselsdag'}
              </Text>
            </Pressable>
            {showDatePicker && (
              <Modal
                transparent
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={globalStyles.modalBackdrop}>
                  <View style={globalStyles.modalCard}>
                    <View style={globalStyles.modalPickerContainer}>
                      <DateTimePicker
                        value={birthDate && birthDate.match(/^\d{4}-\d{2}-\d{2}$/)
                          ? new Date(birthDate)
                          : new Date(2000, 0, 1)}
                        mode="date"
                        display="spinner"
                        textColor="#000"
                        locale="da-DK"
                        onChange={(event, selectedDate) => {
                          if (selectedDate) {
                            const day = selectedDate.getDate();
                            const monthNames = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 
                                                'juli', 'august', 'september', 'oktober', 'november', 'december'];
                            const month = monthNames[selectedDate.getMonth()];
                            const year = selectedDate.getFullYear();
                            
                            // Format: "6/marts/2002"
                            setBirthDate(`${day}/${month}/${year}`);
                          }
                        }}
                        maximumDate={new Date()}
                        style={globalStyles.fullWidth}
                      />
                    </View>
                    <Button title="OK" onPress={() => setShowDatePicker(false)} />
                  </View>
                </View>
              </Modal>
            )}

            <Text>Nationalitet:</Text>
            <Pressable onPress={() => setShowCountryPicker(true)}>
              <View style={[globalStyles.input, { paddingVertical: 14 }]}> 
                <Text style={nationality ? globalStyles.countryTextDark : globalStyles.countryTextLight}>
                  {nationality ? nationality : 'Vælg land'}
                </Text>
              </View>
            </Pressable>
            {showCountryPicker && (
              <CountryPicker
                visible={showCountryPicker}
                withFilter
                withFlag={false}
                withCountryNameButton
                withAlphaFilter
                withCallingCode={false}
                onSelect={(c) => {
                  setNationality(c.name);
                  setCountryCode(c.cca2);
                  setShowCountryPicker(false);
                }}
                onClose={() => setShowCountryPicker(false)}
                countryCode={countryCode || undefined}
              />
            )}

            <Text>Adresse:</Text>
            <TextInput
              placeholder="Vejnavn 123, 1234 By"
              value={address}
              onChangeText={setAddress}
              style={globalStyles.input}
              returnKeyType="next"
            />

            <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>Login oplysninger</Text>

            <Text>Email:</Text>
            <TextInput
              placeholder="Email"
              value={adminEmail}
              onChangeText={setAdminEmail}
              style={globalStyles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />

            <Text>Password:</Text>
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
