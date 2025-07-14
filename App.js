
import React, { useState, useEffect } from "react";
import { View, Text, Button, Image, ActivityIndicator, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Camera } from "expo-camera";

export default function App() {
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Erro", "Permissão para usar a câmera foi negada.");
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      processOCR(result.assets[0].uri);
    }
  };

  const processOCR = async (imageUri) => {
    setLoading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const response = await fetch("https://seu-backend.com/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await response.json();
      const texto = data.text;
      setOcrText(texto);
      buscarCotacao(texto);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao processar OCR.");
    } finally {
      setLoading(false);
    }
  };

  const buscarCotacao = async (texto) => {
    const regex = /(\w[\w\s\-']+)\s(\d+\/\d+)/;
    const match = texto.match(regex);
    if (!match) return;

    const nome = encodeURIComponent(match[1].trim());
    const numero = encodeURIComponent(match[2]);

    try {
      const url = `https://seu-backend.com/cotacao?nome=${nome}&numero=${numero}`;
      const res = await fetch(url);
      const json = await res.json();
      setPrice(json.price);
    } catch (e) {
      Alert.alert("Erro", "Falha ao buscar cotação.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Cotador de Cartas Pokémon</Text>
      <Button title="Fotografar Carta" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={{ width: 300, height: 200, marginVertical: 20 }} />}
      {loading && <ActivityIndicator size="large" color="blue" />}
      {ocrText ? <Text style={{ marginTop: 10 }}>Texto detectado: {ocrText}</Text> : null}
      {price && <Text style={{ marginTop: 20, fontSize: 18, fontWeight: "bold" }}>Cotação: R$ {price}</Text>}
    </ScrollView>
  );
}
