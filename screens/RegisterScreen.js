import React, { useState, useEffect } from "react";
import { Platform, Modal, Pressable, Vibration, Image, TouchableOpacity } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import CountryPicker from 'react-native-country-picker-modal';
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [passportUri, setPassportUri] = useState(null);

  const handleRegister = () => {
    if (!firstName || !lastName || !birthday || !address || !country || !email || !password || !companyCode) {
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

        set(ref(rtdb, `companies/${companyCode}/employees/${userId}`), {
          firstName,
          lastName,
          birthday,
          address,
          country,
          email,
          password, // gem password
          passportUri: passportUri || null,
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

  // Listen for passportUri being passed back from Camera
  useEffect(() => {
    const p = route?.params?.passportUri;
    if (p) setPassportUri(p);
  }, [route?.params?.passportUri]);

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
            <Pressable onPress={() => {
              Vibration.vibrate(10);
              setShowDatePicker(true);
            }}>
              <Text
                style={[globalStyles.input, { paddingVertical: 14, color: birthday ? '#000' : '#888' }]}
              >
                {birthday
                  ? (() => {
                      const [y, m, d] = birthday.split('-');
                      if (y && m && d) {
                        const date = new Date(Number(y), Number(m) - 1, Number(d));
                        return `${d}. ${date.toLocaleString('da-DK', { month: 'long' })} ${y}`;
                      }
                      return birthday;
                    })()
                  : 'Vælg fødselsdag'}
              </Text>
            </Pressable>
            {showDatePicker && (
              Platform.OS === 'ios' ? (
                <Modal
                  transparent
                  animationType="slide"
                  visible={showDatePicker}
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 }}>
                      <View style={{ height: 240, width: '100%', justifyContent: 'center' }}>
                        <DateTimePicker
                          value={birthday && birthday.match(/^\d{4}-\d{2}-\d{2}$/)
                            ? new Date(birthday)
                            : new Date(2000, 0, 1)}
                          mode="date"
                          display="spinner"
                          textColor="#000"
                          onChange={(event, selectedDate) => {
                            if (selectedDate) {
                              const d = selectedDate;
                              const year = d.getFullYear();
                              const month = (d.getMonth() + 1).toString().padStart(2, '0');
                              const day = d.getDate().toString().padStart(2, '0');
                              setBirthday(`${year}-${month}-${day}`);
                            }
                          }}
                          maximumDate={new Date()}
                          style={{ width: '100%' }}
                        />
                      </View>
                      <Button title="OK" onPress={() => setShowDatePicker(false)} />
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={birthday && birthday.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? new Date(birthday)
                    : new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const d = selectedDate;
                      const year = d.getFullYear();
                      const month = (d.getMonth() + 1).toString().padStart(2, '0');
                      const day = d.getDate().toString().padStart(2, '0');
                      setBirthday(`${year}-${month}-${day}`);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )
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
                <Text style={{ color: country ? '#000' : '#888' }}>
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
              returnKeyType="done"
            />

            <Text>Pas:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title={passportUri ? 'Ret pas' : 'Upload pas'}
                  onPress={() => navigation.navigate('Camera', { targetField: 'passportUri' })}
                />
              </View>
              {passportUri ? (
                <TouchableOpacity onPress={() => navigation.navigate('Image', { image: passportUri })}>
                  <Image source={{ uri: passportUri }} style={{ width: 64, height: 44, borderRadius: 6 }} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={globalStyles.button}>
              <Button title="Register" onPress={handleRegister} />
            </View>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
