// Genbrugelig EventCard komponent
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles';
import Badge from './Badge';

export default function EventCard({ 
  event, 
  onPress,
  showEmployeeCount = true,
  badge,
  accentColor = colors.secondary
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: colors.text,
          flex: 1,
          marginRight: 8,
        }}>
          {event.title}
        </Text>
        {badge && badge}
      </View>
      
      <View style={{ marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
          <Text style={{ fontSize: 14, color: colors.textLight, marginLeft: 6 }}>
            {event.date}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="time-outline" size={16} color={colors.textLight} />
          <Text style={{ fontSize: 14, color: colors.textLight, marginLeft: 6 }}>
            {event.startTime} - {event.endTime}
          </Text>
        </View>
        
        {event.location && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="location-outline" size={16} color={colors.textLight} />
            <Text style={{ fontSize: 14, color: colors.textLight, marginLeft: 6 }}>
              {event.location}
            </Text>
          </View>
        )}
      </View>
      
      {showEmployeeCount && event.assignedEmployees && (
        <View style={{ 
          marginTop: 8, 
          paddingTop: 8, 
          borderTopWidth: 1, 
          borderTopColor: colors.gray200,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Ionicons name="people-outline" size={16} color={colors.success} />
          <Text style={{ fontSize: 14, color: colors.success, marginLeft: 6, fontWeight: '600' }}>
            {Object.keys(event.assignedEmployees).length} medarbejdere
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
