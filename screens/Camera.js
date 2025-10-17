import React, { useState, useRef } from 'react';
import { Text, TouchableOpacity, View, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraPermissions } from 'expo-camera';
import { globalStyles } from '../styles';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function CameraTest({ navigation, route }) {
  const { targetField } = route?.params || {}; // fx "passportUri", "criminalRecordUri", "workPermitUri"

  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [imagesArr, setImagesArr] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState(false);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);

  function toggleFacing() {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }

  async function snap() {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      const result = await cameraRef.current.takePictureAsync();
      setImagesArr((prev) => [...prev, result]);

      // send seneste billede tilbage til Register via params
      if (targetField) {
        // prefer explicit passportUri for compatibility, otherwise use the dynamic field
        const params = targetField === 'passportUri' ? { passportUri: result.uri } : { [targetField]: result.uri };
        // Update the existing Register route with the new params
        navigation.navigate({ name: 'Register', params, merge: true });
        // Then pop Camera from the stack so the back button won't return to Camera
        navigation.goBack();
      }
    } catch (err) {
      console.log('Snap error:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleGallery() {
    setGallery((prev) => !prev);
  }

  function zoomIn() { setZoom((prev) => (prev + 0.1 <= 1 ? prev + 0.1 : 1)); }
  function zoomOut() { setZoom((prev) => (prev - 0.1 >= 0 ? prev - 0.1 : 0)); }

  const CameraGallery = () => (
    <View style={{ padding: 10 }}>
      <Text style={globalStyles.itemText}>Billeder taget: {imagesArr.length}</Text>
      <ScrollView horizontal>
        {imagesArr.length > 0 ? (
          imagesArr.map((image, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate('Image', { image: image.uri })}
            >
              <Image source={{ uri: image.uri }} style={{ width: 80, height: 80, margin: 5 }} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={globalStyles.itemText}>No images taken</Text>
        )}
      </ScrollView>
    </View>
  );

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ marginBottom: 20, fontSize: 16 }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: 'blue' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[globalStyles.container, { padding: 0 }]}> 
      <View style={{ flex: 1, position: 'relative', backgroundColor: 'black' }}>
        <Camera
          ref={cameraRef}
          style={{ flex: 1, width: '100%' }}
          type={facing === 'back' ? Camera.Constants.Type.back : Camera.Constants.Type.front}
          zoom={zoom}
        />

        {/* Overlay controls (absolutely positioned so CameraView has no children) */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' }} pointerEvents="box-none">
          {/* Top row - gallery toggle */}
          <View style={{ alignItems: 'flex-end', padding: 16 }} pointerEvents="auto">
            <TouchableOpacity onPress={toggleGallery} style={{ padding: 8 }}>
              <Ionicons name="images-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 20 }} pointerEvents="auto">
            <TouchableOpacity onPress={toggleFacing} style={{ padding: 12 }}>
              <Ionicons name="camera-reverse-outline" size={34} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={async () => { if (!loading) await snap(); }} disabled={loading} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: loading ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' }} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity onPress={zoomIn} style={{ padding: 8 }}>
                <Ionicons name="add-outline" size={30} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={zoomOut} style={{ padding: 8 }}>
                <Ionicons name="remove-outline" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {gallery ? <CameraGallery /> : null}
      </View>
    </SafeAreaView>
  );
}
