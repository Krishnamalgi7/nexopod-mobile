
import { useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserRound, ShieldCheck } from "lucide-react-native";
import { API_BASE_URL } from "../../config/api";

export default function CompleteProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("Name must be between 2 and 100 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await SecureStore.getItemAsync("customerToken");

      if (!token) {
        setError("Session expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/customers/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to save your profile.");
        return;
      }

      router.replace("/user/home");
    } catch (error) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F0FFFA]" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-9 items-center">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-[#D9F8EF]">
              <UserRound size={38} color="#00BFA5" />
            </View>

            <Text className="mt-7 text-center text-3xl font-bold text-[#142D46]">
              Let's get to know you!
            </Text>

            <Text className="mt-3 text-center text-base leading-6 text-[#7B8798]">
              What should we call you? Enter your name to complete your profile.
            </Text>
          </View>

          <View className="rounded-3xl border border-[#E7EDF1] bg-white p-5">
            <Text className="mb-2 text-sm font-semibold text-[#142D46]">
              Your Name
            </Text>

            <View className="flex-row items-center rounded-xl border border-[#E7EDF1] bg-[#F8FAFB] px-4">
              <UserRound size={19} color="#00BFA5" />
              <TextInput
                className="h-14 flex-1 px-3 text-base text-[#142D46]"
                placeholder="Enter your full name"
                placeholderTextColor="#A0AAB5"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setError("");
                }}
                maxLength={100}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {error ? (
              <Text className="mt-3 text-sm text-red-500">{error}</Text>
            ) : null}

            <Pressable
              onPress={handleSaveProfile}
              disabled={loading}
              className={`mt-7 h-14 items-center justify-center rounded-xl ${
                loading ? "bg-[#80DCCF]" : "bg-[#00BFA5]"
              }`}
            >
              <Text className="text-base font-bold text-white">
                {loading ? "Saving..." : "Complete Profile"}
              </Text>
            </Pressable>
          </View>

          <View className="mt-7 flex-row items-center justify-center">
            <ShieldCheck size={17} color="#00BFA5" />
            <Text className="ml-2 text-xs text-[#7B8798]">
              Your information is safe and secure
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
