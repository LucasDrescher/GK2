import React from 'react';
import { View, Image, Text } from 'react-native';
import { globalStyles } from '../styles';

export default function ImageScreen({ route }) {
  const { image } = route.params || {};
  return (
    <View style={globalStyles.container}>
      {image ? (
        <Image source={{ uri: image }} style={{ width: '100%', height: 400, resizeMode: 'contain' }} />
      ) : (
        <Text style={{ color: '#333' }}>Ingen billede valgt</Text>
      )}
    </View>
  );
}
