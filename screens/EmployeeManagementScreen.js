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
import { rtdb } from "../database/firebase"; // Firebase database forbindelse
import { ref, onValue, update, remove } from "firebase/database"; // Firebase database funktioner
import { globalStyles } from "../styles"; // Importerer styling fra separat fil

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
  const handleApprove = (id) => {
    // Lukker modal først for at undgå state konflikter
    setModalVisible(false);
    setSelectedEmployee(null);
    
    // Opdaterer medarbejderens approved status i Firebase
    update(ref(rtdb, `companies/${companyCode}/employees/` + id), { approved: true })
      .then(() => {
        // Success callback - viser bekræftelse efter kort delay
        setTimeout(() => {
          Alert.alert("Succes", "Medarbejder godkendt!");
        }, 100);
      })
      .catch((err) => Alert.alert("Fejl", err.message)); // Error handling
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
        style={globalStyles.employeeCard}
        onPress={() => {
          // Åbner detaljvisning når kortet trykkes
          setSelectedEmployee(employee); // Sætter valgt medarbejder
          setModalVisible(true);         // Åbner modal
        }}
      >
        {/* Header med navn, email og status badge */}
        <View style={globalStyles.employeeHeader}>
          <View style={globalStyles.employeeInfo}>
            <Text style={globalStyles.employeeName}>
              {employee.firstName} {employee.lastName} {/* Fuldt navn */}
            </Text>
            <Text style={globalStyles.employeeEmail}>{employee.email}</Text>
          </View>
          {/* Status badge med farve baseret på godkendelse */}
          <View style={[globalStyles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={globalStyles.statusText}>{statusInfo.icon}</Text>
          </View>
        </View>
        
        {/* Detaljer med status tekst og kontrakt info */}
        <View style={globalStyles.employeeDetails}>
          <Text style={globalStyles.statusLabel}>{statusInfo.text}</Text>
          {/* Viser kun kontrakt status hvis medarbejder har underskrevet */}
          {statusInfo.hasContract && (
            <Text style={globalStyles.contractStatus}>📝 Kontrakt underskrevet</Text>
          )}
        </View>
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
              <View style={globalStyles.modalHeader}>
                <Text style={globalStyles.modalTitleEmployee}>
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </Text>
                <TouchableOpacity
                  style={globalStyles.closeButton}
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedEmployee(null);
                  }}
                >
                  <Text style={globalStyles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={[globalStyles.statusBadgeLarge, { backgroundColor: statusInfo.color }]}>
                <Text style={globalStyles.statusTextLarge}>{statusInfo.icon} {statusInfo.text}</Text>
              </View>

              <View style={globalStyles.detailsContainer}>
                <DetailRow label="Email" value={selectedEmployee.email} />
                <DetailRow label="Fødselsdag" value={selectedEmployee.birthday} />
                <DetailRow label="Adresse" value={selectedEmployee.address} />
                <DetailRow label="Land" value={selectedEmployee.country} />
                <DetailRow label="Virksomhed" value={selectedEmployee.companyName} />
                <DetailRow label="Virksomhedskode" value={selectedEmployee.companyCode} />
              </View>

              {/* Kommende vagter sektion */}
              {(() => {
                const employeeShifts = getEmployeeShifts(selectedEmployee.id, `${selectedEmployee.firstName} ${selectedEmployee.lastName}`);
                
                if (employeeShifts.length > 0) {
                  return (
                    <View style={globalStyles.shiftsContainer}>
                      <Text style={globalStyles.shiftsTitle}>📅 Kommende vagter ({employeeShifts.length})</Text>
                      {employeeShifts.map((shift, index) => (
                        <View key={shift.id || index} style={globalStyles.shiftItem}>
                          <View style={globalStyles.shiftDateArea}>
                            <Text style={globalStyles.shiftDate}>{formatShiftDate(shift.date)}</Text>
                            <Text style={globalStyles.shiftArea}>{shift.area}</Text>
                          </View>
                          <Text style={globalStyles.shiftTime}>
                            {shift.startTime} - {shift.endTime}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                } else {
                  return (
                    <View style={globalStyles.shiftsContainer}>
                      <Text style={globalStyles.shiftsTitle}>📅 Kommende vagter</Text>
                      <Text style={globalStyles.noShiftsText}>Ingen kommende vagter</Text>
                    </View>
                  );
                }
              })()}

              {selectedEmployee.passportUri && (
                <View style={globalStyles.signatureContainer}>
                  <Text style={globalStyles.signatureTitle}>Pas:</Text>
                  <TouchableOpacity onPress={() => {
                    // Kunne evt. åbne billedet i fuld størrelse
                    Alert.alert('Pas billede', 'Tryk på billedet for at se det i fuld størrelse', [
                      { text: 'OK' }
                    ]);
                  }}>
                    <Image
                      source={{ uri: selectedEmployee.passportUri }}
                      style={globalStyles.signatureImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {selectedEmployee.signature && (
                <View style={globalStyles.signatureContainer}>
                  <Text style={globalStyles.signatureTitle}>Underskrift:</Text>
                  <Image
                    source={{ uri: selectedEmployee.signature }}
                    style={globalStyles.signatureImage}
                  />
                </View>
              )}

              <View style={globalStyles.actionButtons}>
                {selectedEmployee.approved === false && (
                  <>
                    <TouchableOpacity
                      style={[globalStyles.actionButton, globalStyles.approveButton]}
                      onPress={() => handleApprove(selectedEmployee.id)}
                    >
                      <Text style={globalStyles.actionButtonText}>✓ Godkend</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[globalStyles.actionButton, globalStyles.rejectButton]}
                      onPress={() => handleReject(selectedEmployee.id)}
                    >
                      <Text style={globalStyles.actionButtonText}>✕ Afvis</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  style={[globalStyles.actionButton, globalStyles.deleteButton]}
                  onPress={() => handleDelete(selectedEmployee.id, `${selectedEmployee.firstName} ${selectedEmployee.lastName}`)}
                >
                  <Text style={globalStyles.actionButtonText}>Fjern</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // KOMPONENT: Generisk række til at vise label og værdi i detaljer
  const DetailRow = ({ label, value }) => (
    <View style={globalStyles.detailRow}>
      <Text style={globalStyles.detailLabel}>{label}:</Text> {/* Label med kolon */}
      <Text style={globalStyles.detailValue}>{value}</Text>   {/* Værdi */}
    </View>
  );

  // HJÆLPE FUNKTION: Beregner antal medarbejdere for hver filter kategori
  const getFilterCounts = () => {
    return {
      alle: employees.length // Pt. kun "alle" kategori implementeret
    };
  };

  const counts = getFilterCounts();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Overblik over medarbejdere</Text>
      
      {/* Søgefelt */}
      <View style={globalStyles.searchContainer}>
        <TextInput
          style={globalStyles.searchInput}
          placeholder="Søg efter navn eller email..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter knapper */}
      <View style={globalStyles.filterContainer}>
        <View style={[
          globalStyles.filterButton,
          globalStyles.filterButtonActive
        ]}>
          <Text style={[
            globalStyles.filterButtonText,
            globalStyles.filterButtonTextActive
          ]}>
            Alle ({counts.alle})
          </Text>
        </View>
      </View>

      {/* Medarbejderliste */}
      {filteredEmployees.length === 0 ? (
        <View style={globalStyles.emptyContainer}>
          <Text style={globalStyles.emptyText}>
            {searchText ? "Ingen medarbejdere matcher din søgning" : "Ingen medarbejdere fundet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <EmployeeCard employee={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={globalStyles.listContainer}
        />
      )}

      <EmployeeModal />
    </View>
  );
}