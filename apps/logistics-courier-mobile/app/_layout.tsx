import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return <SafeAreaProvider><StatusBar style="light"/><Stack screenOptions={{headerStyle:{backgroundColor:"#07110E"},headerTintColor:"#fff",headerShadowVisible:false,contentStyle:{backgroundColor:"#07110E"}}}><Stack.Screen name="index" options={{headerShown:false}}/><Stack.Screen name="auth/callback" options={{headerShown:false}}/></Stack></SafeAreaProvider>;
}
