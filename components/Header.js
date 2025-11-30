// Genbrugelig Header komponent
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles';

export default function Header({ 
  title, 
  onBackPress, 
  rightElement,
  backgroundColor = colors.primary,
  textColor = colors.white,
  style
}) {
  return (
    <View style={[{
      backgroundColor,
      padding: 20,
      paddingTop: 60,
    }, style]}>
      {onBackPress && (
        <TouchableOpacity
          onPress={onBackPress}
          style={{ marginBottom: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '700',
          color: textColor,
          flex: 1,
        }}>
          {title}
        </Text>
        {rightElement}
      </View>
    </View>
  );
}
