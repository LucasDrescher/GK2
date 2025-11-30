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
import { rtdb } from "../../database/firebase"; // Firebase database forbindelse
import { ref, onValue, push, update, remove } from "firebase/database"; // Firebase database funktioner
import { globalStyles } from "../../styles"; // Importerer styling fra separat fil



// Hovedkomponent for admin vagtplan - modtager route og navigation som props
export default function AdminShiftList({ route, navigation }) {
  // Henter virksomhedskode fra navigation parametre
  const { companyCode } = route.params || {};
  
  // State hooks til at håndtere komponentens tilstand
  const [shifts, setShifts] = useState(null); // Alle vagter fra databasen
  const [employees, setEmployees] = useState({}); // Godkendte medarbejdere
  const [events, setEvents] = useState({}); // Events fra databasen
  
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

    // Opretter reference til events i Firebase
    const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
    const unsubEvents = onValue(eventsRef, (snap) => {
      const data = snap.val();
      setEvents(data || {});
    });

    // Cleanup funktion - fjerner listeners når komponenten unmountes
    return () => {
      unsubscribe();
      unsubEmp();
      unsubEvents();
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

  // Beregner de næste 7 dage fra en given dato
  const getNext7Days = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
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

  // Hjælpefunktion til at konvertere tid string (HH:MM) til Date objekt for picker
  const getTimeAsDate = (timeStr) => {
    const now = new Date();
    
    // Hvis der er en gyldig tid string, brug den
    if (timeStr && timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      
      if (!isNaN(h) && !isNaN(m)) {
        now.setHours(h, m, 0, 0);
        return now;
      }
    }
    
    // Ellers returner bare nuværende tid
    return now;
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
        eventId: shiftData.eventId || null,
        eventTitle: shiftData.eventTitle || "",
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
        eventId: null,
        eventTitle: "",
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

    // VALIDERING: Tjekker at et event er valgt
    if (!formData.eventId) {
      return Alert.alert("Vælg et event!", "Du skal vælge et event for at oprette en vagt.");
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
          eventId: formData.eventId || null,
          eventTitle: formData.eventTitle || null,
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
              eventId: formData.eventId || null,
              eventTitle: formData.eventTitle || null,
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
            eventId: formData.eventId || null,
            eventTitle: formData.eventTitle || null,
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
      Alert.alert("Fejl", e.message);
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
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10 }}>Indlæser vagter…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // HJÆLPE VARIABLER: Beregner data til brug i render funktioner
  const ids = shifts ? Object.keys(shifts) : []; // Array af vagt ID'er
  const next7Days = getNext7Days(currentWeek); // Array af de næste 7 dage

  // Hjælpefunktion til at finde events for en specifik dato
  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    return Object.entries(events).filter(([id, event]) => {
      return event.date === dateStr;
    });
  };

  // Konverterer tid string (HH:MM) til minutter siden midnat
  const timeToMinutes = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // RENDER FUNKTION: Viser dagens events i tidsplan-kalender format
  const renderDayView = () => {
    const today = new Date();
    const todayEvents = getEventsForDate(today);

    // Tidsplan grid - 24 timer (0-23)
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourHeight = 80; // Pixels per time

    return (
      <ScrollView style={globalStyles.flex1}>
        {/* Header med dagens dato */}
        <View style={globalStyles.dayHeader}>
          <Text style={globalStyles.dayHeaderText}>
            {formatDateDisplay(today)}
          </Text>
        </View>

        {/* Tidsplan grid */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
          {/* Tid-kolonne til venstre */}
          <View style={{ width: 60, paddingTop: 0 }}>
            {hours.map(hour => (
              <View key={hour} style={{ height: hourHeight, justifyContent: 'flex-start' }}>
                <Text style={{ fontSize: 12, color: '#666', fontWeight: '500' }}>
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          {/* Event-kolonne til højre */}
          <View style={{ flex: 1, position: 'relative', borderLeftWidth: 2, borderLeftColor: '#E0E0E0' }}>
            {/* Grid linjer */}
            {hours.map(hour => (
              <View
                key={`line-${hour}`}
                style={{
                  height: hourHeight,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F0F0F0',
                }}
              />
            ))}

            {/* Events positioneret absolut */}
            {todayEvents.length === 0 ? (
              <View style={{ position: 'absolute', top: 200, left: 0, right: 0, alignItems: 'center' }}>
                <Text style={{ color: '#999', fontSize: 14 }}>Ingen events i dag</Text>
              </View>
            ) : (
              todayEvents.map(([eventId, event]) => {
                const startMinutes = timeToMinutes(event.startTime);
                const endMinutes = timeToMinutes(event.endTime);
                const durationMinutes = endMinutes - startMinutes;

                // Beregn position og højde
                const topPosition = (startMinutes / 60) * hourHeight;
                const blockHeight = (durationMinutes / 60) * hourHeight;

                return (
                  <TouchableOpacity
                    key={eventId}
                    style={{
                      position: 'absolute',
                      top: topPosition,
                      left: 8,
                      right: 8,
                      height: blockHeight,
                      backgroundColor: '#4CAF50',
                      borderRadius: 8,
                      padding: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: '#2E7D32',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                    onPress={() => navigation.navigate('EditEvent', { eventId, companyCode })}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={{ color: '#FFF', fontSize: 12, marginTop: 2 }}>
                      {event.startTime} - {event.endTime}
                    </Text>
                    {event.location && (
                      <Text style={{ color: '#FFF', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                        📍 {event.location}
                      </Text>
                    )}
                    {event.assignedEmployees && Object.keys(event.assignedEmployees).length > 0 && (
                      <Text style={{ color: '#FFF', fontSize: 11, marginTop: 2 }}>
                        👥 {Object.keys(event.assignedEmployees).length} medarbejdere
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  // RENDER FUNKTION: Viser events organiseret efter 7 dage
  const renderWeekView = () => {
    return (
      <ScrollView style={globalStyles.flex1}>
        {/* Navigation til at skifte mellem 7-dages perioder */}
        <View style={globalStyles.weekNavigation}>
          {/* Forrige 7 dage knap */}
          <TouchableOpacity
            style={globalStyles.navBtn}
            onPress={() => {
              const prevWeek = new Date(currentWeek);
              prevWeek.setDate(currentWeek.getDate() - 7);
              setCurrentWeek(prevWeek);
            }}
          >
            <Text style={globalStyles.navBtnText}>◀ Forrige</Text>
          </TouchableOpacity>
          
          <Text style={globalStyles.weekText}>
            7-dages oversigt
          </Text>
          
          {/* Næste 7 dage knap */}
          <TouchableOpacity
            style={globalStyles.navBtn}
            onPress={() => {
              const nextWeek = new Date(currentWeek);
              nextWeek.setDate(currentWeek.getDate() + 7);
              setCurrentWeek(nextWeek);
            }}
          >
            <Text style={globalStyles.navBtnText}>Næste ▶</Text>
          </TouchableOpacity>
        </View>

        {/* De næste 7 dage */}
        {next7Days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isToday = formatDate(day) === formatDate(new Date());
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          
          return (
            <View key={index} style={[
              globalStyles.weekDay,
              isWeekend && globalStyles.weekendDay,
              isToday && { borderLeftWidth: 4, borderLeftColor: '#4F46E5' }
            ]}>
              <View style={globalStyles.weekDayHeader}>
                <Text style={[
                  globalStyles.weekDayHeaderText,
                  isToday && { color: '#4F46E5', fontWeight: '700' }
                ]}>
                  {isToday ? '📍 ' : ''}{formatDateDisplay(day)}
                </Text>
                <TouchableOpacity
                  style={globalStyles.addShiftBtn}
                  onPress={() => navigation.navigate('AdminCreateEvent', { companyCode })}
                >
                  <Text style={globalStyles.addShiftBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {dayEvents.length === 0 ? (
                <Text style={globalStyles.noShiftsText}>Ingen events</Text>
              ) : (
                dayEvents.map(([eventId, event]) => (
                  <TouchableOpacity
                    key={eventId}
                    style={[globalStyles.weekShiftCard, { 
                      backgroundColor: '#E8F5E9',
                      borderLeftWidth: 4,
                      borderLeftColor: '#4CAF50'
                    }]}
                    onPress={() => navigation.navigate('EditEvent', { eventId, companyCode })}
                  >
                    <Text style={[globalStyles.weekShiftTime, { color: '#2E7D32' }]}>
                      {event.startTime}–{event.endTime}
                    </Text>
                    <Text style={[globalStyles.weekShiftArea, { color: '#1B5E20', fontWeight: '700' }]}>
                      {event.title}
                    </Text>
                    {event.location && (
                      <Text style={[globalStyles.weekShiftEmployees, { color: '#388E3C' }]}>
                        📍 {event.location}
                      </Text>
                    )}
                    {event.assignedEmployees && Object.keys(event.assignedEmployees).length > 0 && (
                      <Text style={globalStyles.weekShiftEmployees}>
                        👥 {Object.keys(event.assignedEmployees).length} medarbejdere
                      </Text>
                    )}
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
        <Text style={globalStyles.headerText}>Eventplan</Text>
      <View style={globalStyles.rowGap8}>
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
                7 dage
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={globalStyles.addBtn}
            onPress={() => navigation.navigate('AdminCreateEvent', { companyCode })}
          >
            <Text style={globalStyles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {ids.length === 0 && Object.keys(events).length === 0 ? (
        <View style={[globalStyles.center, { marginTop: 50 }]}>
          <Text style={globalStyles.centerTextMuted}>Ingen events oprettet endnu</Text>
        </View>
      ) : (
        viewMode === 'list' ? renderDayView() : renderWeekView()
      )}
    </SafeAreaView>
  );
}
