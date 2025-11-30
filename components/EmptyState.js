// Genbrugelig EmptyState komponent
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles';

export default function EmptyState({ 
  icon = 'folder-open-outline', 
  title = 'Ingen data', 
  message,
  action 
}) {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingVertical: 60,
      paddingHorizontal: 20,
    }}>
      <Ionicons name={icon} size={80} color={colors.gray300} />
      <Text style={{ 
        fontSize: 20, 
        fontWeight: '600', 
        color: colors.text, 
        marginTop: 16,
        marginBottom: 8,
      }}>
        {title}
      </Text>
      {message && (
        <Text style={{ 
          fontSize: 15, 
          color: colors.textLight, 
          textAlign: 'center',
          marginBottom: 20,
        }}>
          {message}
        </Text>
      )}
      {action}
    </View>
  );
}
