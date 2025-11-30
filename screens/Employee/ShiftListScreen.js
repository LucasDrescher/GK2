import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { rtdb } from "../../database/firebase";
import { ref, onValue } from "firebase/database";
import { globalStyles, colors } from "../../styles";

export default function ShiftListScreen({ route, navigation }) {
  const { userId, companyCode } = route.params || {};
  const [employee, setEmployee] = useState(null);
  const [myEvents, setMyEvents] = useState([]);

  useEffect(() => {
    if (!userId || !companyCode) return;

    // Hent medarbejder-data
    const empRef = ref(rtdb, `companies/${companyCode}/employees/${userId}`);
    const unsubEmp = onValue(empRef, (snapshot) => {
      const empData = snapshot.val();
      if (empData) {
        setEmployee(empData);
      }
    });

    // Hent events hvor medarbejderen er tilknyttet
    const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
    const unsubEvents = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const employeeEvents = [];
      Object.entries(data).forEach(([id, event]) => {
        if (event.assignedEmployees && event.assignedEmployees[userId]) {
          const eventDate = new Date(event.date + 'T00:00:00');
          employeeEvents.push({
            id,
            ...event,
            isPast: eventDate < today,
          });
        }
      });

      // Sorter efter dato (nyeste først)
      employeeEvents.sort((a, b) => {
        const dateA = new Date(a.date + 'T00:00:00');
        const dateB = new Date(b.date + 'T00:00:00');
        return dateB - dateA; // Sorter nyeste først
      });

      setMyEvents(employeeEvents);
    });

    return () => {
      unsubEmp();
      unsubEvents();
    };
  }, [userId, companyCode]);

  if (!employee) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.centerAligned}>
          <Text style={globalStyles.textMuted}>Henter data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!employee.approved) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.centerAligned}>
          <Ionicons name="time-outline" size={64} color={colors.textMuted} />
          <Text style={{ fontSize: 18, color: colors.text, marginTop: 16, fontWeight: '600' }}>
            Afventer godkendelse
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
            Din tilmelding skal godkendes af lederen før du kan se dine vagter
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'short',
    });
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return ((endMinutes - startMinutes) / 60).toFixed(1);
  };

  const renderEvent = ({ item }) => {
    const hours = calculateHours(item.startTime, item.endTime);
    const statusColor = item.isPast ? colors.textMuted : '#4CAF50';
    
    return (
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 12,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
          opacity: item.isPast ? 0.7 : 1,
        }}
        onPress={() => navigation.navigate('EventDetail', {
          eventId: item.id,
          companyCode,
          userId,
        })}
        activeOpacity={0.7}
      >
        {/* Header med dato og status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: statusColor + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: statusColor }}>
                {new Date(item.date).getDate()}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: statusColor, marginTop: -2 }}>
                {new Date(item.date).toLocaleDateString('da-DK', { month: 'short' }).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {item.startTime} - {item.endTime} · {hours} timer
              </Text>
            </View>
          </View>
          
          {item.isPast && (
            <View style={{
              backgroundColor: colors.textMuted + '20',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              marginLeft: 8,
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>
                AFSLUTTET
              </Text>
            </View>
          )}
        </View>

        {/* Lokation */}
        {item.location && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.background,
            padding: 10,
            borderRadius: 10,
          }}>
            <Ionicons name="location" size={16} color={'#4CAF50'} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>
              {item.location}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 32,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Text style={{ 
          fontSize: 32, 
          fontWeight: '800', 
          color: colors.white,
          marginBottom: 4,
        }}>
          Vagtplan
        </Text>
        {employee && (
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
            {myEvents.length} {myEvents.length === 1 ? 'vagt' : 'vagter'}
          </Text>
        )}
      </LinearGradient>

      {myEvents.length === 0 ? (
        <View style={[globalStyles.centerAligned, { marginTop: 60 }]}>
          <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
          <Text style={{ fontSize: 18, color: colors.text, marginTop: 16, fontWeight: '600' }}>
            Ingen vagter endnu
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
            Vagter vil vises her når du bliver tildelt dem af din leder
          </Text>
        </View>
      ) : (
        <FlatList
          data={myEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={{ paddingVertical: 16 }}
        />
      )}
    </View>
  );
}
