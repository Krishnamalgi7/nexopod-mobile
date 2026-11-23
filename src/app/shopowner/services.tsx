import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";
import { Zap, Package } from "lucide-react-native";

import { API_BASE_URL } from "@/config/api";
import Loader from "@/components/common/Loader";
import RefreshableScrollView from "@/components/common/RefreshableScrollView";

type StoreService = "Phone Charging" | "Pick Me Later";

interface StoreData {
  services: StoreService[];
}

export default function ServicesScreen() {
  const router = useRouter();

  const [services, setServices] = useState<StoreService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchServices = useCallback(async () => {
    try {
      setError("");

      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/shop-owners/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to fetch services.");
      }

      const store: StoreData = result.data.store || result.data;
      setServices(store.services || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const handleToggleService = (serviceName: StoreService, enabled: boolean) => {
    const action = enabled ? "enable" : "disable";

    Alert.alert(
      `${enabled ? "Enable" : "Disable"} ${serviceName}?`,
      `Are you sure you want to ${action} this service?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => {
            setServices((previous) =>
              enabled
                ? [...previous, serviceName]
                : previous.filter((service) => service !== serviceName),
            );

            setError("");
            setSuccess("");
          },
        },
      ],
    );
  };

  const handleSaveServices = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/shop-owners/services`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ services }),
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/auth/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update services.");
      }

      setServices(result.data.services || []);
      setSuccess("Services updated successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update services.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <RefreshableScrollView
        className="flex-1"
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-8 pt-5">
          <Text className="text-2xl font-bold text-[#123D4A]">My Services</Text>

          <Text className="mt-1 text-sm text-[#64748B]">
            View the services currently offered by your store.
          </Text>

          {error ? (
            <View className="mt-5 rounded-xl bg-red-50 p-4">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View className="mt-5 rounded-xl bg-[#E6F7F2] p-4">
              <Text className="text-sm font-semibold text-[#008F70]">
                {success}
              </Text>
            </View>
          ) : null}

          <View className="mt-7 gap-4">
            {(
              [
                {
                  name: "Phone Charging",
                  description:
                    "Allow customers to charge their phones at your store.",
                  icon: Zap,
                },
                {
                  name: "Pick Me Later",
                  description:
                    "Allow customers to store their phones and collect them later.",
                  icon: Package,
                },
              ] as const
            ).map((service) => {
              const Icon = service.icon;
              const isEnabled = services.includes(service.name);

              return (
                <View
                  key={service.name}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-5"
                >
                  <View className="flex-row items-center">
                    <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#E6F7F2]">
                      <Icon size={23} color="#00B894" />
                    </View>

                    <View className="ml-4 flex-1">
                      <Text className="text-base font-bold text-[#123D4A]">
                        {service.name}
                      </Text>

                      <Text className="mt-1 text-sm leading-5 text-[#64748B]">
                        {service.description}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-5 flex-row items-center justify-between border-t border-[#F1F5F9] pt-4">
                    <View>
                      <Text className="text-sm font-medium text-[#123D4A]">
                        {isEnabled ? "Enabled" : "Not enabled"}
                      </Text>
                      <Text className="mt-1 text-xs text-[#64748B]">
                        {isEnabled
                          ? "Available to customers"
                          : "Unavailable to customers"}
                      </Text>
                    </View>

                    <Switch
                      value={isEnabled}
                      onValueChange={(value) =>
                        handleToggleService(service.name, value)
                      }
                      disabled={saving}
                      trackColor={{ false: "#CBD5E1", true: "#00B894" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              );
            })}

            {services.length === 0 && (
              <Text className="mt-2 text-center text-sm text-[#64748B]">
                No services are currently enabled for your store.
              </Text>
            )}

            <Pressable
              onPress={handleSaveServices}
              disabled={saving}
              className={`mt-3 h-12 flex-row items-center justify-center rounded-xl bg-[#123D4A] ${
                saving ? "opacity-60" : ""
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-bold text-white">Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </RefreshableScrollView>
      
    </SafeAreaView>
  );
}
