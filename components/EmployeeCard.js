// Genbrugelig EmployeeCard komponent
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles';
import Badge from './Badge';

export default function EmployeeCard({ 
  employee, 
  onPress,
  showBadge = false,
  badgeText,
  badgeVariant = 'success'
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
        borderLeftColor: colors.primary,
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: colors.text, 
            marginBottom: 4 
          }}>
            {employee.firstName} {employee.lastName}
          </Text>
          {employee.email && (
            <Text style={{ fontSize: 14, color: colors.textLight }}>
              {employee.email}
            </Text>
          )}
          {employee.phoneNumber && (
            <Text style={{ fontSize: 14, color: colors.textLight, marginTop: 2 }}>
              📱 {employee.phoneNumber}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {showBadge && badgeText && (
            <Badge text={badgeText} variant={badgeVariant} />
          )}
          <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
