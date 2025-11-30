import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { rtdb } from '../../database/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { globalStyles, colors } from '../../styles';
import { FloatingActionButton, StatusBadge } from '../../components';

export default function AdminEventListScreen({ route, navigation }) {
  const { companyCode, userId } = route.params || {};
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!companyCode) return;

    const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      // sort by date then startTime if available
      list.sort((a, b) => {
        if (a.date && b.date) {
          if (a.date < b.date) return -1;
          if (a.date > b.date) return 1;
        }
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
      setEvents(list);
    });

    return () => unsubscribe();
  }, [companyCode]);

  const confirmDelete = (item) => {
    Alert.alert('Slet event', `Slet "${item.title}"?`, [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Slet', style: 'destructive', onPress: () => handleDelete(item.id) },
    ]);
  };

  const handleDelete = async (id) => {
    try {
      await remove(ref(rtdb, `companies/${companyCode}/events/${id}`));
      Alert.alert('Fjern', 'Event slettet');
    } catch (err) {
      Alert.alert('Fejl', err.message || 'Kunne ikke slette event');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Dato ukendt';
    const date = new Date(dateStr);
    return date.toLocaleDateString('da-DK', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getEventStatus = (dateStr, startTime, endTime) => {
    if (!dateStr) return 'upcoming';
    
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate > today) return 'upcoming';
    if (eventDate < today) return 'completed';
    
    // Same day - check time
    if (endTime) {
      const now = new Date();
      const [endHour, endMinute] = endTime.split(':');
      const endDateTime = new Date();
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
      
      if (now > endDateTime) return 'completed';
    }
    
    return 'ongoing';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={{
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        backgroundColor: colors.surface,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
      }}
      onPress={() => {
        navigation.getParent()?.navigate('EditEvent', { companyCode, userId, event: item, eventId: item.id });
      }}
      onLongPress={() => confirmDelete(item)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 6,
          width: '100%',
        }}
      />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="calendar" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                {item.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 4 }}>
                  {formatDate(item.date)}
                </Text>
              </View>
            </View>
          </View>
          <StatusBadge status={getEventStatus(item.date, item.startTime, item.endTime)} />
        </View>

        {item.location && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: 14, color: colors.text, marginLeft: 6 }}>
              {item.location}
            </Text>
          </View>
        )}

        {(item.startTime && item.endTime) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: 14, color: colors.text, marginLeft: 6 }}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>
        )}

        {item.assignedEmployees && Object.keys(item.assignedEmployees).length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="people-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: 14, color: colors.text, marginLeft: 6 }}>
              {Object.keys(item.assignedEmployees).length} medarbejdere
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
          Events
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </Text>
      </LinearGradient>

      {events.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="calendar-outline" size={40} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
            Ingen events endnu
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
            Opret dit første event for at komme i gang
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        />
      )}
      
      <FloatingActionButton
        onPress={() => navigation.navigate('AdminCreateEvent', { companyCode, userId })}
      />
    </View>
  );
}
