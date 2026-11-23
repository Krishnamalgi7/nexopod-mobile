import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";

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

export default function LoginScreen() {
  const router = useRouter();

  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [otpRequested, setOtpRequested] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // 1. Request a new OTP from the backend.
  const handleSendOtp = async () => {
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 2. Request OTP for the registered store number.
      const response = await fetch(`${API_BASE_URL}/api/shop-owners/send-otp`, {
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

      // 3. Start a fresh two-minute OTP session.
      setOtpRequested(true);
      setOtp("");
      setSecondsRemaining(result.data.expiresIn || 120);

      console.log("[ShopOwner] OTP request successful.");
    } catch (error) {
      // 4. Display the actual network error for debugging.
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error("[ShopOwner] OTP request failed:", errorMessage);

      setError(`Connection failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Update the OTP countdown every second.
  useEffect(() => {
    if (!otpRequested || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpRequested, secondsRemaining]);

  // 5. Format the remaining OTP validity time.
  const formattedTime = `${Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, "0")}:${(secondsRemaining % 60).toString().padStart(2, "0")}`;

  // Login function to handle user authentication and navigation to the dashboard.
  // 1. Validate the login inputs.
  const handleLogin = async () => {
    // 1. Ensure an OTP has been requested and is still valid.
    if (!otpRequested || secondsRemaining <= 0) {
      setError("OTP expired. Please request a new OTP.");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^[0-9]{4}$/.test(otp)) {
      setError("Enter a valid 4-digit OTP.");
      return;
    }

    // 2. Start the login request.
    setLoading(true);
    setError("");

    try {
      // 3. Send credentials to the Shop Owner login API.
      const response = await fetch(`${API_BASE_URL}/api/shop-owners/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: mobileNumber,
          otp,
        }),
      });

      // 4. Read the API response.
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Login failed. Please try again.");
        return;
      }

      // 5. Securely save the authentication token.
      await SecureStore.setItemAsync("shopOwnerToken", result.data.token);

      router.replace(result.data.store.isActive ? "/dashboard" : "/profile");
    } catch (error) {
      console.error(
        "[ShopOwner] Login request failed:",
        error instanceof Error ? error.message : "Unknown error",
      );

      setError("Unable to connect to the server. Please try again.");
    } finally {
      // 7. Stop the loading state.
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
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Display the NexoPod branding at the top. */}
          <View className="mb-6 items-center">
            <Text className="text-[34px] font-extrabold tracking-tight text-[#073B4C]">
              Nexo<Text className="text-[#00B894]">Pod</Text>
            </Text>

            <Text className="mt-5 text-2xl font-bold text-[#073B4C]">
              Shop Owner Login
            </Text>

            <Text className="mt-2 text-sm text-[#718096]">
              Welcome back! Sign in to manage your store.
            </Text>
          </View>

          {/* 3. Display the login form panel. */}
          <View className="rounded-[28px] border border-[#DCEFE8] bg-white p-5 shadow-lg">
            <Text className="mb-2 text-sm font-semibold text-[#244B5A]">
              Mobile Number
            </Text>

            <View className="mb-6 h-[58px] flex-row items-center rounded-2xl border border-[#DCE9E5] bg-[#FBFFFD] px-4">
              <Smartphone size={21} color="#00B894" />

              <Text className="ml-3 text-base font-bold text-[#073B4C]">
                +91
              </Text>

              <View className="mx-3 h-8 w-px bg-[#DCE9E5]" />

              <TextInput
                value={mobileNumber}
                onChangeText={(value) => {
                  setMobileNumber(value.replace(/[^0-9]/g, "").slice(0, 10));

                  // Reset OTP when the phone number changes.
                  setOtpRequested(false);
                  setOtp("");
                  setSecondsRemaining(0);

                  setError("");
                }}
                placeholder="Enter mobile number"
                placeholderTextColor="#9AA9B8"
                keyboardType="number-pad"
                maxLength={10}
                className="flex-1 text-base text-[#073B4C]"
              />
            </View>

            {/* 7. Show OTP input after successfully requesting OTP. */}
            {otpRequested && (
              <>
                <Text className="mb-2 text-sm font-semibold text-[#244B5A]">
                  One-Time Password
                </Text>

                <View className="mb-3 h-[58px] flex-row items-center rounded-2xl border border-[#DCE9E5] bg-[#FBFFFD] px-4">
                  <LockKeyhole size={21} color="#00B894" />

                  <TextInput
                    value={otp}
                    onChangeText={(value) =>
                      setOtp(value.replace(/[^0-9]/g, "").slice(0, 4))
                    }
                    placeholder="Enter 4-digit OTP"
                    placeholderTextColor="#9AA9B8"
                    keyboardType="number-pad"
                    maxLength={4}
                    className="ml-3 flex-1 text-base tracking-[5px] text-[#073B4C]"
                  />
                </View>

                <View className="mb-6 flex-row items-center justify-between">
                  {secondsRemaining > 0 ? (
                    <Text className="text-sm text-[#64748B]">
                      OTP expires in{" "}
                      <Text className="font-bold text-[#00A985]">
                        {formattedTime}
                      </Text>
                    </Text>
                  ) : (
                    <Text className="text-sm font-medium text-red-500">
                      OTP expired
                    </Text>
                  )}

                  {secondsRemaining <= 0 && (
                    <Pressable onPress={handleSendOtp} disabled={loading}>
                      <Text className="text-sm font-bold text-[#00A985]">
                        Resend OTP
                      </Text>
                    </Pressable>
                  )}
                </View>
              </>
            )}

            {/* 8. Display the authentication button. */}
            <Pressable
              onPress={otpRequested ? handleLogin : handleSendOtp}
              disabled={loading || (otpRequested && secondsRemaining <= 0)}
              className={`h-[58px] items-center justify-center rounded-2xl bg-[#00B894] shadow-md ${
                loading ? "opacity-60" : "active:opacity-80"
              }`}
            >
              <Text className="text-lg font-bold tracking-wide text-white">
                {loading
                  ? otpRequested
                    ? "Verifying..."
                    : "Sending OTP..."
                  : otpRequested
                    ? "Verify & Login"
                    : "Send OTP"}
              </Text>
            </Pressable>

            {/* 11. Display login or OTP request errors. */}
            {error ? (
              <Text className="mt-3 text-center text-sm text-red-500">
                {error}
              </Text>
            ) : null}
          </View>

          {/* 5. Display secure access information. */}
          <View className="mt-7 flex-row items-center justify-center gap-2">
            <ShieldCheck size={19} color="#00A985" />

            <Text className="text-sm font-medium text-[#718096]">
              Secure Shop Owner Access
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
