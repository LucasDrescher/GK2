import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { rtdb } from '../../database/firebase';
import { ref, onValue } from 'firebase/database';
import { globalStyles, colors } from '../../styles';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId, companyCode, userId } = route.params || {};
  const [event, setEvent] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [contactPerson, setContactPerson] = useState(null);

  useEffect(() => {
    if (!eventId || !companyCode) return;

    // Hent event data
    const eventRef = ref(rtdb, `companies/${companyCode}/events/${eventId}`);
    const unsubscribe = onValue(eventRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setEvent(data);

        // Hent medarbejderoplysninger
        if (data.assignedEmployees) {
          const empPromises = Object.keys(data.assignedEmployees).map(empId => {
            return new Promise((resolve) => {
              const empRef = ref(rtdb, `companies/${companyCode}/employees/${empId}`);
              onValue(empRef, (empSnap) => {
                const empData = empSnap.val();
                if (empData) {
                  resolve({
                    id: empId,
                    ...empData,
                    ...data.assignedEmployees[empId]
                  });
                } else {
                  resolve(null);
                }
              }, { onlyOnce: true });
            });
          });

          Promise.all(empPromises).then(results => {
            const validEmps = results.filter(emp => emp !== null);
            setEmployees(validEmps);

            // Find kontaktperson (første medarbejder som default)
            if (validEmps.length > 0) {
              setContactPerson(validEmps[0]);
            }
          });
        }

        // Hent admin som kontaktperson hvis ingen medarbejdere
        if (data.createdBy) {
          const adminRef = ref(rtdb, `companies/${companyCode}/admins/${data.createdBy}`);
          onValue(adminRef, (adminSnap) => {
            const adminData = adminSnap.val();
            if (adminData && !contactPerson) {
              setContactPerson({
                id: data.createdBy,
                ...adminData,
                role: 'admin'
              });
            }
          }, { onlyOnce: true });
        }
      }
    });

    return () => unsubscribe();
  }, [eventId, companyCode]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Dato ukendt';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
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

  if (!event) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.centerAligned}>
          <Text style={globalStyles.textMuted}>Henter event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hours = calculateHours(event.startTime, event.endTime);

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          backgroundColor: colors.primary,
          padding: 20,
          paddingTop: 60,
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginBottom: 16 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.white,
            marginBottom: 8,
          }}>
            {event.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="calendar" size={16} color={colors.white} />
            <Text style={{ fontSize: 14, color: colors.white, marginLeft: 6 }}>
              {formatDate(event.date)}
            </Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {/* Tid og sted */}
          <View style={globalStyles.card}>
            <Text style={globalStyles.subtitle}>Tid og sted</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <Ionicons name="time" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>Tidspunkt</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  {event.startTime} - {event.endTime} ({hours} timer)
                </Text>
              </View>
            </View>

            {event.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#E8F5E9',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="location" size={20} color="#4CAF50" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>Lokation</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                    {event.location}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Beskrivelse */}
          {event.description && (
            <View style={globalStyles.card}>
              <Text style={globalStyles.subtitle}>Beskrivelse</Text>
              <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22 }}>
                {event.description}
              </Text>
            </View>
          )}

          {/* Kontaktperson */}
          {contactPerson && (
            <View style={globalStyles.card}>
              <Text style={globalStyles.subtitle}>Kontaktperson</Text>
              <View style={{
                backgroundColor: colors.primaryLight,
                padding: 16,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.white }}>
                      {contactPerson.firstName?.[0]}{contactPerson.lastName?.[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                      {contactPerson.firstName} {contactPerson.lastName}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.primary, marginTop: 2 }}>
                      {contactPerson.role === 'admin' ? 'Administrator' : 'Medarbejder'}
                    </Text>
                  </View>
                </View>

                {contactPerson.email && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Ionicons name="mail" size={16} color={colors.primary} />
                    <Text style={{ fontSize: 14, color: colors.primary, marginLeft: 8 }}>
                      {contactPerson.email}
                    </Text>
                  </View>
                )}

                {contactPerson.phoneNumber && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                    <Ionicons name="call" size={16} color={colors.primary} />
                    <Text style={{ fontSize: 14, color: colors.primary, marginLeft: 8 }}>
                      {contactPerson.phoneNumber}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Andre deltagere */}
          {employees.length > 0 && (
            <View style={globalStyles.card}>
              <Text style={globalStyles.subtitle}>
                Deltagere ({employees.length})
              </Text>
              {employees.map((emp, index) => (
                <View
                  key={emp.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: emp.id === userId ? colors.primaryLight : colors.surface,
                    borderRadius: 8,
                    marginBottom: 8,
                    borderLeftWidth: emp.id === userId ? 3 : 0,
                    borderLeftColor: colors.primary,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: emp.id === userId ? colors.primary : colors.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: emp.id === userId ? colors.white : colors.textSecondary,
                    }}>
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: colors.text,
                      }}>
                        {emp.firstName} {emp.lastName}
                      </Text>
                      {emp.id === userId && (
                        <Text style={{
                          fontSize: 12,
                          color: colors.primary,
                          marginLeft: 8,
                          fontWeight: '600',
                        }}>
                          (dig)
                        </Text>
                      )}
                    </View>
                    {emp.hoursWorked && (
                      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                        {emp.hoursWorked} timer
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
