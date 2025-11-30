import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { rtdb } from '../../database/firebase';
import { ref, onValue, update } from 'firebase/database';
import { globalStyles, colors } from '../../styles';

export default function ApproveHoursScreen({ route, navigation }) {
  const { companyCode } = route.params;
  
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editedHours, setEditedHours] = useState('');
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    if (!companyCode) return;

    // Lyt til events
    const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
    const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const eventsList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      
      // Filtrer events der har assignedEmployees og er på eller efter i dag
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const relevantEvents = eventsList.filter(event => {
        if (!event.assignedEmployees) return false;
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate <= new Date(); // Events der er færdige eller i dag
      });
      
      relevantEvents.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setEvents(relevantEvents);
      setLoading(false);
    });

    // Lyt til medarbejdere for at få deres timeløn
    const employeesRef = ref(rtdb, `companies/${companyCode}/employees`);
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setEmployees(data);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeEmployees();
    };
  }, [companyCode]);

  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const start = startH + startM / 60;
    const end = endH + endM / 60;
    return end - start;
  };

  const handleApprove = async (eventId, employeeId, scheduledHours) => {
    try {
      const employee = employees[employeeId];
      const hourlyRate = employee?.contract?.hourlyWage || 0;
      const totalCost = scheduledHours * hourlyRate;

      await update(ref(rtdb, `companies/${companyCode}/events/${eventId}/assignedEmployees/${employeeId}`), {
        hoursWorked: scheduledHours,
        totalCost: totalCost,
        hoursApproved: true,
        approvedAt: Date.now(),
      });

      Alert.alert('Godkendt', `Timer er blevet godkendt for ${employee.firstName} ${employee.lastName}`);
    } catch (error) {
      Alert.alert('Fejl', error.message);
    }
  };

  const handleReject = async (eventId, employeeId, employeeName) => {
    Alert.alert(
      'Afvis timer',
      `Er du sikker på at du vil afvise timerne for ${employeeName}?`,
      [
        { text: 'Annuller', style: 'cancel' },
        {
          text: 'Afvis',
          style: 'destructive',
          onPress: async () => {
            try {
              const event = events.find(e => e.id === eventId);
              
              await update(ref(rtdb, `companies/${companyCode}/events/${eventId}/assignedEmployees/${employeeId}`), {
                hoursWorked: 0,
                totalCost: 0,
                hoursApproved: false,
                hoursRejected: true,
                rejectedAt: Date.now(),
              });
              
              // Send automatisk besked til medarbejderen
              const chatRef = ref(rtdb, `companies/${companyCode}/chats`);
              const chatId = Date.now();
              await update(ref(rtdb, `companies/${companyCode}/chats/${chatId}`), {
                name: `Timer afvist - ${event?.title}`,
                type: 'system',
                createdAt: Date.now(),
                members: {
                  [employeeId]: {
                    role: 'employee',
                    firstName: employeeName.split(' ')[0],
                    lastName: employeeName.split(' ')[1] || '',
                    joinedAt: Date.now(),
                  }
                },
                messages: {
                  [Date.now()]: {
                    text: `Dine timer for "${event?.title}" d. ${event?.date} er blevet afvist af admin. Kontakt venligst din arbejdsgiver for mere information.`,
                    senderId: 'system',
                    senderName: 'System',
                    senderRole: 'system',
                    timestamp: Date.now(),
                  }
                },
                unreadCount: {
                  [employeeId]: 1
                }
              });
              
              Alert.alert('Afvist', 'Timer er blevet afvist og medarbejderen er blevet informeret');
            } catch (error) {
              Alert.alert('Fejl', error.message);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (eventId, employeeId, employeeName, scheduledHours) => {
    setSelectedEntry({ eventId, employeeId, employeeName, scheduledHours });
    setEditedHours(scheduledHours.toString());
    setEditNote('');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEntry) return;
    
    const hours = parseFloat(editedHours);
    if (isNaN(hours) || hours < 0) {
      Alert.alert('Fejl', 'Indtast et gyldigt antal timer');
      return;
    }

    try {
      const employee = employees[selectedEntry.employeeId];
      const hourlyRate = employee?.contract?.hourlyWage || 0;
      const totalCost = hours * hourlyRate;
      const event = events.find(e => e.id === selectedEntry.eventId);
      const originalHours = selectedEntry.scheduledHours;

      await update(ref(rtdb, `companies/${companyCode}/events/${selectedEntry.eventId}/assignedEmployees/${selectedEntry.employeeId}`), {
        hoursWorked: hours,
        totalCost: totalCost,
        hoursApproved: true,
        approvedAt: Date.now(),
        editNote: editNote || null,
        wasEdited: hours !== originalHours,
      });

      // Send automatisk besked hvis timerne er ændret
      if (hours !== originalHours) {
        const chatId = Date.now();
        await update(ref(rtdb, `companies/${companyCode}/chats/${chatId}`), {
          name: `Timer justeret - ${event?.title}`,
          type: 'system',
          createdAt: Date.now(),
          members: {
            [selectedEntry.employeeId]: {
              role: 'employee',
              firstName: selectedEntry.employeeName.split(' ')[0],
              lastName: selectedEntry.employeeName.split(' ')[1] || '',
              joinedAt: Date.now(),
            }
          },
          messages: {
            [Date.now()]: {
              text: `Dine timer for "${event?.title}" d. ${event?.date} er blevet justeret fra ${originalHours.toFixed(1)} til ${hours.toFixed(1)} timer af admin.${editNote ? `\n\nNote: ${editNote}` : ''}`,
              senderId: 'system',
              senderName: 'System',
              senderRole: 'system',
              timestamp: Date.now(),
            }
          },
          unreadCount: {
            [selectedEntry.employeeId]: 1
          }
        });
      }

      setEditModalVisible(false);
      Alert.alert('Gemt', `Timer opdateret til ${hours} timer for ${selectedEntry.employeeName}${hours !== originalHours ? ' og medarbejderen er blevet informeret' : ''}`);
    } catch (error) {
      Alert.alert('Fejl', error.message);
    }
  };

  const renderEventCard = (event) => {
    if (!event.assignedEmployees) return null;

    const scheduledHours = calculateHours(event.startTime, event.endTime);
    const assignedList = Object.entries(event.assignedEmployees);

    // Tjek hvor mange der afventer godkendelse
    const pendingCount = assignedList.filter(([id, emp]) => !emp.hoursApproved && !emp.hoursRejected).length;
    const approvedCount = assignedList.filter(([id, emp]) => emp.hoursApproved).length;

    return (
      <View key={event.id} style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
              {event.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {event.date}
              </Text>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} style={{ marginLeft: 8 }} />
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {event.startTime} - {event.endTime} ({scheduledHours.toFixed(1)}h)
              </Text>
            </View>
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          gap: 12,
          marginBottom: 16,
          paddingVertical: 12,
          paddingHorizontal: 12,
          backgroundColor: colors.gray50,
          borderRadius: 8,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Afventende</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.warning }}>
              {pendingCount}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Godkendt</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.success }}>
              {approvedCount}
            </Text>
          </View>
        </View>

        {assignedList.map(([empId, empData]) => {
          const employee = employees[empId];
          if (!employee) return null;

          const isApproved = empData.hoursApproved === true;
          const isRejected = empData.hoursRejected === true;
          const isPending = !isApproved && !isRejected;

          return (
            <View key={empId} style={{
              borderTopWidth: 1,
              borderTopColor: colors.gray200,
              paddingTop: 12,
              marginTop: 12,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                    {employee.firstName} {employee.lastName}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
                    Planlagt: {scheduledHours.toFixed(1)} timer
                  </Text>
                  {isApproved && empData.hoursWorked !== undefined && (
                    <Text style={{ fontSize: 14, color: colors.success, marginTop: 2 }}>
                      ✓ Godkendt: {empData.hoursWorked.toFixed(1)} timer
                    </Text>
                  )}
                  {isRejected && (
                    <Text style={{ fontSize: 14, color: colors.error, marginTop: 2 }}>
                      ✕ Afvist
                    </Text>
                  )}
                </View>

                {isApproved && (
                  <View style={{
                    backgroundColor: colors.successLight,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.success }}>
                      Godkendt
                    </Text>
                  </View>
                )}

                {isRejected && (
                  <View style={{
                    backgroundColor: colors.errorLight,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.error }}>
                      Afvist
                    </Text>
                  </View>
                )}
              </View>

              {isPending && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: colors.success,
                      borderRadius: 8,
                      padding: 12,
                      alignItems: 'center',
                    }}
                    onPress={() => handleApprove(event.id, empId, scheduledHours)}
                  >
                    <Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>
                      Godkend
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                      padding: 12,
                      alignItems: 'center',
                    }}
                    onPress={() => handleEdit(event.id, empId, `${employee.firstName} ${employee.lastName}`, scheduledHours)}
                  >
                    <Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>
                      Rediger
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: colors.error,
                      borderRadius: 8,
                      padding: 12,
                      alignItems: 'center',
                    }}
                    onPress={() => handleReject(event.id, empId, `${employee.firstName} ${employee.lastName}`)}
                  >
                    <Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>
                      Afvis
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>Indlæser events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text style={globalStyles.title}>Godkend Timer</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
          Gennemgå og godkend medarbejdernes arbejdstimer
        </Text>

        {events.length === 0 ? (
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: 40,
            alignItems: 'center',
          }}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.textMuted} />
            <Text style={{ marginTop: 16, fontSize: 16, color: colors.textMuted, textAlign: 'center' }}>
              Ingen events med timer til godkendelse
            </Text>
          </View>
        ) : (
          events.map(event => renderEventCard(event))
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
              Rediger Timer
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
              {selectedEntry?.employeeName}
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
              Antal timer
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.gray300,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginBottom: 16,
              }}
              value={editedHours}
              onChangeText={setEditedHours}
              keyboardType="numeric"
              placeholder="0.0"
            />

            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
              Note (valgfri)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.gray300,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginBottom: 24,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              value={editNote}
              onChangeText={setEditNote}
              placeholder="F.eks. 'Gik 1 time før'"
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.gray200,
                  borderRadius: 8,
                  padding: 14,
                  alignItems: 'center',
                }}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
                  Annuller
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  padding: 14,
                  alignItems: 'center',
                }}
                onPress={handleSaveEdit}
              >
                <Text style={{ color: colors.white, fontWeight: '600', fontSize: 16 }}>
                  Gem
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
