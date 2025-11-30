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
import { Ionicons } from '@expo/vector-icons';

export default function AdminProfileScreen({ route, navigation }) {
  const { companyCode, userId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Admin info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [nationality, setNationality] = useState('');
  const [address, setAddress] = useState('');
  
  // Company info
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  
  useEffect(() => {
    if (!companyCode) return;
    
    const adminRef = ref(rtdb, `companies/${companyCode}/admin`);
    const unsubscribe = onValue(adminRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || '');
        setBirthDate(data.birthDate || '');
        setNationality(data.nationality || '');
        setAddress(data.address || '');
        setCompanyName(data.companyName || '');
        setCompanyAddress(data.companyAddress || '');
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [companyCode]);
  
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validering', 'Fornavn og efternavn skal udfyldes');
      return;
    }
    
    setSaving(true);
    try {
      const adminRef = ref(rtdb, `companies/${companyCode}/admin`);
      await update(adminRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        birthDate: birthDate.trim(),
        nationality: nationality.trim(),
        address: address.trim(),
        companyName: companyName.trim(),
        companyAddress: companyAddress.trim(),
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
                placeholder="admin@firma.dk"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
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
          
          {/* Company Information */}
          <View style={globalStyles.eventSection}>
            <Text style={globalStyles.eventSectionTitle}>Virksomhedsoplysninger</Text>
            
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Virksomhedsnavn</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="F.eks. Min Virksomhed ApS"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={globalStyles.eventInputContainer}>
              <Text style={globalStyles.eventLabel}>Virksomhedsadresse</Text>
              <TextInput
                style={globalStyles.eventInput}
                value={companyAddress}
                onChangeText={setCompanyAddress}
                placeholder="Firmagade 1, 1000 København"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={{
              padding: 12,
              backgroundColor: colors.gray50,
              borderRadius: 8,
              marginTop: 8,
            }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                Virksomhedskode: <Text style={{ fontWeight: '700', color: colors.text }}>{companyCode}</Text>
              </Text>
            </View>
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
