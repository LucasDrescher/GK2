import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rtdb } from '../../database/firebase';
import { ref, onValue, update } from 'firebase/database';
import { globalStyles, colors } from '../../styles';

export default function EmployeeProfileScreen({ route, navigation }) {
  const { companyCode, userId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cprNumber, setCprNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [nationality, setNationality] = useState('');
  
  useEffect(() => {
    if (!companyCode || !userId) return;
    
    const employeeRef = ref(rtdb, `companies/${companyCode}/employees/${userId}`);
    const unsubscribe = onValue(employeeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || '');
        setPhoneNumber(data.phoneNumber || '');
        setCprNumber(data.cprNumber || '');
        setRegistrationNumber(data.registrationNumber || '');
        setAccountNumber(data.accountNumber || '');
        setAddress(data.address || '');
        setBirthDate(data.birthDate || '');
        setNationality(data.nationality || '');
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [companyCode, userId]);
  
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validering', 'Fornavn og efternavn skal udfyldes');
      return;
    }
    
    setSaving(true);
    try {
      const employeeRef = ref(rtdb, `companies/${companyCode}/employees/${userId}`);
      await update(employeeRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        birthDate: birthDate.trim(),
        nationality: nationality.trim(),
        updatedAt: Date.now(),
      });
      
      Alert.alert('Gemt', 'Profil opdateret');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Fejl', 'Kunne ikke gemme profil');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          
          {/* Personal Information */}
          <View style={globalStyles.eventSection}>
            <Text style={globalStyles.eventSectionTitle}>Personlig information</Text>
            
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Fornavn</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Indtast fornavn"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Efternavn</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Indtast efternavn"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Email</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={email}
                onChangeText={setEmail}
                placeholder="din@email.dk"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Telefon</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+45 12 34 56 78"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Fødselsdato (DD/MM/ÅÅÅÅ)</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="01/01/1990"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Nationalitet</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={nationality}
                onChangeText={setNationality}
                placeholder="F.eks. Dansk"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Adresse</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Vejnavn 123, 1234 By"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          
          {/* Bank Information (Read-only) */}
          <View style={globalStyles.eventSection}>
            <Text style={globalStyles.eventSectionTitle}>Bankoplysninger</Text>
            
            <View style={{
              padding: 12,
              backgroundColor: colors.gray50,
              borderRadius: 8,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>CPR-nummer</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {cprNumber || 'Ikke angivet'}
              </Text>
            </View>
            
            <View style={{
              padding: 12,
              backgroundColor: colors.gray50,
              borderRadius: 8,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Registreringsnummer</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {registrationNumber || 'Ikke angivet'}
              </Text>
            </View>
            
            <View style={{
              padding: 12,
              backgroundColor: colors.gray50,
              borderRadius: 8,
            }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Kontonummer</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {accountNumber || 'Ikke angivet'}
              </Text>
            </View>
            
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' }}>
              Kontakt din arbejdsgiver for at ændre bankoplysninger
            </Text>
          </View>
          
          {/* Save Button */}
          <TouchableOpacity
            style={[
              globalStyles.eventPrimaryButton,
              saving && globalStyles.eventButtonDisabled
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={globalStyles.eventPrimaryButtonText}>
              {saving ? 'Gemmer...' : 'Gem ændringer'}
            </Text>
          </TouchableOpacity>
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
