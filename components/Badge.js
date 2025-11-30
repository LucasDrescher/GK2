// Genbrugelig Badge komponent
import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../styles';

export default function Badge({ 
  text, 
  variant = 'primary', 
  icon,
  style 
}) {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#E8F5E9', text: '#4CAF50' };
      case 'warning':
        return { bg: '#FEF3C7', text: '#F59E0B' };
      case 'error':
        return { bg: '#FFEBEE', text: '#EF4444' };
      case 'info':
        return { bg: '#E3F2FD', text: '#3B82F6' };
      default:
        return { bg: colors.primaryLight + '30', text: colors.primary };
    }
  };

  const badgeColors = getColors();

  return (
    <View style={[{
      backgroundColor: badgeColors.bg,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    }, style]}>
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text style={{ 
        fontSize: 12, 
        fontWeight: '600', 
        color: badgeColors.text 
      }}>
        {text}
      </Text>
    </View>
  );
}
