import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { rtdb } from "../../database/firebase";
import { ref, get, update } from "firebase/database";
import { globalStyles, colors } from "../../styles";
import { Button } from "../../components";
import SignatureScreen from 'react-native-signature-canvas';

export default function ContractScreen({ route, navigation }) {
  const { userId, companyCode } = route.params || {};
  const [employee, setEmployee] = useState(null);
  const [signature, setSignature] = useState(null);
  const [showSignature, setShowSignature] = useState(false);
  const signatureRef = useRef(null);

  useEffect(() => {
    if (!userId || !companyCode) return;

    const empRef = ref(rtdb, `companies/${companyCode}/employees/${userId}`);
    get(empRef).then((snapshot) => {
      if (snapshot.exists()) {
        const emp = snapshot.val();
        setEmployee(emp);
        if (emp.contract?.signature) {
          setSignature(emp.contract.signature);
        }
      }
    });
  }, [userId, companyCode]);

  const handleSignature = (sig) => {
    setSignature(sig);
    const updates = {
      'contract/signature': sig,
      'contract/signedAt': Date.now(),
    };

    update(ref(rtdb, `companies/${companyCode}/employees/${userId}`), updates)
      .then(() => {
        Alert.alert("Succes", "Kontrakt underskrevet!", [
          { text: "OK", onPress: () => {
            setShowSignature(false);
            // Navigate til employee home
            navigation.reset({
              index: 0,
              routes: [{ name: "EmployeeHome", params: { userId, companyCode } }],
            });
          }}
        ]);
      })
      .catch((err) => Alert.alert("Fejl", err.message));
  };

  const handleEnd = () => {
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
  };

  if (!employee) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.centerAligned}>
          <Text style={globalStyles.textMuted}>Henter kontrakt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const contract = employee.contract || {};
  const isContractSigned = contract.signedAt && signature;

  const style = `.m-signature-pad--footer {
    display: none; 
    margin: 0px;
  }
  .m-signature-pad {
    box-shadow: none;
    border: none;
  }
  .m-signature-pad--body {
    border: none;
  }
  canvas {
    touch-action: none;
  }`;

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 24, textAlign: 'center' }}>
          Ansættelseskontrakt
        </Text>

        {/* Virksomhedsinfo */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Virksomhed
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Navn: </Text>{employee.companyName || `Virksomhed ${companyCode}`}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text }}>
            <Text style={{ fontWeight: '600' }}>Virksomhedskode: </Text>{companyCode}
          </Text>
        </View>

        {/* Medarbejderinfo */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Medarbejder
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Navn: </Text>{employee.firstName} {employee.lastName}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>CPR-nr: </Text>{employee.cprNumber || 'Ikke angivet'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Fødselsdato: </Text>{employee.birthDate || employee.birthday || 'Ikke angivet'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Adresse: </Text>{employee.address}, {employee.nationality || employee.country || 'Ikke angivet'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Email: </Text>{employee.email}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Telefon: </Text>{employee.phoneNumber || 'Ikke angivet'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Reg.nr: </Text>{employee.registrationNumber || 'Ikke angivet'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text }}>
            <Text style={{ fontWeight: '600' }}>Kontonr: </Text>{employee.accountNumber || 'Ikke angivet'}
          </Text>
        </View>

        {/* Kontraktdetaljer */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Ansættelsesdetaljer
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Stilling: </Text>{contract.position || 'Ikke angivet'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Arbejdssted: </Text>{contract.workplace || 'Ikke angivet'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Timeløn: </Text>{contract.hourlyWage ? `${contract.hourlyWage} kr/time` : 'Ikke angivet'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            <Text style={{ fontWeight: '600' }}>Startdato: </Text>{contract.startDate || 'Ikke angivet'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text }}>
            <Text style={{ fontWeight: '600' }}>Opsigelsesvarsel: </Text>{contract.noticePeriod || 'Ikke angivet'}
          </Text>
        </View>

        {/* Kontrakttekst */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Ansættelsesvilkår
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22 }}>
            Denne kontrakt bekræfter ansættelse hos {employee.companyName || "virksomheden"} med ovenstående oplysninger.
            {'\n\n'}
            Ved at underskrive denne kontrakt accepterer medarbejderen følgende vilkår:
            {'\n\n'}
            • Ansættelsen starter fra den angivne startdato{'\n'}
            • Medarbejderen er forpligtet til at overholde virksomhedens regler og retningslinjer{'\n'}
            • Løn udbetales månedligt til den angivne konto{'\n'}
            • Opsigelse skal ske med det angivne varsel{'\n'}
            • Medarbejderen er forpligtet til at meddele sygdom eller fravær hurtigst muligt
          </Text>
        </View>

        {/* Underskrift sektion */}
        {!isContractSigned && !showSignature && (
          <Button
            title="Underskriv kontrakt"
            onPress={() => setShowSignature(true)}
            style={{ marginTop: 16 }}
          />
        )}

        {showSignature && !isContractSigned && (
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            marginTop: 16,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Din underskrift
            </Text>
            <View style={{ height: 250, borderWidth: 2, borderColor: colors.gray300, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>
              <SignatureScreen
                ref={signatureRef}
                onEnd={handleEnd}
                onOK={handleSignature}
                onClear={handleClear}
                descriptionText=""
                clearText="Ryd"
                confirmText="Gem"
                webStyle={style}
                autoClear={false}
                minWidth={0.5}
                maxWidth={2.5}
                penColor="#000"
                backgroundColor="#fff"
                dotSize={1}
                throttle={16}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Button
                title="Ryd"
                variant="secondary"
                onPress={handleClear}
                style={{ flex: 1 }}
              />
              <Button
                title="Gem underskrift"
                onPress={handleEnd}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        {/* Vis gemt underskrift */}
        {isContractSigned && signature && (
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            marginTop: 16,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Din underskrift
            </Text>
            <Image
              source={{ uri: signature }}
              style={{ width: '100%', height: 150, resizeMode: 'contain', backgroundColor: colors.gray100, borderRadius: 8 }}
            />
            <Text style={{ marginTop: 12, fontSize: 12, color: colors.success, textAlign: 'center' }}>
              ✓ Underskrevet {new Date(contract.signedAt).toLocaleDateString('da-DK')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
