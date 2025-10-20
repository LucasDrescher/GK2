import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ScrollView } from "react-native";
import { rtdb } from "../database/firebase";
import { ref, onValue } from "firebase/database";
import { globalStyles } from "../styles";

export default function ShiftListScreen({ route }) {
  const { userId, companyCode } = route.params || {}; // får begge fra EmployeeHome
  const [shifts, setShifts] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [myShifts, setMyShifts] = useState([]);

  useEffect(() => {
    if (!userId) {
      console.log("[SHIFTS] Ingen userId modtaget i route");
      return;
    }

    console.log("[SHIFTS] userId fra route:", userId);

    // Hent medarbejder-data
    const empRef = ref(rtdb, `companies/${companyCode}/employees/` + userId);
    onValue(empRef, (snapshot) => {
      const empData = snapshot.val();
      console.log("[SHIFTS] medarbejderdata:", empData);

      if (empData) {
        setEmployee(empData);

        if (empData.approved) {
          // Brug companyCode fra employee eller fallback fra route
          const code = empData.companyCode || companyCode;
          const shiftsRef = ref(rtdb, `companies/${code}/shifts`);

          onValue(shiftsRef, (snap) => {
            const shiftData = snap.val();
            console.log("[SHIFTS] rå vagter fra Firebase:", shiftData);

            if (shiftData) {
              const arr = Object.entries(shiftData).map(([id, s]) => ({
                id,
                ...s,
              }));
              console.log("[SHIFTS] arr efter mapping:", arr);
              setShifts(arr);
              
              // Filtrer vagter hvor medarbejderen er tildelt
              const employeeName = `${empData.firstName} ${empData.lastName}`;
              const filtered = arr.filter(shift => {
                if (!shift.assignedTo || !Array.isArray(shift.assignedTo)) return false;
                return shift.assignedTo.some(emp => 
                  emp.id === userId || emp.name === employeeName
                );
              });
              
              // Sorter efter dato (tidligste først)
              filtered.sort((a, b) => {
                const dateA = new Date(a.date + 'T00:00:00');
                const dateB = new Date(b.date + 'T00:00:00');
                return dateA - dateB;
              });
              
              console.log("[SHIFTS] Filtrerede vagter for medarbejder:", filtered);
              setMyShifts(filtered);
            } else {
              console.log("[SHIFTS] ingen vagter fundet i databasen");
              setShifts([]);
              setMyShifts([]);
            }
          });
        }
      }
    });
  }, [userId, companyCode]);

  if (!employee) {
    return (
      <View style={globalStyles.container}>
        <Text>Henter medarbejderdata...</Text>
      </View>
    );
  }

  if (!employee.approved) {
    return (
      <View style={globalStyles.container}>
        <Text>Din tilmelding skal godkendes af lederen</Text>
      </View>
    );
  }

  // Formaterer dato til læsbart format
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('da-DK', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Tjek om vagt er i fortiden
  const isPastShift = (dateStr) => {
    const shiftDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return shiftDate < today;
  };

  // Render en vagt
  const renderShift = ({ item }) => {
    const past = isPastShift(item.date);
    
    console.log("[RENDER SHIFT]", {
      id: item.id,
      area: item.area,
      startTime: item.startTime,
      endTime: item.endTime,
      eventTitle: item.eventTitle,
      contactPerson: item.contactPerson
    });
    
    return (
      <View style={[
        globalStyles.employeeShiftCard,
        past && globalStyles.shiftCardPast
      ]}>
        <View style={globalStyles.shiftCardHeader}>
          <Text style={globalStyles.shiftCardDate}>
            {formatDate(item.date)}
          </Text>
          {past && (
            <View style={globalStyles.pastBadge}>
              <Text style={globalStyles.pastBadgeText}>Afsluttet</Text>
            </View>
          )}
        </View>
        
        <View style={globalStyles.shiftCardBody}>
          <View style={globalStyles.shiftCardRow}>
            <Text style={globalStyles.shiftCardLabel}>Område:</Text>
            <Text style={globalStyles.shiftCardValue}>{item.area || 'Ikke angivet'}</Text>
          </View>
          
          <View style={globalStyles.shiftCardRow}>
            <Text style={globalStyles.shiftCardLabel}>Tid:</Text>
            <Text style={globalStyles.shiftCardValue}>
              {item.startTime || '00:00'} - {item.endTime || '00:00'}
            </Text>
          </View>
          
          {item.eventTitle && (
            <View style={globalStyles.shiftCardRow}>
              <Text style={globalStyles.shiftCardLabel}>Event:</Text>
              <Text style={globalStyles.shiftCardValue}>{item.eventTitle}</Text>
            </View>
          )}
          
          {item.contactPerson && (
            <View style={globalStyles.shiftCardRow}>
              <Text style={globalStyles.shiftCardLabel}>Kontakt:</Text>
              <Text style={globalStyles.shiftCardValue}>{item.contactPerson}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Dine vagter</Text>
      
      {myShifts.length === 0 ? (
        <View style={globalStyles.emptyContainer}>
          <Text style={globalStyles.emptyText}>
            Du har ingen vagter endnu
          </Text>
          <Text style={globalStyles.emptySubtext}>
            Vagter vil vises her når du bliver tildelt dem af din leder
          </Text>
        </View>
      ) : (
        <FlatList
          data={myShifts}
          keyExtractor={(item) => item.id}
          renderItem={renderShift}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={globalStyles.listContainer}
        />
      )}
    </View>
  );
}
