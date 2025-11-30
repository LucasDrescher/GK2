// Genbrugelig Loading komponent
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { globalStyles, colors } from '../styles';

export default function Loading({ message = 'Indlæser...' }) {
  return (
    <View style={globalStyles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={[globalStyles.textLight, { marginTop: 16 }]}>
          {message}
        </Text>
      )}
    </View>
  );
}
