import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { rtdb } from "../../database/firebase";
import { ref, onValue } from "firebase/database";
import { globalStyles, colors } from "../../styles";

export default function AdminEventPlanScreen({ route, navigation }) {
  const { companyCode, userId } = route.params || {};
  
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState("list"); // "list" eller "week"

  useEffect(() => {
    if (!companyCode) return;
    
    const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      setEvents(data || {});
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyCode]);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('da-DK', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getNext7Days = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    return Object.entries(events).filter(([id, event]) => {
      return event.date === dateStr;
    });
  };

  // Dag-visning med tidsplan
  const renderDayView = () => {
    const today = new Date();
    const todayEvents = getEventsForDate(today);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourHeight = 80;

    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16, backgroundColor: colors.primary }}>
          <Text style={{ color: colors.white, fontSize: 18, fontWeight: '700' }}>
            {formatDateDisplay(today)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
          <View style={{ width: 60, paddingTop: 0 }}>
            {hours.map(hour => (
              <View key={hour} style={{ height: hourHeight, justifyContent: 'flex-start' }}>
                <Text style={{ fontSize: 12, color: '#666', fontWeight: '500' }}>
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          <View style={{ flex: 1, position: 'relative', borderLeftWidth: 2, borderLeftColor: '#E0E0E0' }}>
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

            {todayEvents.length === 0 ? (
              <View style={{ position: 'absolute', top: 200, left: 0, right: 0, alignItems: 'center' }}>
                <Text style={{ color: '#999', fontSize: 14 }}>Ingen events i dag</Text>
              </View>
            ) : (
              todayEvents.map(([eventId, event]) => {
                const startMinutes = timeToMinutes(event.startTime);
                const endMinutes = timeToMinutes(event.endTime);
                const durationMinutes = endMinutes - startMinutes;
                const topPosition = (startMinutes / 60) * hourHeight;
                const blockHeight = Math.max((durationMinutes / 60) * hourHeight, 60);

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
                    onPress={() => navigation.getParent()?.navigate('EditEvent', { companyCode, userId, event, eventId })}
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

  // 7-dages oversigt
  const renderWeekView = () => {
    const next7Days = getNext7Days(currentWeek);

    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        }}>
          <TouchableOpacity
            style={{ 
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.primary,
              borderRadius: 8
            }}
            onPress={() => {
              const prevWeek = new Date(currentWeek);
              prevWeek.setDate(currentWeek.getDate() - 7);
              setCurrentWeek(prevWeek);
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '600' }}>◀ Forrige</Text>
          </TouchableOpacity>
          
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            7-dages oversigt
          </Text>
          
          <TouchableOpacity
            style={{ 
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.primary,
              borderRadius: 8
            }}
            onPress={() => {
              const nextWeek = new Date(currentWeek);
              nextWeek.setDate(currentWeek.getDate() + 7);
              setCurrentWeek(nextWeek);
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '600' }}>Næste ▶</Text>
          </TouchableOpacity>
        </View>

        {next7Days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isToday = formatDate(day) === formatDate(new Date());
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          
          return (
            <View key={index} style={{
              backgroundColor: isWeekend ? '#F5F5F5' : colors.white,
              marginVertical: 4,
              marginHorizontal: 8,
              borderRadius: 12,
              borderLeftWidth: isToday ? 4 : 0,
              borderLeftColor: isToday ? colors.primary : 'transparent',
              overflow: 'hidden'
            }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                backgroundColor: isToday ? colors.primaryLight : colors.gray50
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: isToday ? colors.primary : colors.text
                }}>
                  {isToday ? '📍 ' : ''}{formatDateDisplay(day)}
                </Text>
                <TouchableOpacity
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onPress={() => navigation.navigate('AdminCreateEvent', { companyCode })}
                >
                  <Text style={{ color: colors.white, fontSize: 20, fontWeight: '600' }}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={{ padding: 12 }}>
                {dayEvents.length === 0 ? (
                  <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 8 }}>
                    Ingen events
                  </Text>
                ) : (
                  dayEvents.map(([eventId, event]) => (
                    <TouchableOpacity
                      key={eventId}
                      style={{
                        backgroundColor: '#E8F5E9',
                        borderLeftWidth: 4,
                        borderLeftColor: '#4CAF50',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8
                      }}
                      onPress={() => navigation.getParent()?.navigate('EditEvent', { companyCode, userId, event, eventId })}
                    >
                      <Text style={{ color: '#1B5E20', fontWeight: '700', fontSize: 14 }}>
                        {event.title}
                      </Text>
                      <Text style={{ color: '#2E7D32', fontSize: 12, marginTop: 4 }}>
                        {event.startTime} - {event.endTime}
                      </Text>
                      {event.location && (
                        <Text style={{ color: '#388E3C', fontSize: 12, marginTop: 2 }}>
                          📍 {event.location}
                        </Text>
                      )}
                      {event.assignedEmployees && Object.keys(event.assignedEmployees).length > 0 && (
                        <Text style={{ color: '#555', fontSize: 12, marginTop: 2 }}>
                          👥 {Object.keys(event.assignedEmployees).length} medarbejdere
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 10, color: colors.textSecondary }}>Indlæser events…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 24,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Text style={{ 
          fontSize: 32, 
          fontWeight: '800', 
          color: colors.white,
          marginBottom: 12,
        }}>
          Kalender
        </Text>
        
        {/* View Mode Toggle */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: viewMode === 'list' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
            }}
            onPress={() => setViewMode('list')}
          >
            <Text style={{ 
              fontWeight: '600',
              color: colors.white
            }}>
              I dag
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: viewMode === 'week' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
            }}
            onPress={() => setViewMode('week')}
          >
            <Text style={{ 
              fontWeight: '600',
              color: colors.white
            }}>
              Uge
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: viewMode === 'month' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
            }}
            onPress={() => setViewMode('month')}
          >
            <Text style={{ 
              fontWeight: '600',
              color: colors.white
            }}>
              Måned
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }}>
        {viewMode === 'list' && renderListView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </ScrollView>
    </View>
  );
}
