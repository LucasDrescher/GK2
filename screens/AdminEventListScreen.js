import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { rtdb } from '../database/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { globalStyles } from '../styles';

export default function AdminEventListScreen({ route, navigation }) {
  const { companyCode } = route.params || {};
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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[globalStyles.shiftCard, { marginHorizontal: 16 }]}
      onPress={() => navigation.navigate('EditEvent', { companyCode, event: item, eventId: item.id })}
      onLongPress={() => confirmDelete(item)}
    >
      <View style={{ flex: 1 }}>
        <Text style={globalStyles.shiftArea}>{item.title}</Text>
        <Text style={globalStyles.shiftContact}>{item.date || 'Dato ukendt'}</Text>
        {item.location ? <Text style={globalStyles.shiftEmployees}>{item.location}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <Text style={globalStyles.title}>Events</Text>

      {events.length === 0 ? (
        <View style={globalStyles.center}>
          <Text>Ingen events fundet</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}
