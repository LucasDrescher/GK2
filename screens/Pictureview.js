import React from 'react';
import { View, Image, Text } from 'react-native';
import { globalStyles } from '../styles';

export default function ImageScreen({ route }) {
  const { image } = route.params || {};
  return (
    <View style={globalStyles.container}>
      {image ? (
  <Image source={{ uri: image }} style={globalStyles.imageFullContain} />
      ) : (
  <Text style={globalStyles.textMuted}>Ingen billede valgt</Text>
      )}
    </View>
  );
}
