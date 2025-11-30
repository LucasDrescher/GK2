// Genbrugelig Card komponent
import React from 'react';
import { View } from 'react-native';
import { globalStyles } from '../styles';

export default function Card({ children, style }) {
  return (
    <View style={[globalStyles.card, style]}>
      {children}
    </View>
  );
}
