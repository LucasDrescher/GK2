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
import { rtdb } from "../database/firebase";
import { ref, onValue, update, remove } from "firebase/database";
import { globalStyles } from "../styles";

export default function EmployeeManagementScreen({ route }) {
  const { companyCode } = route.params;
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("alle");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [shifts, setShifts] = useState({});

  useEffect(() => {
    const employeesRef = ref(rtdb, `companies/${companyCode}/employees`);
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const allEmployees = Object.entries(data)
            .filter(([id, emp]) => emp && emp.role === "employee")
            .map(([id, emp]) => ({ id, ...emp }));
          setEmployees(allEmployees);
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error("Firebase listener error:", error);
        setEmployees([]);
      }
    }, (error) => {
      console.error("Firebase onValue error:", error);
    });

    // Hent vagter
    const shiftsRef = ref(rtdb, `companies/${companyCode}/shifts`);
    const unsubscribeShifts = onValue(shiftsRef, (snapshot) => {
      const data = snapshot.val();
      setShifts(data || {});
    });

    // Cleanup function
    return () => {
      unsubscribe();
      unsubscribeShifts();
    };
  }, [companyCode]);

  // Håndter når medarbejdere opdateres
  useEffect(() => {
    let filtered = employees;

    // Tjek om den valgte medarbejder stadig eksisterer
    if (selectedEmployee && !employees.some(emp => emp.id === selectedEmployee.id)) {
      setSelectedEmployee(null);
      setModalVisible(false);
    }

    // Vis alle medarbejdere (ingen filtrering)
    filtered = employees;

    // Søgning
    if (searchText.trim()) {
      filtered = filtered.filter(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
  }, [employees, searchText, selectedEmployee]);

  const getStatusInfo = (employee) => {
    if (employee.approved === true) {
      return { 
        text: "Godkendt", 
        color: "#4CAF50", 
        icon: "✓",
        hasContract: employee.signature ? true : false
      };
    }
    if (employee.approved === false) {
      return { 
        text: "Afventer godkendelse", 
        color: "#FF9800", 
        icon: "⏳"
      };
    }
    if (employee.approved === "rejected") {
      return { 
        text: "Afvist", 
        color: "#F44336", 
        icon: "✕"
      };
    }
    return { text: "Ukendt", color: "#9E9E9E", icon: "?" };
  };

  const getEmployeeShifts = (employeeId, employeeName) => {
    const today = new Date();
    const employeeShifts = Object.entries(shifts)
      .filter(([id, shift]) => {
        if (!shift.assignedTo || !Array.isArray(shift.assignedTo)) return false;
        
        // Tjek om medarbejderen er tildelt denne vagt
        const isAssigned = shift.assignedTo.some(emp => 
          emp.id === employeeId || emp.name === employeeName
        );
        
        if (!isAssigned) return false;
        
        // Kun fremtidige vagter (i dag og fremad)
        const shiftDate = new Date(shift.date + 'T00:00:00');
        return shiftDate >= today;
      })
      .map(([id, shift]) => ({ ...shift, id }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5); // Vis max 5 kommende vagter

    return employeeShifts;
  };

  const formatShiftDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('da-DK', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const handleApprove = (id) => {
    update(ref(rtdb, `companies/${companyCode}/employees/` + id), { approved: true })
      .then(() => {
        Alert.alert("Succes", "Medarbejder godkendt!");
        setModalVisible(false);
        setSelectedEmployee(null);
      })
      .catch((err) => Alert.alert("Fejl", err.message));
  };

  const handleReject = (id) => {
    Alert.alert(
      "Bekræft",
      "Er du sikker på at du vil afvise denne medarbejder?",
      [
        { text: "Annuller", style: "cancel" },
        { 
          text: "Afvis", 
          style: "destructive",
          onPress: () => {
            update(ref(rtdb, `companies/${companyCode}/employees/` + id), { approved: "rejected" })
              .then(() => {
                Alert.alert("Info", "Medarbejder afvist.");
                setModalVisible(false);
                setSelectedEmployee(null);
              })
              .catch((err) => Alert.alert("Fejl", err.message));
          }
        }
      ]
    );
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      "Slet medarbejder",
      `Er du sikker på at du vil slette ${name} permanent? Denne handling kan ikke fortrydes.`,
      [
        { text: "Annuller", style: "cancel" },
        { 
          text: "Slet", 
          style: "destructive",
          onPress: async () => {
            try {
              // Luk modal og nulstil state først
              setModalVisible(false);
              setSelectedEmployee(null);
              
              // Så slet fra database
              await remove(ref(rtdb, `companies/${companyCode}/employees/` + id));
              
              // Vis succes besked til sidst
              setTimeout(() => {
                Alert.alert("Succes", "Medarbejder slettet.");
              }, 100);
              
            } catch (err) {
              Alert.alert("Fejl", err.message);
            }
          }
        }
      ]
    );
  };

  const FilterButton = ({ title, filterKey, count }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filterKey && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filterKey)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filterKey && styles.filterButtonTextActive
      ]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  const EmployeeCard = ({ employee }) => {
    const statusInfo = getStatusInfo(employee);
    
    return (
      <TouchableOpacity
        style={globalStyles.employeeCard}
        onPress={() => {
          setSelectedEmployee(employee);
          setModalVisible(true);
        }}
      >
        <View style={globalStyles.employeeHeader}>
          <View style={globalStyles.employeeInfo}>
            <Text style={globalStyles.employeeName}>
              {employee.firstName} {employee.lastName}
            </Text>
            <Text style={globalStyles.employeeEmail}>{employee.email}</Text>
          </View>
          <View style={[globalStyles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={globalStyles.statusText}>{statusInfo.icon}</Text>
          </View>
        </View>
        
        <View style={globalStyles.employeeDetails}>
          <Text style={globalStyles.statusLabel}>{statusInfo.text}</Text>
          {statusInfo.hasContract && (
            <Text style={globalStyles.contractStatus}>📝 Kontrakt underskrevet</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const EmployeeModal = () => {
    if (!selectedEmployee || !modalVisible) return null;
    
    // Tjek om medarbejderen stadig eksisterer i employees array
    const employeeExists = employees.some(emp => emp.id === selectedEmployee.id);
    if (!employeeExists) {
      // Medarbejderen er blevet slettet, luk modal
      setModalVisible(false);
      setSelectedEmployee(null);
      return null;
    }
    
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

  const DetailRow = ({ label, value }) => (
    <View style={globalStyles.detailRow}>
      <Text style={globalStyles.detailLabel}>{label}:</Text>
      <Text style={globalStyles.detailValue}>{value}</Text>
    </View>
  );

  const getFilterCounts = () => {
    return {
      alle: employees.length
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