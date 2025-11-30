import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { rtdb } from "../database/firebase";
import { ref, onValue } from "firebase/database";
import { globalStyles, colors } from "../styles";
import { Ionicons } from "@expo/vector-icons";

export default function EmployeeOverviewScreen({ route, navigation }) {
  const { userId, companyCode } = route.params || {};
  const [employee, setEmployee] = useState(null);
  const [myEvents, setMyEvents] = useState([]);

  useEffect(() => {
    if (!userId || !companyCode) return;

    // Hent medarbejder-data
    const empRef = ref(rtdb, `companies/${companyCode}/employees/${userId}`);
    onValue(empRef, (snapshot) => {
      const empData = snapshot.val();
      if (empData) {
        setEmployee(empData);

        // Hent events hvor medarbejderen er tilknyttet
        const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
        onValue(eventsRef, (snap) => {
          const eventData = snap.val();
          if (eventData) {
            const arr = Object.entries(eventData).map(([id, e]) => ({
              id,
              ...e,
            }));

            // Filtrer events hvor medarbejderen er tildelt
            const filtered = arr.filter(event => {
              return event.assignedEmployees && event.assignedEmployees[userId];
            });

            // Sorter efter dato
            filtered.sort((a, b) => {
              if (a.date && b.date) {
                if (a.date < b.date) return -1;
                if (a.date > b.date) return 1;
              }
              return (a.startTime || '').localeCompare(b.startTime || '');
            });

            setMyEvents(filtered);
          }
        });
      }
    });
  }, [userId, companyCode]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Dato ukendt';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('da-DK', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getEventStatus = (dateStr, startTime, endTime) => {
    if (!dateStr) return 'upcoming';
    
    const now = new Date();
    const [year, month, day] = dateStr.split('-');
    const eventDate = new Date(year, month - 1, day);
    
    // Reset tid til midnat for datsammenligning
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    if (eventDateOnly > today) {
      return 'upcoming';
    } else if (eventDateOnly < today) {
      return 'completed';
    } else {
      // Samme dag - tjek tid
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      if (startTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        
        if (currentTime < startMinutes) {
          return 'upcoming';
        }
      }
      
      if (endTime) {
        const [endHour, endMin] = endTime.split(':').map(Number);
        const endMinutes = endHour * 60 + endMin;
        
        if (currentTime > endMinutes) {
          return 'completed';
        }
      }
      
      return 'ongoing';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'Kommende', color: '#2196F3', icon: 'time-outline' },
      ongoing: { text: 'I gang', color: '#4CAF50', icon: 'radio-button-on' },
      completed: { text: 'Afsluttet', color: '#9E9E9E', icon: 'checkmark-circle' }
    };
    return badges[status] || badges.upcoming;
  };

  const renderEvent = ({ item }) => {
    const status = getEventStatus(item.date, item.startTime, item.endTime);
    const badge = getStatusBadge(status);
    
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
          borderLeftColor: badge.color,
        }}
        onPress={() => navigation.navigate('EventDetail', {
          eventId: item.id,
          companyCode,
          userId,
        })}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, flex: 1, marginRight: 12 }}>
            {item.title || 'Event'}
          </Text>
          <View style={{
            backgroundColor: badge.color + '20',
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: badge.color,
              marginRight: 6,
            }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: badge.color }}>
              {badge.text}
            </Text>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              backgroundColor: colors.primary + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10,
            }}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
              {formatDate(item.date)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              backgroundColor: colors.secondary + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10,
            }}>
              <Ionicons name="time-outline" size={16} color={colors.secondary} />
            </View>
            <Text style={{ fontSize: 15, color: colors.text }}>
              {item.startTime || '00:00'} - {item.endTime || '00:00'}
            </Text>
          </View>

          {item.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16, 
                backgroundColor: '#4CAF50' + '15',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
              }}>
                <Ionicons name="location-outline" size={16} color={'#4CAF50'} />
              </View>
              <Text style={{ fontSize: 15, color: colors.text }}>
                {item.location}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView style={{ flex: 1 }}>
        {/* Gradient Header */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 20,
            paddingBottom: 32,
            paddingHorizontal: 16,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text style={{ 
            fontSize: 32, 
            fontWeight: '800', 
            color: colors.white,
            marginBottom: 4,
          }}>
            Overblik
          </Text>
          {employee && (
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
              Velkommen, {employee.firstName}
            </Text>
          )}
        </LinearGradient>

        {/* Events sektion */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
              Dine events
            </Text>
            {myEvents.length > 0 && (
              <View style={{
                backgroundColor: colors.primary + '20',
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                  {myEvents.length}
                </Text>
              </View>
            )}
          </View>
          
          {myEvents.length === 0 ? (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 48,
              alignItems: 'center',
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.gray100,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textMuted }}>
                Ingen events
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                Du er ikke tildelt nogen events endnu
              </Text>
            </View>
          ) : (
            <FlatList
              data={myEvents}
              keyExtractor={(item) => item.id}
              renderItem={renderEvent}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
