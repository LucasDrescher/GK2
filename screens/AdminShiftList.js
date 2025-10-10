// Importerer nødvendige React og React Native komponenter
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker'; // Eksternt bibliotek til dato/tid vælger
import { SafeAreaView } from "react-native-safe-area-context";
import { rtdb } from "../database/firebase"; // Firebase database forbindelse
import { ref, onValue, push, update, remove } from "firebase/database"; // Firebase database funktioner
import { globalStyles } from "../styles"; // Importerer styling fra separat fil



// Hovedkomponent for admin vagtplan - modtager route og navigation som props
export default function AdminShiftList({ route, navigation }) {
  // Henter virksomhedskode fra navigation parametre
  const { companyCode } = route.params || {};
  
  // State hooks til at håndtere komponentens tilstand
  const [shifts, setShifts] = useState(null); // Alle vagter fra databasen
  const [employees, setEmployees] = useState({}); // Godkendte medarbejdere
  const [modalVisible, setModalVisible] = useState(false); // Styrer om modal er åben
  const [editingId, setEditingId] = useState(null); // ID på vagt der redigeres (null = ny vagt)
  
  // FormData indeholder alle felter til oprettelse/redigering af vagter
  const [formData, setFormData] = useState({
    area: "",
    contactPerson: "",
    startTime: "",
    endTime: "",
    assignedTo: [],
    date: new Date(),
    selectedDates: [], // Array til at holde flere valgte datoer
    isMultipleDays: false, // Boolean til at skifte mellem enkelt/flere dage
  });
  
  // State til søgefunktionalitet og UI kontrol
  const [searchText, setSearchText] = useState(""); // Søgetekst for medarbejdere i modal
  const [shiftSearchText, setShiftSearchText] = useState(""); // Søgetekst for vagter i hovedvisning
  
  // State til at kontrollere visning af dato/tid vælgere
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // State til uge-navigation og visning
  const [currentWeek, setCurrentWeek] = useState(new Date()); // Hvilken uge der vises
  const [viewMode, setViewMode] = useState("list"); // "list" (i dag) eller "week" (uge-visning)

  // useEffect hook kører når komponenten indlæses eller companyCode ændres
  useEffect(() => {
    // Guard clause - stop hvis der ikke er en virksomhedskode
    if (!companyCode) return;
    
    // Opretter reference til vagter i Firebase database
    const shiftRef = ref(rtdb, `companies/${companyCode}/shifts`);
    // onValue opretter en real-time listener - opdaterer automatisk når data ændres
    const unsubscribe = onValue(shiftRef, (snap) => {
      const data = snap.val(); // Henter data fra snapshot
      setShifts(data || {}); // Opdaterer state med data (eller tomt objekt hvis null)
    });

    // Opretter reference til medarbejdere i Firebase
    const empRef = ref(rtdb, `companies/${companyCode}/employees`);
    const unsubEmp = onValue(empRef, (snap) => {
      const data = snap.val();
      
      // Filtrerer kun godkendte medarbejdere med rolle "employee"
      const approvedEmployees = {};
      if (data) {
        // Object.entries konverterer objekt til array af [key, value] par
        Object.entries(data).forEach(([id, emp]) => {
          // Kun medarbejdere der er godkendt og har rolle "employee"
          if (emp.approved === true && emp.role === "employee") {
            approvedEmployees[id] = emp;
          }
        });
      }
      setEmployees(approvedEmployees);
    });

    // Cleanup funktion - fjerner listeners når komponenten unmountes
    return () => {
      unsubscribe();
      unsubEmp();
    };
  }, [companyCode]); // Dependency array - kør igen hvis companyCode ændres

  // Hjælpefunktioner til dato og tid formatering
  const formatDate = (date) => {
    // Konverterer Date objekt til ISO string og tager kun dato-delen (YYYY-MM-DD format)
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date) => {
    // Formaterer dato til dansk format for visning (f.eks. "tirs 15 okt")
    return date.toLocaleDateString('da-DK', { 
      weekday: 'short', // Kort ugedag
      day: 'numeric',   // Dag som nummer
      month: 'short'    // Kort måned
    });
  };

  const formatTime = (date) => {
    // Konverterer Date objekt til tid string og tager kun timer:minutter (HH:MM)
    return date.toTimeString().slice(0, 5);
  };

  // Beregner alle 7 dage i en uge baseret på en given dato
  const getWeekDays = (date) => {
    const week = []; // Array til at holde alle ugens dage
    const startOfWeek = new Date(date); // Kopi af input dato
    const day = startOfWeek.getDay(); // Får ugedag (0=søndag, 1=mandag osv.)
    
    // Beregner hvor mange dage tilbage til mandag (ugens start)
    // Hvis det er søndag (0), går 6 dage tilbage, ellers (day-1) dage tilbage  
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff); // Sætter dato til mandagen i ugen

    // Genererer alle 7 dage i ugen
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek); // Ny dato baseret på ugens start
      day.setDate(startOfWeek.getDate() + i); // Tilføjer i dage
      week.push(day); // Tilføjer dagen til array
    }
    return week; // Returnerer array med alle 7 dage
  };

  // Finder alle vagter for en bestemt dato
  const getShiftsForDate = (date) => {
    const dateStr = formatDate(date); // Konverterer dato til string format
    // Filtrerer shifts objekt og returnerer kun vagter der matcher datoen
    return Object.entries(shifts).filter(([id, shift]) => {
      return shift.date === dateStr; // Sammenligner vagt-dato med ønsket dato
    });
  };

  // Håndterer når brugeren vælger en dato i DateTimePicker
  const onDateChange = (event, selectedDate) => {
    // På Android lukkes picker automatisk når dato vælges
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    // Validerer at vi har en gyldig dato
    if (selectedDate && selectedDate instanceof Date && !isNaN(selectedDate.getTime())) {
      if (formData.isMultipleDays) {
        // Hvis multi-dag mode: tilføj/fjern dato fra liste
        addDateToSelection(selectedDate);
      } else {
        // Hvis enkelt-dag mode: sæt som den valgte dato
        setFormData({ ...formData, date: selectedDate });
      }
    }
  };

  // Tilføjer eller fjerner en dato fra listen af valgte datoer (toggle funktionalitet)
  const addDateToSelection = (date) => {
    const dateStr = formatDate(date); // Konverterer til string format
    const currentDates = formData.selectedDates || []; // Henter nuværende valgte datoer
    
    // Toggle logik: hvis dato allerede er valgt, fjern den - ellers tilføj den
    if (currentDates.includes(dateStr)) {
      // Fjern datoen fra listen ved at filtrere den ud
      const updatedDates = currentDates.filter(d => d !== dateStr);
      setFormData({ ...formData, selectedDates: updatedDates });
    } else {
      // Tilføj datoen til listen ved at oprette nyt array med eksisterende + ny dato
      setFormData({ ...formData, selectedDates: [...currentDates, dateStr] });
    }
  };

  // Fjerner en specifik dato fra listen af valgte datoer (bruges af X knap på dato chips)
  const removeDateFromSelection = (dateStr) => {
    const updatedDates = formData.selectedDates.filter(d => d !== dateStr);
    setFormData({ ...formData, selectedDates: updatedDates });
  };

  // Skifter mellem enkelt-dag og multi-dag mode og nulstiller valgte datoer
  const toggleMultipleDays = () => {
    setFormData({ 
      ...formData, 
      isMultipleDays: !formData.isMultipleDays, // Flipper boolean værdi
      selectedDates: [] // Rydder valgte datoer når mode skiftes
    });
  };

  // Håndterer start tidspunkt valg fra TimePicker
  const onStartTimeChange = (event, selectedTime) => {
    // Lukker picker på Android efter valg
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    // Opdaterer formData med formateret tid (HH:MM format)
    if (selectedTime) {
      setFormData({ ...formData, startTime: formatTime(selectedTime) });
    }
  };

  // Håndterer slut tidspunkt valg fra TimePicker
  const onEndTimeChange = (event, selectedTime) => {
    // Lukker picker på Android efter valg
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    // Opdaterer formData med formateret tid (HH:MM format)
    if (selectedTime) {
      setFormData({ ...formData, endTime: formatTime(selectedTime) });
    }
  };

  // Toggle funktion til at tilføje/fjerne medarbejder fra vagt (bruges i medarbejder liste)
  const toggleEmployee = (employeeId, employeeName) => {
    const currentAssigned = formData.assignedTo || []; // Henter nuværende tildelte medarbejdere
    const employeeData = { id: employeeId, name: employeeName }; // Opretter medarbejder objekt
    
    // Tjekker om medarbejderen allerede er tildelt vagten
    const isAssigned = currentAssigned.some(emp => emp.id === employeeId);
    
    if (isAssigned) {
      // Fjerner medarbejder fra vagten ved at filtrere dem ud
      const updatedAssigned = currentAssigned.filter(emp => emp.id !== employeeId);
      setFormData({ ...formData, assignedTo: updatedAssigned });
    } else {
      // Tilføjer medarbejder til vagten ved at oprette nyt array med eksisterende + ny
      setFormData({ ...formData, assignedTo: [...currentAssigned, employeeData] });
    }
  };

  // Fjerner en specifik medarbejder fra vagten (bruges af "Fjern" knap i tildelte medarbejdere)
  const removeEmployee = (employeeId) => {
    const updatedAssigned = formData.assignedTo.filter(emp => emp.id !== employeeId);
    setFormData({ ...formData, assignedTo: updatedAssigned });
  };

  // Filtrerer medarbejdere baseret på søgetekst i modal (søger i navn og email)
  const filteredEmployees = Object.entries(employees).filter(([id, emp]) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase(); // Sammensætter fuldt navn
    const email = emp.email?.toLowerCase() || ""; // Sikrer email eksisterer
    const search = searchText.toLowerCase(); // Konverterer søgetekst til lowercase
    
    // Returnerer true hvis søgetekst findes i navn eller email
    return fullName.includes(search) || email.includes(search);
  });

  // Filtrerer vagter baseret på søgetekst i hovedvisning (søger kun i medarbejder navne)
  const filteredShifts = shifts ? Object.entries(shifts).filter(([id, shift]) => {
    const search = shiftSearchText.toLowerCase(); // Søgetekst i lowercase
    
    // Håndterer forskellige formater af assignedTo (array eller string)
    const assignedEmployees = Array.isArray(shift.assignedTo) 
      ? shift.assignedTo.map(emp => (emp.name || emp).toLowerCase()).join(" ") // Array: saml navne
      : (shift.assignedTo?.toLowerCase() || ""); // String eller null/undefined
    
    // Returnerer true hvis søgetekst findes i tildelte medarbejderes navne
    return assignedEmployees.includes(search);
  }) : []; // Returnerer tomt array hvis shifts er null

  // Åbner modal til oprettelse af ny vagt eller redigering af eksisterende vagt
  const openModal = (shiftId = null, presetDate = null) => {
    if (shiftId && shifts && shifts[shiftId]) {
      // REDIGERING MODE: Indlæser eksisterende vagt data
      setEditingId(shiftId); // Markerer at vi redigerer denne vagt
      const shiftData = shifts[shiftId];
      
      // Konverterer dato string til Date objekt (tilføjer middag for at undgå timezone problemer)
      const shiftDate = shiftData.date ? new Date(shiftData.date + 'T12:00:00') : new Date();
      
      // Populerer form med eksisterende data
      setFormData({
        ...shiftData, // Spreder alle eksisterende felter
        date: shiftDate,
        selectedDates: [], // Nulstiller multi-dag data
        isMultipleDays: false, // Deaktiverer multi-dag mode ved redigering
        // Normaliserer assignedTo til array format uanset hvad der er gemt
        assignedTo: Array.isArray(shiftData.assignedTo) ? shiftData.assignedTo : 
                   shiftData.assignedTo ? [{ name: shiftData.assignedTo }] : [],
      });
    } else {
      // OPRETTELSE MODE: Sætter standard værdier for ny vagt
      setEditingId(null); // Ingen vagt ID = ny vagt
      
      // Bruger preset dato hvis givet (fra uge-visning), ellers dagens dato
      const initialDate = presetDate ? new Date(presetDate + 'T12:00:00') : new Date();
      
      // Sætter tomme standardværdier
      setFormData({
        area: "",
        contactPerson: "",
        startTime: "",
        endTime: "",
        assignedTo: [],
        date: initialDate,
        selectedDates: [],
        isMultipleDays: false,
      });
    }
    
    // Rydder søgefeltet og åbner modal
    setSearchText("");
    setModalVisible(true);
  };

  // Gemmer vagt i Firebase database - håndterer både oprettelse og opdatering
  const saveShift = async () => {
    // VALIDERING: Tjekker at alle påkrævede felter er udfyldt
    if (
      !formData.area.trim() ||
      !formData.contactPerson.trim() ||
      !formData.startTime.trim() ||
      !formData.endTime.trim()
    ) {
      return Alert.alert("Udfyld alle felter!"); // Stopper udførelse hvis felter mangler
    }

    // VALIDERING: Tjekker at mindst én dato er valgt i multi-dag mode
    if (formData.isMultipleDays && formData.selectedDates.length === 0) {
      return Alert.alert("Vælg mindst én dato!");
    }

    try {
      if (editingId) {
        // OPDATERING: Redigerer eksisterende vagt
        const shiftData = {
          area: formData.area,
          contactPerson: formData.contactPerson,
          startTime: formData.startTime,
          endTime: formData.endTime,
          assignedTo: formData.assignedTo,
          date: formatDate(formData.date), // Konverterer Date til string
        };
        // Opdaterer specifik vagt i Firebase
        await update(ref(rtdb, `companies/${companyCode}/shifts/${editingId}`), shiftData);
        Alert.alert("Vagt opdateret");
      } else {
        // OPRETTELSE: Laver nye vagter
        if (formData.isMultipleDays && formData.selectedDates.length > 0) {
          // MULTI-DAG: Opretter identiske vagter på flere datoer
          const promises = formData.selectedDates.map(dateStr => {
            const shiftData = {
              area: formData.area,
              contactPerson: formData.contactPerson,
              startTime: formData.startTime,
              endTime: formData.endTime,
              assignedTo: formData.assignedTo,
              date: dateStr, // Bruger dato string direkte
            };
            // Returnerer promise for Firebase push operation
            return push(ref(rtdb, `companies/${companyCode}/shifts`), shiftData);
          });
          
          // Venter på at alle vagter er oprettet parallelt
          await Promise.all(promises);
          Alert.alert("Succes", `${formData.selectedDates.length} vagter oprettet`);
        } else {
          // ENKELT-DAG: Opretter én vagt
          const shiftData = {
            ...formData, // Spreder alle form data
            date: formatDate(formData.date), // Konverterer Date til string
          };
          await push(ref(rtdb, `companies/${companyCode}/shifts`), shiftData);
          Alert.alert("Ny vagt oprettet");
        }
      }
      
      // SUCCESS: Lukker modal og rydder søgefelt
      setModalVisible(false);
      setSearchText("");
    } catch (e) {
      // ERROR HANDLING: Viser fejlbesked hvis Firebase operation fejler
      Alert.alert("Fejl: " + e.message);
    }
  };

  // Sletter en vagt fra Firebase efter bruger bekræftelse
  const deleteShift = async (id) => {
    // Viser bekræftelsesdialog med to muligheder
    Alert.alert(
      "Bekræft sletning",
      "Er du sikker på at du vil slette denne vagt?",
      [
        {
          text: "Annuller", // Afbryder sletning
          style: "cancel"
        },
        {
          text: "Slet",
          style: "destructive", // Rød farve for at indikere farlig handling
          onPress: async () => {
            try {
              // Sletter vagt fra Firebase database
              await remove(ref(rtdb, `companies/${companyCode}/shifts/${id}`));
              Alert.alert("Vagt slettet"); // Bekræftelse til bruger
            } catch (e) {
              // Error handling hvis sletning fejler
              Alert.alert("Fejl", e.message);
            }
          }
        }
      ]
    );
  };

  // LOADING STATE: Viser loading indicator mens data hentes fra Firebase
  if (shifts === null) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={[globalStyles.center, { marginTop: 50 }]}>
          <ActivityIndicator /> {/* Spinner animation */}
          <Text>Indlæser vagter…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // HJÆLPE VARIABLER: Beregner data til brug i render funktioner
  const ids = shifts ? Object.keys(shifts) : []; // Array af vagt ID'er
  const weekDays = getWeekDays(currentWeek); // Array af dage i den aktuelle uge

  // RENDER FUNKTION: Viser dagens vagter i liste format
  const renderDayView = () => {
    const today = new Date(); // Dagens dato
    const todayShifts = getShiftsForDate(today); // Finder alle vagter for i dag

    return (
      <ScrollView style={{ flex: 1 }}>
        {/* Header med dagens dato */}
        <View style={globalStyles.dayHeader}>
          <Text style={globalStyles.dayHeaderText}>
            {formatDateDisplay(today)} {/* Formateret dansk dato */}
          </Text>
        </View>

        {todayShifts.length === 0 ? (
          <View style={[globalStyles.center, { marginTop: 50 }]}>
            <Text style={{ textAlign: "center", color: "#666" }}>
              Ingen vagter i dag
            </Text>
          </View>
        ) : (
          todayShifts.map(([shiftId, shift]) => (
            <TouchableOpacity
              key={shiftId}
              style={globalStyles.shiftCard}
              onPress={() => openModal(shiftId)}
            >
              <View style={globalStyles.shiftTimeContainer}>
                <Text style={globalStyles.shiftTime}>
                  {shift.startTime}–{shift.endTime}
                </Text>
              </View>
              <View style={globalStyles.shiftDetails}>
                <Text style={globalStyles.shiftArea}>{shift.area}</Text>
                <Text style={globalStyles.shiftContact}>
                  Kontakt: {shift.contactPerson}
                </Text>
                <Text style={globalStyles.shiftEmployees}>
                  Medarbejdere: {Array.isArray(shift.assignedTo) && shift.assignedTo.length > 0
                    ? shift.assignedTo.map(emp => emp.name || emp).join(", ")
                    : "Ikke tildelt"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  // RENDER FUNKTION: Viser vagter organiseret efter ugedage
  const renderWeekView = () => {
    return (
      <ScrollView style={{ flex: 1 }}>
        {/* Navigation til at skifte mellem uger */}
        <View style={globalStyles.weekNavigation}>
          {/* Forrige uge knap */}
          <TouchableOpacity
            style={globalStyles.navBtn}
            onPress={() => {
              const prevWeek = new Date(currentWeek); // Kopi af nuværende uge
              prevWeek.setDate(currentWeek.getDate() - 7); // Trækker 7 dage fra
              setCurrentWeek(prevWeek); // Opdaterer state
            }}
          >
            <Text style={globalStyles.navBtnText}>◀</Text>
          </TouchableOpacity>
          
          {/* Ugenummer beregning og visning */}
          <Text style={globalStyles.weekText}>
            Uge {Math.ceil((currentWeek - new Date(currentWeek.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))}
          </Text>
          
          {/* Næste uge knap */}
          <TouchableOpacity
            style={globalStyles.navBtn}
            onPress={() => {
              const nextWeek = new Date(currentWeek); // Kopi af nuværende uge
              nextWeek.setDate(currentWeek.getDate() + 7); // Tilføjer 7 dage
              setCurrentWeek(nextWeek); // Opdaterer state
            }}
          >
            <Text style={globalStyles.navBtnText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Ugedage */}
        {weekDays.map((day, index) => {
          const dayShifts = getShiftsForDate(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          
          return (
            <View key={index} style={[
              globalStyles.weekDay,
              isWeekend && globalStyles.weekendDay
            ]}>
              <View style={globalStyles.weekDayHeader}>
                <Text style={globalStyles.weekDayHeaderText}>
                  {formatDateDisplay(day)}
                </Text>
                <TouchableOpacity
                  style={globalStyles.addShiftBtn}
                  onPress={() => openModal(null, day)}
                >
                  <Text style={globalStyles.addShiftBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {dayShifts.length === 0 ? (
                <Text style={globalStyles.noShiftsText}>Ingen vagter</Text>
              ) : (
                dayShifts.map(([shiftId, shift]) => (
                  <TouchableOpacity
                    key={shiftId}
                    style={globalStyles.weekShiftCard}
                    onPress={() => openModal(shiftId)}
                  >
                    <Text style={globalStyles.weekShiftTime}>
                      {shift.startTime}–{shift.endTime}
                    </Text>
                    <Text style={globalStyles.weekShiftArea}>{shift.area}</Text>
                    <Text style={globalStyles.weekShiftEmployees}>
                      {Array.isArray(shift.assignedTo) && shift.assignedTo.length > 0
                        ? `${shift.assignedTo.length} medarbejdere`
                        : "Ikke tildelt"}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerText}>Vagtplan</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={globalStyles.toggleContainer}>
            <TouchableOpacity
              style={[
                globalStyles.toggleBtn,
                viewMode === 'list' && globalStyles.toggleBtnActive
              ]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[
                globalStyles.toggleText,
                viewMode === 'list' && globalStyles.toggleTextActive
              ]}>
                I dag
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                globalStyles.toggleBtn,
                viewMode === 'week' && globalStyles.toggleBtnActive
              ]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[
                globalStyles.toggleText,
                viewMode === 'week' && globalStyles.toggleTextActive
              ]}>
                Uge
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={globalStyles.addBtn}
            onPress={() => openModal()}
          >
            <Text style={globalStyles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Søgefelt kun for listevisning */}
      {viewMode === 'list' && ids.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <TextInput
            style={globalStyles.shiftInput}
            placeholder="Søg vagter efter medarbejdernavn..."
            placeholderTextColor="#888"
            value={shiftSearchText}
            onChangeText={setShiftSearchText}
          />
        </View>
      )}

      {ids.length === 0 ? (
        <View style={[globalStyles.center, { marginTop: 50 }]}>
          <Text style={{ textAlign: "center" }}>Ingen vagter oprettet endnu</Text>
        </View>
      ) : (
        viewMode === 'list' ? renderDayView() : renderWeekView()
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={globalStyles.container}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={globalStyles.modalTitle}>{editingId ? "Rediger vagt" : "Opret ny vagt"}</Text>

            <TextInput
              style={globalStyles.shiftInput}
              placeholder="Område (fx Bar 1, Podium)"
              placeholderTextColor="#888"
              value={formData.area}
              onChangeText={(t) => setFormData({ ...formData, area: t })}
            />

            <TextInput
              style={globalStyles.shiftInput}
              placeholder="Kontaktperson (Teamleder)"
              placeholderTextColor="#888"
              value={formData.contactPerson}
              onChangeText={(t) => setFormData({ ...formData, contactPerson: t })}
            />

            {/* Dato og tid sektion */}
            <Text style={globalStyles.sectionTitle}>Dato og tid</Text>
            
            {/* Toggle for flere dage (kun for nye vagter) */}
            {!editingId && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <TouchableOpacity
                  style={[
                    globalStyles.toggleBtn,
                    formData.isMultipleDays ? globalStyles.toggleBtnActive : { backgroundColor: '#f0f0f0' }
                  ]}
                  onPress={toggleMultipleDays}
                >
                  <Text style={[
                    globalStyles.toggleText,
                    formData.isMultipleDays && globalStyles.toggleTextActive
                  ]}>
                    {formData.isMultipleDays ? "✓ Flere dage" : "Flere dage"}
                  </Text>
                </TouchableOpacity>
                <Text style={{ marginLeft: 10, color: "#666", fontSize: 14 }}>
                  Opret samme vagt på flere datoer
                </Text>
              </View>
            )}
            
            <View style={globalStyles.dateTimeSection}>
              {/* Dato vælger */}
              <View style={globalStyles.dateTimeGroup}>
                {!formData.isMultipleDays ? (
                  <TouchableOpacity
                    style={[globalStyles.modernDateTimeBtn, showDatePicker && globalStyles.modernDateTimeBtnActive]}
                    onPress={() => setShowDatePicker(!showDatePicker)}
                  >
                    <View style={globalStyles.dateTimeBtnContent}>
                      <Text style={globalStyles.dateTimeBtnLabel}>Dato</Text>
                      <Text style={globalStyles.dateTimeBtnValue}>
                        {formData.date ? formatDateDisplay(formData.date) : "Vælg dato"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View>
                    <TouchableOpacity
                      style={[globalStyles.modernDateTimeBtn, showDatePicker && globalStyles.modernDateTimeBtnActive]}
                      onPress={() => setShowDatePicker(!showDatePicker)}
                    >
                      <View style={globalStyles.dateTimeBtnContent}>
                        <Text style={globalStyles.dateTimeBtnLabel}>Vælg datoer</Text>
                        <Text style={globalStyles.dateTimeBtnValue}>
                          {formData.selectedDates.length > 0 
                            ? `${formData.selectedDates.length} datoer valgt`
                            : "Tryk for at vælge"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Vis valgte datoer */}
                    {formData.selectedDates.length > 0 && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Valgte datoer:</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {formData.selectedDates.map((dateStr, index) => (
                            <View key={index} style={{
                              backgroundColor: '#e7f3ff',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              flexDirection: 'row',
                              alignItems: 'center',
                              borderWidth: 1,
                              borderColor: '#2196F3'
                            }}>
                              <Text style={{ fontSize: 12, color: '#2196F3', marginRight: 6 }}>
                                {formatDateDisplay(new Date(dateStr + 'T00:00:00'))}
                              </Text>
                              <TouchableOpacity onPress={() => removeDateFromSelection(dateStr)}>
                                <Text style={{ fontSize: 14, color: '#2196F3', fontWeight: 'bold' }}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
                
                {showDatePicker && (
                  <View style={globalStyles.modernPickerContainer}>
                    <DateTimePicker
                      value={formData.date instanceof Date && !isNaN(formData.date.getTime()) ? formData.date : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'compact' : 'default'}
                      onChange={onDateChange}
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={globalStyles.modernPickerDoneBtn}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={globalStyles.modernPickerDoneBtnText}>Færdig</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Start og slut tid i samme række */}
              <View style={globalStyles.timeRow}>
                <TouchableOpacity
                  style={[globalStyles.modernDateTimeBtn, showStartTimePicker && globalStyles.modernDateTimeBtnActive]}
                  onPress={() => setShowStartTimePicker(!showStartTimePicker)}
                >
                  <View style={globalStyles.dateTimeBtnContent}>
                    <Text style={globalStyles.dateTimeBtnLabel}>Start</Text>
                    <Text style={globalStyles.dateTimeBtnValue}>
                      {formData.startTime || "Vælg tid"}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[globalStyles.modernDateTimeBtn, showEndTimePicker && globalStyles.modernDateTimeBtnActive]}
                  onPress={() => setShowEndTimePicker(!showEndTimePicker)}
                >
                  <View style={globalStyles.dateTimeBtnContent}>
                    <Text style={globalStyles.dateTimeBtnLabel}>Slut</Text>
                    <Text style={globalStyles.dateTimeBtnValue}>
                      {formData.endTime || "Vælg tid"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Time pickers */}
              {showStartTimePicker && (
                <View style={globalStyles.modernPickerContainer}>
                  <DateTimePicker
                    value={formData.startTime ? new Date(`2000-01-01T${formData.startTime}:00`) : new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={onStartTimeChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={globalStyles.modernPickerDoneBtn}
                      onPress={() => setShowStartTimePicker(false)}
                    >
                      <Text style={globalStyles.modernPickerDoneBtnText}>Færdig</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {showEndTimePicker && (
                <View style={globalStyles.modernPickerContainer}>
                  <DateTimePicker
                    value={formData.endTime ? new Date(`2000-01-01T${formData.endTime}:00`) : new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={onEndTimeChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={globalStyles.modernPickerDoneBtn}
                      onPress={() => setShowEndTimePicker(false)}
                    >
                      <Text style={globalStyles.modernPickerDoneBtnText}>Færdig</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <Text style={globalStyles.sectionTitle}>Tilknyt medarbejdere</Text>
            
            {/* Vis nuværende tilknyttede medarbejdere */}
            {formData.assignedTo && formData.assignedTo.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[globalStyles.sectionTitle, { fontSize: 14, color: "#666" }]}>Nuværende tilknyttede:</Text>
                {formData.assignedTo.map((emp, index) => (
                  <View key={index} style={globalStyles.assignedEmployeeContainer}>
                    <Text style={globalStyles.assignedEmployeeText}>
                      {emp.name || emp}
                    </Text>
                    <TouchableOpacity
                      style={globalStyles.removeBtn}
                      onPress={() => removeEmployee(emp.id || index)}
                    >
                      <Text style={globalStyles.removeBtnText}>Fjern</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Søgefelt */}
            <Text style={[globalStyles.sectionTitle, { fontSize: 14, color: "#666" }]}>Tilgængelige godkendte medarbejdere:</Text>
            
            {Object.keys(employees).length > 0 && (
              <TextInput
                style={[globalStyles.shiftInput, { marginBottom: 10 }]}
                placeholder="Søg medarbejder (navn eller email)..."
                placeholderTextColor="#888"
                value={searchText}
                onChangeText={setSearchText}
              />
            )}

            {Object.keys(employees).length === 0 ? (
              <Text style={{ textAlign: "center", marginVertical: 16, color: "#666" }}>
                Ingen godkendte medarbejdere endnu
              </Text>
            ) : filteredEmployees.length === 0 ? (
              <Text style={{ textAlign: "center", marginVertical: 16, color: "#666" }}>
                Ingen medarbejdere fundet for "{searchText}"
              </Text>
            ) : (
              filteredEmployees.map(([id, emp]) => {
                const isAssigned = formData.assignedTo.some(assigned => assigned.id === id);
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      globalStyles.assignBtn,
                      isAssigned && globalStyles.assignBtnSelected
                    ]}
                    onPress={() => toggleEmployee(id, `${emp.firstName} ${emp.lastName}`)}
                  >
                    <Text style={[
                      globalStyles.assignText,
                      isAssigned && globalStyles.assignTextSelected
                    ]}>
                      {isAssigned ? "✓ " : ""}{emp.firstName} {emp.lastName}
                    </Text>
                    <Text style={[globalStyles.assignText, { fontSize: 12, color: "#666" }]}>
                      {emp.email}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}

            <View style={{ marginTop: 24 }}>
              <Button title="Gem" onPress={saveShift} color="#007AFF" />
              <View style={{ height: 12 }} />
              {editingId && (
                <>
                  <Button 
                    title="Slet vagt" 
                    onPress={() => {
                      setModalVisible(false);
                      deleteShift(editingId);
                    }} 
                    color="#FF3B30" 
                  />
                  <View style={{ height: 12 }} />
                </>
              )}
              <Button title="Annuller" onPress={() => {
                setModalVisible(false);
                setSearchText(""); // Ryd søgefeltet når modal annulleres
              }} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
