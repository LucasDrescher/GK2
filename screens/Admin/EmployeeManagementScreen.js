// Importerer nødvendige React og React Native komponenter
import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Modal, 
  ScrollView,
  Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { rtdb } from "../../database/firebase"; // Firebase database forbindelse
import { ref, onValue, update, remove } from "firebase/database"; // Firebase database funktioner
import { globalStyles, colors } from "../../styles"; // Importerer styling fra separat fil
import { Input, Button } from "../../components"; // Importerer reusable komponenter

// Hovedkomponent for medarbejder management - modtager route som prop
export default function EmployeeManagementScreen({ route }) {
  // Henter virksomhedskode fra navigation parametre
  const { companyCode } = route.params;
  
  // State hooks til at håndtere komponentens tilstand
  const [employees, setEmployees] = useState([]); // Array af alle medarbejdere
  const [filteredEmployees, setFilteredEmployees] = useState([]); // Filtrerede medarbejdere baseret på søgning
  const [searchText, setSearchText] = useState(""); // Søgetekst input
  const [selectedFilter, setSelectedFilter] = useState("alle"); // Aktuel filter (pt. kun "alle")
  const [selectedEmployee, setSelectedEmployee] = useState(null); // Medarbejder valgt til detaljvisning
  const [modalVisible, setModalVisible] = useState(false); // Styrer om detaljmodal er åben
  const [shifts, setShifts] = useState({}); // Alle vagter fra databasen (til vagtvisning)
  const [contractFormVisible, setContractFormVisible] = useState(false); // Kontraktformular modal
  const [showStartDatePicker, setShowStartDatePicker] = useState(false); // Datepicker til startdato
  const [passportModalVisible, setPassportModalVisible] = useState(false); // Modal til fuld størrelse pas billede
  const [contractData, setContractData] = useState({
    hourlyWage: "",
    workplace: "",
    position: "",
    startDate: "",
    noticePeriod: "14 dage",
  });

  // useEffect hook kører når komponenten indlæses eller companyCode ændres
  useEffect(() => {
    // Opretter reference til medarbejdere i Firebase database
    const employeesRef = ref(rtdb, `companies/${companyCode}/employees`);
    
    // onValue opretter real-time listener med error handling
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      try {
        const data = snapshot.val(); // Henter data fra Firebase snapshot
        if (data) {
          // Konverterer Firebase objekt til array og filtrerer kun "employee" rolle
          const allEmployees = Object.entries(data)
            .filter(([id, emp]) => emp && emp.role === "employee") // Kun medarbejdere (ikke admins)
            .map(([id, emp]) => ({ id, ...emp })); // Tilføjer ID til hvert medarbejder objekt
          setEmployees(allEmployees);
        } else {
          setEmployees([]); // Sæt tom array hvis ingen data
        }
      } catch (error) {
        console.error("Firebase listener error:", error);
        setEmployees([]); // Fallback til tom array ved fejl
      }
    }, (error) => {
      console.error("Firebase onValue error:", error); // Error callback
    });

    // Henter vagter til vagtvisning i medarbejder detaljer
    const shiftsRef = ref(rtdb, `companies/${companyCode}/shifts`);
    const unsubscribeShifts = onValue(shiftsRef, (snapshot) => {
      const data = snapshot.val();
      setShifts(data || {}); // Opdater shifts state (tomt objekt hvis null)
    });

    // Cleanup funktion - fjerner listeners når komponenten unmountes
    return () => {
      unsubscribe();
      unsubscribeShifts();
    };
  }, [companyCode]); // Dependency array - kør igen hvis companyCode ændres

  // useEffect til at håndtere filtrering og søgning når data ændres
  useEffect(() => {
    let filtered = employees;

    // Sikkerhedscheck: Luk modal hvis valgt medarbejder ikke længere eksisterer
    // (f.eks. hvis medarbejderen blev slettet)
    if (selectedEmployee && !employees.some(emp => emp.id === selectedEmployee.id)) {
      setSelectedEmployee(null); // Nulstil valgt medarbejder
      setModalVisible(false);    // Luk modal
    }

    // Starter med alle medarbejdere (ingen filter-logik implementeret pt.)
    filtered = employees;

    // Søgefunktionalitet - filtrerer baseret på navn eller email
    if (searchText.trim()) {
      filtered = filtered.filter(emp => {
        // Sammensætter fornavn og efternavn til fuld navn
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const email = emp.email.toLowerCase();
        const search = searchText.toLowerCase();
        
        // Returnerer true hvis søgetekst findes i navn eller email
        return fullName.includes(search) || email.includes(search);
      });
    }

    // Opdaterer filtrerede medarbejdere state
    setFilteredEmployees(filtered);
  }, [employees, searchText, selectedEmployee]); // Kør når disse værdier ændres

  // Funktion der bestemmer status info baseret på medarbejderens godkendelsestilstand
  const getStatusInfo = (employee) => {
    // Godkendt medarbejder - grøn farve med checkmark
    if (employee.approved === true) {
      return { 
        text: "Godkendt", 
        color: "#4CAF50", // Grøn
        icon: "✓",
        hasContract: employee.signature ? true : false // Tjekker om der er underskrift
      };
    }
    // Afventer godkendelse - orange farve med ur-ikon
    if (employee.approved === false) {
      return { 
        text: "Afventer godkendelse", 
        color: "#FF9800", // Orange
        icon: "⏳"
      };
    }
    // Afvist medarbejder - rød farve med X
    if (employee.approved === "rejected") {
      return { 
        text: "Afvist", 
        color: "#F44336", // Rød
        icon: "✕"
      };
    }
    // Fallback for ukendte tilstande - grå farve
    return { text: "Ukendt", color: "#9E9E9E", icon: "?" };
  };

  // Funktion der finder en medarbejders kommende vagter
  const getEmployeeShifts = (employeeId, employeeName) => {
    const today = new Date(); // Dagens dato for sammenligning
    
    const employeeShifts = Object.entries(shifts) // Konverterer shifts objekt til array
      .filter(([id, shift]) => {
        // Tjekker om vagt har assignedTo og at det er et array
        if (!shift.assignedTo || !Array.isArray(shift.assignedTo)) return false;
        
        // Tjekker om medarbejderen er tildelt denne vagt
        // Bruger både ID og navn da data kan være struktureret forskelligt
        const isAssigned = shift.assignedTo.some(emp => 
          emp.id === employeeId || emp.name === employeeName
        );
        
        if (!isAssigned) return false; // Spring over hvis ikke tildelt
        
        // Filtrerer kun fremtidige vagter (i dag og fremad)
        const shiftDate = new Date(shift.date + 'T00:00:00'); // Tilføjer tid for korrekt parsing
        return shiftDate >= today; // Kun vagter fra i dag og frem
      })
      .map(([id, shift]) => ({ ...shift, id })) // Tilføjer ID til hvert shift objekt
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sorterer efter dato (tidligst først)
      .slice(0, 5); // Begrænser til maksimum 5 vagter for at holde UI rent

    return employeeShifts;
  };

  // Formaterer dato string til dansk visningsformat
  const formatShiftDate = (dateStr) => {
    // Tilføjer tid til dato string for korrekt Date parsing (undgår timezone problemer)
    const date = new Date(dateStr + 'T00:00:00');
    
    // Formaterer til dansk lokale med kort format (f.eks. "tirs 15 okt")
    return date.toLocaleDateString('da-DK', { 
      weekday: 'short', // Kort ugedag (tirs, ons, etc.)
      day: 'numeric',   // Dag som nummer
      month: 'short'    // Kort måned (jan, feb, etc.)
    });
  };

  // Funktion til at godkende en medarbejder
  const handleApprove = (employee) => {
    // Åbn kontraktformular modal i stedet for at godkende direkte
    setSelectedEmployee(employee);
    setContractData({
      hourlyWage: "",
      workplace: "",
      position: "",
      startDate: "",
      noticePeriod: "14 dage",
    });
    setModalVisible(false);
    setContractFormVisible(true);
  };

  // Funktion til at gemme kontrakt og godkende medarbejder
  const handleSaveContract = () => {
    if (!contractData.hourlyWage || !contractData.workplace || !contractData.position || !contractData.startDate) {
      Alert.alert("Fejl", "Udfyld alle kontraktfelter!");
      return;
    }

    const contractObj = {
      ...contractData,
      createdAt: Date.now(),
      signedAt: null,
      signature: null,
    };

    update(ref(rtdb, `companies/${companyCode}/employees/${selectedEmployee.id}`), { 
      approved: true,
      contract: contractObj 
    })
      .then(() => {
        setContractFormVisible(false);
        setContractData({
          hourlyWage: "",
          workplace: "",
          position: "",
          startDate: "",
          noticePeriod: "14 dage",
        });
        Alert.alert("Succes", "Medarbejder godkendt og kontrakt oprettet!");
      })
      .catch((err) => Alert.alert("Fejl", err.message));
  };

  // Funktion til at afvise en medarbejder med bekræftelse
  const handleReject = (id) => {
    // Viser bekræftelsesdialog før afvisning
    Alert.alert(
      "Bekræft",
      "Er du sikker på at du vil afvise denne medarbejder?",
      [
        { text: "Annuller", style: "cancel" }, // Afbryder handling
        { 
          text: "Afvis", 
          style: "destructive", // Rød farve for farlig handling
          onPress: () => {
            // Lukker modal først for at undgå state konflikter
            setModalVisible(false);
            setSelectedEmployee(null);
            
            // Sætter approved status til "rejected" i Firebase
            update(ref(rtdb, `companies/${companyCode}/employees/` + id), { approved: "rejected" })
              .then(() => {
                // Success callback - viser bekræftelse efter kort delay
                setTimeout(() => {
                  Alert.alert("Info", "Medarbejder afvist.");
                }, 100);
              })
              .catch((err) => Alert.alert("Fejl", err.message)); // Error handling
          }
        }
      ]
    );
  };

  // Funktion til at slette en medarbejder permanent fra systemet
  const handleDelete = (id, name) => {
    // Viser alvorlig bekræftelsesdialog med medarbejderens navn
    Alert.alert(
      "Slet medarbejder",
      `Er du sikker på at du vil slette ${name} permanent? Denne handling kan ikke fortrydes.`,
      [
        { text: "Annuller", style: "cancel" }, // Afbryder sletning
        { 
          text: "Slet", 
          style: "destructive", // Rød farve for permanent handling
          onPress: async () => {
            try {
              // VIGTIGT: Lukker modal først for at undgå state konflikter
              setModalVisible(false);    // Lukker modal
              setSelectedEmployee(null); // Nulstiller valgt medarbejder
              
              // Sletter medarbejder fra Firebase database
              await remove(ref(rtdb, `companies/${companyCode}/employees/` + id));
              
              // Viser success besked efter kort delay for at undgå UI konflikter
              setTimeout(() => {
                Alert.alert("Succes", "Medarbejder slettet.");
              }, 100);
              
            } catch (err) {
              // Error handling hvis Firebase operation fejler
              Alert.alert("Fejl", err.message);
            }
          }
        }
      ]
    );
  };

  // KOMPONENT: Filter knap til at skifte mellem forskellige medarbejder visninger
  // Note: Pt. ikke i brug da kun "Alle" filter er implementeret
  const FilterButton = ({ title, filterKey, count }) => (
    <TouchableOpacity
      style={[
        globalStyles.filterButton, // Base styling
        selectedFilter === filterKey && globalStyles.filterButtonActive // Aktiv styling hvis valgt
      ]}
      onPress={() => setSelectedFilter(filterKey)} // Skifter filter når trykket
    >
      <Text style={[
        globalStyles.filterButtonText,
        selectedFilter === filterKey && globalStyles.filterButtonTextActive // Aktiv tekst styling
      ]}>
        {title} ({count}) {/* Viser filter navn og antal */}
      </Text>
    </TouchableOpacity>
  );

  // KOMPONENT: Kort der viser medarbejder i listen (bruges i FlatList)
  const EmployeeCard = ({ employee }) => {
    const statusInfo = getStatusInfo(employee); // Henter status info (godkendt/afventer/afvist)
    
    return (
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
          borderLeftWidth: 4,
          borderLeftColor: statusInfo.color,
        }}
        onPress={() => {
          setSelectedEmployee(employee);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Avatar cirkel med initialer */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: statusInfo.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '700', 
                color: statusInfo.color,
              }}>
                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
              </Text>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 }}>
                {employee.firstName} {employee.lastName}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {employee.email}
              </Text>
            </View>
          </View>
          
          {/* Status badge */}
          <View style={{
            backgroundColor: statusInfo.color + '20',
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18, marginRight: 4 }}>{statusInfo.icon}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: statusInfo.color }}>
              {statusInfo.text.split(' ')[0]}
            </Text>
          </View>
        </View>
        
        {/* Kontrakt indikator */}
        {statusInfo.hasContract && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.gray200,
          }}>
            <Ionicons name="document-text" size={16} color={colors.success} />
            <Text style={{ fontSize: 13, color: colors.success, marginLeft: 6, fontWeight: '500' }}>
              Kontrakt underskrevet
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // KOMPONENT: Modal der viser detaljeret medarbejder information
  const EmployeeModal = () => {
    // Guard clause: Returner intet hvis ingen medarbejder er valgt eller modal er lukket
    if (!selectedEmployee || !modalVisible) return null;
    
    // SIKKERHEDSCHECK: Tjek om medarbejderen stadig eksisterer (kan være slettet af anden bruger)
    const employeeExists = employees.some(emp => emp.id === selectedEmployee.id);
    if (!employeeExists) {
      // Automatisk cleanup hvis medarbejder ikke længere eksisterer
      setModalVisible(false);
      setSelectedEmployee(null);
      return null; // Render intet
    }
    
    // Henter status information for styling og tekst
    const statusInfo = getStatusInfo(selectedEmployee);
    const upcomingShifts = getEmployeeShifts(selectedEmployee.id, `${selectedEmployee.firstName} ${selectedEmployee.lastName}`);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedEmployee(null);
        }}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Gradient Header med Avatar */}
              <LinearGradient
                colors={[statusInfo.color, statusInfo.color + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  marginHorizontal: -24,
                  marginTop: -24,
                  paddingHorizontal: 24,
                  paddingTop: 24,
                  paddingBottom: 32,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}
              >
                {/* Luk knap */}
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedEmployee(null);
                  }}
                  style={{
                    alignSelf: 'flex-end',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.white} />
                </TouchableOpacity>
                
                {/* Avatar og navn */}
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.white,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 5,
                  }}>
                    <Text style={{ fontSize: 32, fontWeight: '700', color: statusInfo.color }}>
                      {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: colors.white, marginBottom: 4 }}>
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </Text>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.white }}>
                      {statusInfo.icon} {statusInfo.text}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Quick Stats */}
              <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
                <View style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  shadowColor: colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 8 }}>
                    {upcomingShifts.length}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Vagter</Text>
                </View>
                {statusInfo.hasContract && (
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2,
                  }}>
                    <Ionicons name="document-text" size={24} color={colors.success} />
                    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 8 }}>✓</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Kontrakt</Text>
                  </View>
                )}
              </View>

              {/* Kontakt Information */}
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Kontakt Information</Text>
                <View style={{ 
                  backgroundColor: colors.surface, 
                  borderRadius: 16, 
                  padding: 16,
                  shadowColor: colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Ionicons name="mail" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Email</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedEmployee.email}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Ionicons name="call" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Telefon</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedEmployee.phoneNumber || 'Ikke angivet'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Personlige Oplysninger */}
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Personlige Oplysninger</Text>
                <View style={{ 
                  backgroundColor: colors.surface, 
                  borderRadius: 16, 
                  padding: 16,
                  shadowColor: colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Ionicons name="calendar" size={18} color={colors.secondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Fødselsdato</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedEmployee.birthDate || selectedEmployee.birthday || 'Ikke angivet'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Ionicons name="location" size={18} color={colors.secondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Adresse</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedEmployee.address}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Ionicons name="globe" size={18} color={colors.secondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Nationalitet</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedEmployee.nationality || selectedEmployee.country || 'Ikke angivet'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Virksomheds Information */}
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Virksomhed</Text>
                <View style={{ 
                  backgroundColor: colors.surface, 
                  borderRadius: 16, 
                  padding: 16,
                  shadowColor: colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Ionicons name="business" size={18} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Virksomhedsnavn</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedEmployee.companyName}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Ionicons name="key" size={18} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Virksomhedskode</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedEmployee.companyCode}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Pas sektion */}
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Pas</Text>
                {selectedEmployee.passportUri ? (
                  <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => setPassportModalVisible(true)}
                    style={{ 
                      backgroundColor: colors.surface, 
                      borderRadius: 16, 
                      padding: 16,
                      shadowColor: colors.black,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <Image
                      source={{ uri: selectedEmployee.passportUri }}
                      style={{ 
                        width: '100%', 
                        height: 250, 
                        borderRadius: 12,
                        backgroundColor: colors.gray100,
                      }}
                      resizeMode="contain"
                      onError={(error) => console.log('Image load error:', error.nativeEvent)}
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                      <Ionicons name="expand-outline" size={16} color={colors.primary} />
                      <Text style={{ marginLeft: 6, color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                        Tryk for fuld størrelse
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={{ 
                    backgroundColor: colors.surface, 
                    borderRadius: 16, 
                    padding: 40,
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2,
                    alignItems: 'center',
                  }}>
                    <View style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: colors.gray100,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                      <Ionicons name="document-outline" size={40} color={colors.textMuted} />
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                      Intet pas uploadet
                    </Text>
                  </View>
                )}
              </View>

              {selectedEmployee.signature && (
                <View style={globalStyles.signatureContainer}>
                  <Text style={globalStyles.signatureTitle}>Underskrift:</Text>
                  <Image
                    source={{ uri: selectedEmployee.signature }}
                    style={globalStyles.signatureImage}
                  />
                </View>
              )}

              {/* Action buttons */}
              <View style={{ marginTop: 24, gap: 12 }}>
                {selectedEmployee.approved === false && (
                  <>
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.success,
                        borderRadius: 12,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: colors.success,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                      onPress={() => handleApprove(selectedEmployee)}
                    >
                      <Ionicons name="checkmark-circle" size={22} color={colors.white} />
                      <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>
                        Godkend
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.error,
                        borderRadius: 12,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: colors.error,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                      onPress={() => handleReject(selectedEmployee.id)}
                    >
                      <Ionicons name="close-circle" size={22} color={colors.white} />
                      <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>
                        Afvis
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.error,
                  }}
                  onPress={() => handleDelete(selectedEmployee.id, `${selectedEmployee.firstName} ${selectedEmployee.lastName}`)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={{ color: colors.error, fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                    Fjern medarbejder
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // KOMPONENT: Generisk række til at vise label og værdi i detaljer
  const DetailRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <View style={globalStyles.detailRow}>
        <Text style={globalStyles.detailLabel}>{label}:</Text>
        <Text style={globalStyles.detailValue}>{value}</Text>
      </View>
    );
  };

  // HJÆLPE FUNKTION: Beregner antal medarbejdere for hver filter kategori
  const getFilterCounts = () => {
    return {
      alle: employees.length // Pt. kun "alle" kategori implementeret
    };
  };

  const counts = getFilterCounts();

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header med gradient */}
        <View style={{ 
          paddingHorizontal: 20, 
          paddingTop: 16,
          paddingBottom: 24,
          backgroundColor: colors.surface,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text, marginBottom: 16 }}>
            Medarbejdere
          </Text>
          
          {/* Søgefelt med ikon */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.background,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: colors.gray200,
          }}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 16,
                color: colors.text,
              }}
              placeholder="Søg efter navn eller email..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={colors.textMuted}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter chips */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 16 }}
            contentContainerStyle={{ gap: 8 }}
          >
            <View style={{
              backgroundColor: colors.primary,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Text style={{ color: colors.white, fontSize: 14, fontWeight: '600', marginRight: 6 }}>
                Alle
              </Text>
              <View style={{
                backgroundColor: colors.white + '40',
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
                minWidth: 20,
                alignItems: 'center',
              }}>
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>
                  {counts.alle}
                </Text>
              </View>
            </View>
            
            <View style={{
              backgroundColor: colors.success + '20',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.success,
                marginRight: 6,
              }} />
              <Text style={{ color: colors.success, fontSize: 14, fontWeight: '600' }}>
                Godkendt ({counts.godkendt})
              </Text>
            </View>
            
            <View style={{
              backgroundColor: colors.warning + '20',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.warning,
                marginRight: 6,
              }} />
              <Text style={{ color: colors.warning, fontSize: 14, fontWeight: '600' }}>
                Afventer ({counts.afventer})
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Medarbejderliste */}
        {filteredEmployees.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="people-outline" size={40} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
              {searchText ? "Ingen resultater" : "Ingen medarbejdere"}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
              {searchText ? "Prøv en anden søgning" : "Godkend medarbejdere for at se dem her"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredEmployees}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <EmployeeCard employee={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          />
        )}

        <EmployeeModal />
      
      {/* Kontraktformular Modal */}
      {contractFormVisible && selectedEmployee && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={contractFormVisible}
          onRequestClose={() => setContractFormVisible(false)}
        >
          <View style={globalStyles.modalOverlay}>
            <View style={globalStyles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={() => setContractFormVisible(false)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.gray200,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
                  Opret Kontrakt
                </Text>
                <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 24 }}>
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </Text>

                <Input
                  label="Timeløn (kr/time)"
                  placeholder="150"
                  value={contractData.hourlyWage}
                  onChangeText={(text) => setContractData({ ...contractData, hourlyWage: text })}
                  keyboardType="numeric"
                />

                <Input
                  label="Arbejdssted"
                  placeholder="København"
                  value={contractData.workplace}
                  onChangeText={(text) => setContractData({ ...contractData, workplace: text })}
                />

                <Input
                  label="Stilling"
                  placeholder="Chauffør"
                  value={contractData.position}
                  onChangeText={(text) => setContractData({ ...contractData, position: text })}
                />

                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                  Startdato
                </Text>
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  style={globalStyles.input}
                >
                  <Text style={{ color: contractData.startDate ? colors.text : colors.textSecondary }}>
                    {contractData.startDate || 'Vælg startdato'}
                  </Text>
                </TouchableOpacity>
                
                {showStartDatePicker && (
                  <DateTimePicker
                    value={contractData.startDate ? new Date(contractData.startDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        const formattedDate = selectedDate.toISOString().split('T')[0];
                        setContractData({ ...contractData, startDate: formattedDate });
                      }
                    }}
                  />
                )}

                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 16, marginBottom: 8 }}>
                  Opsigelsesvarsel
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                  {['14 dage', '1 måned', '3 måneder'].map((period) => (
                    <TouchableOpacity
                      key={period}
                      onPress={() => setContractData({ ...contractData, noticePeriod: period })}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: contractData.noticePeriod === period ? colors.primary : colors.gray300,
                        backgroundColor: contractData.noticePeriod === period ? colors.primaryLight : colors.surface,
                      }}
                    >
                      <Text style={{ 
                        textAlign: 'center', 
                        fontWeight: '600',
                        color: contractData.noticePeriod === period ? colors.primary : colors.text 
                      }}>
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button
                  title="Godkend og Opret Kontrakt"
                  onPress={handleSaveContract}
                  style={{ marginBottom: 20 }}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Fuld størrelse pas modal */}
      {selectedEmployee && passportModalVisible && selectedEmployee.passportUri && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={passportModalVisible}
          onRequestClose={() => setPassportModalVisible(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 50,
                right: 20,
                zIndex: 10,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 20,
                padding: 10,
              }}
              onPress={() => setPassportModalVisible(false)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedEmployee.passportUri }}
              style={{
                width: '90%',
                height: '80%',
              }}
              resizeMode="contain"
            />
            <Text style={{
              color: '#fff',
              marginTop: 20,
              fontSize: 16,
            }}>
              {selectedEmployee.firstName} {selectedEmployee.lastName} - Pas
            </Text>
          </View>
        </Modal>
      )}
      
      </View>
    </SafeAreaView>
  );
}