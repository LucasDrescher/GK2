import React, { useState, useEffect } from "react";
import { Platform, Modal, Pressable, Vibration, Image, TouchableOpacity } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import CountryPicker from 'react-native-country-picker-modal';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { rtdb, storage } from "../../database/firebase";
import { ref, set, get, child } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { globalStyles, colors } from "../../styles";
import { Input, Button } from "../../components";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen({ navigation, route }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  // const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [passportUri, setPassportUri] = useState(null);
  const [cprNumber, setCprNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const handleRegister = async () => {
    if (!firstName || !lastName || !birthday || !address || !country || !phoneNumber || !email || !password || !companyCode || !cprNumber || !registrationNumber || !accountNumber) {
      Alert.alert("Fejl", "Udfyld alle felter!");
      return;
    }

    // Valider CPR-nummer format
    const cprRegex = /^\d{6}-?\d{4}$/;
    if (!cprRegex.test(cprNumber)) {
      Alert.alert("Fejl", "CPR-nummer skal være i format: DDMMÅÅ-XXXX");
      return;
    }

    // Valider reg.nr (4 cifre) og kontonummer (maks 10 cifre)
    if (!/^\d{4}$/.test(registrationNumber)) {
      Alert.alert("Fejl", "Registreringsnummer skal være 4 cifre");
      return;
    }
    if (!/^\d{1,10}$/.test(accountNumber)) {
      Alert.alert("Fejl", "Kontonummer skal være mellem 1-10 cifre");
      return;
    }

    const userId = Date.now();
    const trimmedCompanyCode = companyCode.trim();

    try {
      // Tjek om virksomheden findes
      const companyRef = ref(rtdb);
      const snapshot = await get(child(companyRef, `companies/${trimmedCompanyCode}`));
      
      if (!snapshot.exists()) {
        Alert.alert("Fejl", `Virksomhedskoden "${trimmedCompanyCode}" findes ikke i databasen!`);
        return;
      }

      const companyData = snapshot.val();
      const companyName = companyData?.name || "Unavngivet virksomhed";

      // Upload pas billede til Firebase Storage hvis det findes
      let uploadedPassportUrl = null;
      if (passportUri) {
        try {
          const response = await fetch(passportUri);
          const blob = await response.blob();
          const filename = `passports/${trimmedCompanyCode}/${userId}_${Date.now()}.jpg`;
          const fileRef = storageRef(storage, filename);
          await uploadBytes(fileRef, blob);
          uploadedPassportUrl = await getDownloadURL(fileRef);
        } catch (uploadError) {
          console.error('Error uploading passport:', uploadError);
          Alert.alert("Advarsel", "Kunne ikke uploade pas billede, men fortsætter registrering");
        }
      }

      // Gem medarbejder i database
      await set(ref(rtdb, `companies/${trimmedCompanyCode}/employees/${userId}`), {
        firstName,
        lastName,
        birthDate: birthday,
        address,
        nationality: country,
        phoneNumber,
        email,
        password,
        cprNumber,
        registrationNumber,
        accountNumber,
        passportUri: uploadedPassportUrl,
        companyCode: trimmedCompanyCode,
        companyName,
        role: "employee",
        approved: false,
      });

      Alert.alert(
        "Succes",
        "Medarbejder oprettet! Afventer godkendelse fra manager.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      Alert.alert("Fejl", error.message);
    }
  };

  // Listen for passportUri being passed back from Camera
  useEffect(() => {
    const p = route?.params?.passportUri;
    if (p) setPassportUri(p);
  }, [route?.params?.passportUri]);

  // Lyt efter global temp URI når man kommer tilbage fra Camera
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (global.tempPassportUri) {
        setPassportUri(global.tempPassportUri);
        global.tempPassportUri = null; // Ryd op
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={globalStyles.safeAreaWhite}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAwareScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
            enableOnAndroid
            extraScrollHeight={150}
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
            <Pressable onPress={() => {
              Vibration.vibrate(10);
              setShowDatePicker(true);
            }}>
              <Text
                style={[globalStyles.input, { paddingVertical: 14, color: birthday ? '#000' : '#888' }]}
              >
                {birthday || 'Vælg fødselsdag'}
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
                        value={birthday && birthday.match(/^\d{4}-\d{2}-\d{2}$/)
                          ? new Date(birthday)
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
                            setBirthday(`${day}/${month}/${year}`);
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

            <Text>Adresse:</Text>
            <TextInput
              placeholder="Adresse"
              value={address}
              onChangeText={setAddress}
              style={globalStyles.input}
              returnKeyType="next"
            />

            <Text>Land:</Text>
            <Pressable onPress={() => setShowCountryPicker(true)}>
              <View style={[globalStyles.input, { paddingVertical: 14 }]}> 
                <Text style={country ? globalStyles.countryTextDark : globalStyles.countryTextLight}>
                  {country ? country : 'Vælg land'}
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
                  setCountry(c.name);
                  setCountryCode(c.cca2);
                  setShowCountryPicker(false);
                }}
                onClose={() => setShowCountryPicker(false)}
                countryCode={countryCode || undefined}
              />
            )}

            <Text>Telefonnummer:</Text>
            <TextInput
              placeholder="+45 12 34 56 78"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={globalStyles.input}
              keyboardType="phone-pad"
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


            <Text>Password:</Text>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              style={globalStyles.input}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text>Virksomhedskode:</Text>
            <TextInput
              placeholder="Kode"
              value={companyCode}
              onChangeText={setCompanyCode}
              style={globalStyles.input}
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text>CPR-nummer:</Text>
            <TextInput
              placeholder="DDMMÅÅ-XXXX"
              value={cprNumber}
              onChangeText={(text) => {
                // Auto-formatering: tilføj bindestreg efter 6 cifre
                let formatted = text.replace(/[^0-9]/g, '');
                if (formatted.length > 6) {
                  formatted = formatted.slice(0, 6) + '-' + formatted.slice(6, 10);
                }
                setCprNumber(formatted);
              }}
              style={globalStyles.input}
              keyboardType="number-pad"
              maxLength={11}
              returnKeyType="next"
            />

            <Text>Registreringsnummer (Reg.nr):</Text>
            <TextInput
              placeholder="4 cifre (f.eks. 1234)"
              value={registrationNumber}
              onChangeText={(text) => {
                const formatted = text.replace(/[^0-9]/g, '').slice(0, 4);
                setRegistrationNumber(formatted);
              }}
              style={globalStyles.input}
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="next"
            />

            <Text>Kontonummer:</Text>
            <TextInput
              placeholder="Op til 10 cifre"
              value={accountNumber}
              onChangeText={(text) => {
                const formatted = text.replace(/[^0-9]/g, '').slice(0, 10);
                setAccountNumber(formatted);
              }}
              style={globalStyles.input}
              keyboardType="number-pad"
              maxLength={10}
              returnKeyType="done"
            />

            <Text>Pas:</Text>
            <Button
              title={passportUri ? 'Ret billede af pas' : 'Tag billede af pas'}
              variant="secondary"
              onPress={() => navigation.navigate('Camera', { targetField: 'passportUri' })}
              icon={<Ionicons name="camera-outline" size={20} color={colors.primary} />}
            />
            {passportUri ? (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Image', { image: passportUri })}
                style={{ marginTop: 12, alignItems: 'center' }}
              >
                <Image source={{ uri: passportUri }} style={{ width: 120, height: 120, borderRadius: 8 }} />
                <Text style={{ marginTop: 8, color: colors.success }}>✓ Billede uploadet</Text>
              </TouchableOpacity>
            ) : null}

            <Button 
              title="Register" 
              onPress={handleRegister}
              style={{ marginTop: 30 }}
            />
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
