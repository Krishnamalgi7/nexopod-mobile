
import { Platform } from "react-native";
import * as Device from "expo-device";

export const API_BASE_URL =
  Platform.OS === "android" && !Device.isDevice
    ? "http://10.0.2.2:5000"
    : "http://192.168.1.103:5000";