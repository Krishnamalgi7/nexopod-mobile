import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "@/config/api";
import {
  ArrowRight,
  CalendarDays,
  Zap,
  ChartNoAxesColumnIncreasing,
  Store,
} from "lucide-react-native";

type Role = "customer" | "shopOwner";

const roles = [
  {
    id: "customer" as Role,
    title: "I'm a User",
    description:
      "Discover nearby stores, book phone charging and use store services.",
    features: [
      { label: "Phone Charging", Icon: Zap },
      { label: "Pick Me Later", Icon: CalendarDays },
    ],
    image: require("../../../assets/images/onboarding/user.png"),
  },
  {
    id: "shopOwner" as Role,
    title: "I'm a Shop Owner",
    description: "Manage your store, services, bookings and customer requests.",
    features: [
      { label: "Store Dashboard", Icon: ChartNoAxesColumnIncreasing },
      { label: "Manage Bookings", Icon: CalendarDays },
    ],
    image: require("../../../assets/images/onboarding/shopowner.png"),
  },
];

export default function SelectRoleScreen() {
  const router = useRouter();
  const { selectionToken } = useLocalSearchParams<{
    selectionToken?: string;
  }>();

  const [selectedRole, setSelectedRole] = useState<Role>("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!selectionToken) {
      setError("Your session has expired. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/role-auth/select-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectionToken,
            role: selectedRole,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to continue. Please try again.");
        return;
      }

      if (result.data.role === "customer") {
        await SecureStore.setItemAsync("customerToken", result.data.token);

        router.replace(
          result.data.customer.name?.trim()
            ? "/user/home"
            : "/user/complete-profile",
        );
        return;
      }

      if (result.data.role === "shopOwner") {
        await SecureStore.setItemAsync("shopOwnerToken", result.data.token);

        router.replace(
          result.data.store.isActive
            ? "/shopowner/dashboard"
            : "/shopowner/profile",
        );
        return;
      }

      setError("Unable to identify your account role.");
    } catch (error) {
      console.error(
        "[RoleSelection] Request failed:",
        error instanceof Error ? error.message : "Unknown error",
      );

      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-5 pb-6 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center">
          <Text className="text-[30px] font-extrabold tracking-tight text-[#142D46]">
            Nexo<Text className="text-[#00BFA5]">Pod</Text>
          </Text>

          <Text className="mt-9 text-center text-[29px] font-extrabold text-[#142D46]">
            Choose Your Role
          </Text>

          <Text className="mt-2 text-center text-base text-[#64748B]">
            How would you like to use NexoPod?
          </Text>
        </View>

        {/* Role Cards */}
        <View className="mt-9 gap-5">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;

            return (
              <Pressable
                key={role.id}
                onPress={() => {
                  setSelectedRole(role.id);
                  setError("");
                }}
                disabled={loading}
                className={`flex-row items-center rounded-[24px] border p-3 ${
                  isSelected
                    ? "border-2 border-[#00BFA5] bg-[#F4FFFC]"
                    : "border border-[#DDECEF] bg-white"
                }`}
              >
                {/* Role Image */}
                <View className="h-[150px] w-[37%] items-center justify-center overflow-hidden rounded-[18px] bg-[#E4F7F3]">
                  <Image
                    source={role.image}
                    resizeMode="contain"
                    className="h-full w-full"
                  />
                </View>

                {/* Role Details */}
                <View className="ml-3 flex-1 py-2">
                  <View className="flex-row items-start justify-between">
                    <Text className="mr-2 flex-1 text-[17px] font-extrabold text-[#142D46]">
                      {role.title}
                    </Text>

                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                        isSelected ? "border-[#00BFA5]" : "border-[#64748B]"
                      }`}
                    >
                      {isSelected ? (
                        <View className="h-3 w-3 rounded-full bg-[#00BFA5]" />
                      ) : null}
                    </View>
                  </View>

                  <Text className="mt-2 text-[12px] leading-[19px] text-[#526477]">
                    {role.description}
                  </Text>

                  <View className="mt-3 gap-2">
                    {role.features.map(({ label, Icon }) => (
                      <View key={label} className="flex-row items-center">
                        <Icon size={17} color="#00A98F" />
                        <Text className="ml-2 text-[11px] font-semibold text-[#334155]">
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Error */}
        {error ? (
          <Text className="mt-4 text-center text-sm font-medium text-red-500">
            {error}
          </Text>
        ) : null}

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          disabled={loading}
          className="mt-9 h-[62px] flex-row items-center justify-center rounded-[20px] bg-[#00A98F]"
          style={{
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text className="text-lg font-bold text-white">Continue</Text>
              <ArrowRight size={25} color="#FFFFFF" className="ml-3" />
            </>
          )}
        </Pressable>

        <Text className="mt-5 text-center text-xs text-[#94A3B8]">
          Your account and information are secure with us.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
