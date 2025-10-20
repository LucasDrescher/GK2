import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { rtdb } from "../database/firebase";
import { ref, get, update } from "firebase/database";
import { globalStyles } from "../styles";
import Signature from "react-native-signature-canvas";

export default function ContractScreen({ route }) {
  const { userId, companyCode } = route.params;
  const [employee, setEmployee] = useState(null);
  const [signature, setSignature] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!userId || !companyCode) return;

    const empRef = ref(rtdb, `companies/${companyCode}/employees/${userId}`);
    get(empRef).then((snapshot) => {
      if (snapshot.exists()) {
        const emp = snapshot.val();
        setEmployee(emp);
        if (emp.signature) {
          setSignature(emp.signature);
        }
      }
    });
  }, [userId, companyCode]);

  const handleOK = (sig) => {
    setSignature(sig);
    update(ref(rtdb, `companies/${companyCode}/employees/${userId}`), { signature: sig })
      .then(() => {
        Alert.alert("Succes", "Kontrakt underskrevet!");
        setModalVisible(false);
      })
      .catch((err) => Alert.alert("Fejl", err.message));
  };

  if (!employee) {
    return (
      <View style={globalStyles.container}>
        <Text>Henter kontrakt...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Ansættelseskontrakt</Text>

      <Text style={globalStyles.detailRow}>
        <Text style={globalStyles.detailLabel}>Virksomhed: </Text>
        <Text style={globalStyles.detailValue}>{employee.companyName || "Virksomhed " + companyCode}</Text>
      </Text>

      <Text style={globalStyles.detailRow}>
        <Text style={globalStyles.detailLabel}>Navn: </Text>
        <Text style={globalStyles.detailValue}>{employee.firstName} {employee.lastName}</Text>
      </Text>

      <Text style={globalStyles.detailRow}>
        <Text style={globalStyles.detailLabel}>Fødselsdag: </Text>
        <Text style={globalStyles.detailValue}>{employee.birthday}</Text>
      </Text>

      <Text style={globalStyles.detailRow}>
        <Text style={globalStyles.detailLabel}>Adresse: </Text>
        <Text style={globalStyles.detailValue}>{employee.address}, {employee.country}</Text>
      </Text>

      <Text style={globalStyles.detailRow}>
        <Text style={globalStyles.detailLabel}>Email: </Text>
        <Text style={globalStyles.detailValue}>{employee.email}</Text>
      </Text>

      <Text style={{ marginVertical: 20, lineHeight: 22 }}>
        Denne kontrakt bekræfter ansættelse hos {employee.companyName || "virksomheden"} med ovenstående oplysninger.
        Ved at underskrive accepterer medarbejderen gældende regler og vilkår.
      </Text>

      {/* Hvis der endnu ikke er underskrevet */}
      {!signature && (
        <Button title="Underskriv kontrakt" onPress={() => setModalVisible(true)} />
      )}

      {/* Signaturfelt */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Underskriv kontrakt
          </Text>
          <View style={{ flex: 1 }}>
            <Signature
              onOK={handleOK}
              descriptionText="Tegn din underskrift her"
              clearText="Ryd"
              confirmText="Godkend"
              webStyle={`
                .m-signature-pad--footer { display: flex; justify-content: space-between; }
              `}
            />
          </View>
          <Button title="Annuller" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>

      {/* Når der ER underskrevet */}
      {signature && (
        <>
          <Text style={{ marginTop: 20, fontWeight: "bold" }}>
            Din underskrift:
          </Text>
          <Image
            source={{ uri: signature }}
            style={{ width: 300, height: 100, resizeMode: "contain" }}
          />
        </>
      )}
    </ScrollView>
  );
}
