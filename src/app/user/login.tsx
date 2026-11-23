import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../../config/api";

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LockKeyhole, Smartphone, ShieldCheck } from "lucide-react-native";

export default function UserLoginScreen() {
  const router = useRouter();

  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const handleSendOtp = async () => {
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: mobileNumber }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to send OTP.");
        return;
      }

      setOtpRequested(true);
      setOtp("");
      setSecondsRemaining(result.data.expiresIn || 120);
    } catch (error) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!otpRequested || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpRequested, secondsRemaining]);

  const formattedTime = `${Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, "0")}:${(secondsRemaining % 60).toString().padStart(2, "0")}`;

  const handleLogin = async () => {
    if (!otpRequested || secondsRemaining <= 0) {
      setError("OTP expired. Please request a new OTP.");
      return;
    }

    if (!/^[0-9]{4}$/.test(otp)) {
      setError("Enter a valid 4-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: mobileNumber,
          otp,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Login failed. Please try again.");
        return;
      }

      await SecureStore.setItemAsync("customerToken", result.data.token);

      if (!result.data.customer.name?.trim()) {
        router.replace("/user/complete-profile");
      } else {
        router.replace("/user/home");
      }
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
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-start px-6 pt-10 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1">
            <View className="mb-10">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#D9F8EF]">
                <Smartphone size={28} color="#00BFA5" />
              </View>

              <Text className="mt-8 text-3xl font-bold text-[#142D46]">
                Welcome to NexoPod
              </Text>
              <Text className="mt-3 text-base leading-6 text-[#7B8798]">
                Discover stores, explore services and manage all your bookings
                in one place.
              </Text>
            </View>

            <View className="rounded-3xl border border-[#E7EDF1] bg-white p-5">
              <Text className="text-xl font-bold text-[#142D46]">
                {otpRequested ? "Verify your number" : "Login or Sign Up"}
              </Text>

              <Text className="mt-2 text-sm text-[#7B8798]">
                {otpRequested
                  ? `Enter the OTP sent to +91 ${mobileNumber}`
                  : "Enter your mobile number to continue"}
              </Text>

              <Text className="mb-2 mt-7 text-sm font-semibold text-[#142D46]">
                Mobile Number
              </Text>

              <View className="flex-row items-center rounded-xl border border-[#E7EDF1] bg-[#F8FAFB] px-4">
                <Text className="mr-3 text-base font-semibold text-[#142D46]">
                  +91
                </Text>
                <TextInput
                  className="h-14 flex-1 text-base text-[#142D46]"
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#A0AAB5"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={mobileNumber}
                  onChangeText={(value) => {
                    setMobileNumber(value.replace(/[^0-9]/g, ""));
                    setError("");
                  }}
                  editable={!otpRequested && !loading}
                />
              </View>

              {otpRequested && (
                <>
                  <Text className="mb-2 mt-6 text-sm font-semibold text-[#142D46]">
                    One-Time Password
                  </Text>

                  <View className="flex-row items-center rounded-xl border border-[#E7EDF1] bg-[#F8FAFB] px-4">
                    <LockKeyhole size={19} color="#00BFA5" />
                    <TextInput
                      className="h-14 flex-1 px-3 text-lg tracking-[8px] text-[#142D46]"
                      placeholder="Enter OTP"
                      placeholderTextColor="#A0AAB5"
                      keyboardType="number-pad"
                      maxLength={4}
                      value={otp}
                      onChangeText={(value) => {
                        setOtp(value.replace(/[^0-9]/g, ""));
                        setError("");
                      }}
                    />
                  </View>

                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-xs text-[#7B8798]">
                      {secondsRemaining > 0
                        ? `OTP expires in ${formattedTime}`
                        : "OTP expired"}
                    </Text>

                    <Pressable
                      onPress={handleSendOtp}
                      disabled={loading || secondsRemaining > 0}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          secondsRemaining > 0 || loading
                            ? "text-[#A0AAB5]"
                            : "text-[#00BFA5]"
                        }`}
                      >
                        Resend OTP
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              {error ? (
                <Text className="mt-4 text-sm text-red-500">{error}</Text>
              ) : null}

              <Pressable
                onPress={otpRequested ? handleLogin : handleSendOtp}
                disabled={loading}
                className={`mt-7 h-14 items-center justify-center rounded-xl ${
                  loading ? "bg-[#80DCCF]" : "bg-[#00BFA5]"
                }`}
              >
                <Text className="text-base font-bold text-white">
                  {loading
                    ? "Please wait..."
                    : otpRequested
                      ? "Verify & Continue"
                      : "Continue"}
                </Text>
              </Pressable>

              {otpRequested && (
                <Pressable
                  onPress={() => {
                    setOtpRequested(false);
                    setOtp("");
                    setSecondsRemaining(0);
                    setError("");
                  }}
                  className="mt-4 items-center"
                >
                  <Text className="text-sm font-semibold text-[#00BFA5]">
                    Change mobile number
                  </Text>
                </Pressable>
              )}
            </View>

            <View className="mt-7 flex-row items-center justify-center">
              <ShieldCheck size={17} color="#00BFA5" />
              <Text className="ml-2 text-xs text-[#7B8798]">
                Your mobile number is safe and secure with us
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
