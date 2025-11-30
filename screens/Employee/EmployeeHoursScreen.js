import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { rtdb } from '../../database/firebase';
import { ref, onValue } from 'firebase/database';
import { globalStyles, colors } from '../../styles';

export default function EmployeeHoursScreen({ route, navigation }) {
  const { userId, companyCode } = route.params || {};
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    if (!userId || !companyCode) return;

    // Hent medarbejder data
    const empRef = ref(rtdb, `companies/${companyCode}/employees/${userId}`);
    const unsubEmp = onValue(empRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('Employee data:', data);
        console.log('Contract:', data.contract);
        console.log('Hourly rate:', data.contract?.hourlyRate);
        setEmployee(data);
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

      // Sorter efter dato
      employeeEvents.sort((a, b) => {
        const dateA = new Date(a.date + 'T00:00:00');
        const dateB = new Date(b.date + 'T00:00:00');
        return dateA - dateB;
      });

      setEvents(employeeEvents);
      setPastEvents(employeeEvents.filter(e => e.isPast));
      setUpcomingEvents(employeeEvents.filter(e => !e.isPast));
    });

    return () => {
      unsubEmp();
      unsubEvents();
    };
  }, [userId, companyCode]);

  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return (endMinutes - startMinutes) / 60;
  };

  const totalPastHours = pastEvents.reduce((sum, event) => {
    const empData = event.assignedEmployees?.[userId];
    // Brug godkendte timer hvis de findes, ellers planlagte timer
    if (empData?.hoursApproved && empData?.hoursWorked !== undefined) {
      return sum + empData.hoursWorked;
    }
    return sum + calculateHours(event.startTime, event.endTime);
  }, 0);

  const totalUpcomingHours = upcomingEvents.reduce((sum, event) => {
    const empData = event.assignedEmployees?.[userId];
    // Brug godkendte timer hvis de findes, ellers planlagte timer
    if (empData?.hoursApproved && empData?.hoursWorked !== undefined) {
      return sum + empData.hoursWorked;
    }
    return sum + calculateHours(event.startTime, event.endTime);
  }, 0);

  const hourlyRate = employee?.contract?.hourlyWage || 0;
  const pastEarnings = totalPastHours * hourlyRate;
  const upcomingEarnings = totalUpcomingHours * hourlyRate;
  const totalEarnings = pastEarnings + upcomingEarnings;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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
          }}>
            Dine timer
          </Text>
        </View>

        <View style={{ padding: 16 }}>
          {/* Oversigt med opdeling */}
          <View style={{
            backgroundColor: colors.primary,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 16,
              color: colors.white,
              opacity: 0.9,
              marginBottom: 4,
            }}>
              Total indtjening (før skat)
            </Text>
            <Text style={{
              fontSize: 36,
              fontWeight: '800',
              color: colors.white,
              marginBottom: 20,
            }}>
              {formatCurrency(totalEarnings)}
            </Text>
            
            {/* Optjent vs Forventet */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 16,
            }}>
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                padding: 12,
              }}>
                <Text style={{ fontSize: 12, color: colors.white, opacity: 0.8, marginBottom: 4 }}>
                  ✓ Godkendt
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.white }}>
                  {formatCurrency(pastEarnings)}
                </Text>
                <Text style={{ fontSize: 11, color: colors.white, opacity: 0.7, marginTop: 2 }}>
                  {totalPastHours.toFixed(1)} timer
                </Text>
              </View>
              
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                padding: 12,
              }}>
                <Text style={{ fontSize: 12, color: colors.white, opacity: 0.8, marginBottom: 4 }}>
                  ⏳ Afventer
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.white }}>
                  {formatCurrency(upcomingEarnings)}
                </Text>
                <Text style={{ fontSize: 11, color: colors.white, opacity: 0.7, marginTop: 2 }}>
                  {totalUpcomingHours.toFixed(1)} timer
                </Text>
              </View>
            </View>
            
            <View style={{
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.3)',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: colors.white, opacity: 0.8 }}>
                  Din timeløn
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.white }}>
                  {hourlyRate > 0 ? `${hourlyRate.toLocaleString('da-DK')} kr/t` : 'Ikke angivet'}
                </Text>
              </View>
            </View>
          </View>

          {/* Arbejdede timer */}
          <View style={globalStyles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={globalStyles.subtitle}>Arbejdede timer</Text>
              <View style={{
                backgroundColor: '#E8F5E9',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#4CAF50' }}>
                  {totalPastHours.toFixed(1)} timer
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: '#E8F5E9',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 14, color: '#2E7D32', marginBottom: 4 }}>
                Godkendt indtjening (før skat)
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#1B5E20' }}>
                {formatCurrency(pastEarnings)}
              </Text>
            </View>

            {pastEvents.length === 0 ? (
              <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: 20 }}>
                Du har ikke arbejdet nogen timer endnu
              </Text>
            ) : (
              pastEvents.map((event) => {
                const hours = calculateHours(event.startTime, event.endTime);
                const earnings = hours * hourlyRate;
                
                // Tjek godkendelsesstatus
                const employeeData = event.assignedEmployees?.[userId];
                const isApproved = employeeData?.hoursApproved === true;
                const isRejected = employeeData?.hoursRejected === true;
                const isPending = !isApproved && !isRejected;
                const approvedHours = employeeData?.hoursWorked || hours;
                const approvedEarnings = approvedHours * hourlyRate;
                
                return (
                  <View
                    key={event.id}
                    style={{
                      backgroundColor: colors.surface,
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: isApproved ? '#4CAF50' : isRejected ? '#EF4444' : '#F59E0B',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>
                        {event.title}
                      </Text>
                      {isApproved && (
                        <View style={{
                          backgroundColor: '#E8F5E9',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#4CAF50' }}>
                            ✓ Godkendt
                          </Text>
                        </View>
                      )}
                      {isRejected && (
                        <View style={{
                          backgroundColor: '#FFEBEE',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#EF4444' }}>
                            ✕ Afvist
                          </Text>
                        </View>
                      )}
                      {isPending && (
                        <View style={{
                          backgroundColor: '#FEF3C7',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#F59E0B' }}>
                            ⏳ Afventer
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
                      {event.date} • {event.startTime} - {event.endTime}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {isApproved ? `${approvedHours.toFixed(1)} timer` : `${hours.toFixed(1)} timer`}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1B5E20' }}>
                        {formatCurrency(isApproved ? approvedEarnings : earnings)}
                      </Text>
                    </View>
                    {isApproved && approvedHours !== hours && (
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' }}>
                        Justeret fra {hours.toFixed(1)} timer
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Kommende timer */}
          <View style={globalStyles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={globalStyles.subtitle}>Kommende timer</Text>
              <View style={{
                backgroundColor: colors.primaryLight,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                  {totalUpcomingHours.toFixed(1)} timer
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: colors.primaryLight,
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 14, color: colors.primary, marginBottom: 4 }}>
                Forventet indtjening (før skat)
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
                {formatCurrency(upcomingEarnings)}
              </Text>
            </View>

            {upcomingEvents.length === 0 ? (
              <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: 20 }}>
                Du har ingen kommende vagter
              </Text>
            ) : (
              upcomingEvents.map((event) => {
                const hours = calculateHours(event.startTime, event.endTime);
                const earnings = hours * hourlyRate;
                
                return (
                  <View
                    key={event.id}
                    style={{
                      backgroundColor: colors.surface,
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: colors.primary,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                      {event.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                      {formatDate(event.date)} • {event.startTime} - {event.endTime}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
                        {hours.toFixed(1)} timer
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>
                        {formatCurrency(earnings)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Info box */}
          <View style={{
            backgroundColor: '#FFF3E0',
            padding: 16,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#FF9800',
            marginTop: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="information-circle" size={20} color="#E65100" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#E65100', marginLeft: 8 }}>
                Vigtig information
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#E65100', lineHeight: 18 }}>
              Alle beløb er før skat. Din faktiske udbetaling vil være lavere efter fradrag af skat og AM-bidrag.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
