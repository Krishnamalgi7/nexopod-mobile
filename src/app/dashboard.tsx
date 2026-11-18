
import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  Store,
  Phone,
  Clock3,
  MapPin,
  ChevronRight,
} from "lucide-react-native";

import { API_BASE_URL } from "@/config/api";
import Loader from "@/components/common/Loader";
import RefreshableScrollView from "@/components/common/RefreshableScrollView";

interface StoreDetails {
  name: string;
  contactNumber: string;
  addressLink: string;
  timings: string;
  services: string[];
}

export default function DashboardScreen() {
  const router = useRouter();

  const [store, setStore] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch authenticated Shop Owner store details.
  const fetchStoreDetails = useCallback(async () => {
    try {
      setError("");

      // 2. Retrieve the saved authentication token.
      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      // 3. Request the authenticated store details.
      const response = await fetch(`${API_BASE_URL}/api/shop-owners/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      // 4. Clear invalid sessions and return to login.
      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to load store details.");
      }

      // 5. Save the authenticated store information.
      setStore(result.data.store);
    } catch (error) {
      console.error("[Dashboard] Store details request failed.");

      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // 6. Load store details when the dashboard opens.
  useEffect(() => {
    fetchStoreDetails();
  }, [fetchStoreDetails]);

  // 7. Reload store details when the user pulls down.
  const handleRefresh = () => {
    setRefreshing(true);
    fetchStoreDetails();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <RefreshableScrollView
        className="flex-1"
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-8">
          {/* 8. Dashboard header */}
          <View className="mb-7 mt-4">
            <Text className="text-sm font-medium text-[#64748B]">
              NexoPod Shop Owner
            </Text>

            <Text className="mt-2 text-2xl font-bold text-[#123D4A]">
              Dashboard
            </Text>

            <Text className="mt-1 text-sm text-[#64748B]">
              Manage your store from one place.
            </Text>
          </View>

          {/* 9. Store overview card */}
          <View className="rounded-2xl bg-[#123D4A] p-5">
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Store size={22} color="#FFFFFF" />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-xs font-medium text-[#B7DCD5]">
                  YOUR STORE
                </Text>

                <Text className="mt-1 text-lg font-bold text-white">
                  {store?.name || "Loading store..."}
                </Text>
              </View>

              <ChevronRight size={20} color="#FFFFFF" />
            </View>

            <View className="my-5 h-px bg-white/20" />

            <Text className="text-sm leading-6 text-[#D5E8E5]">
              Welcome to your NexoPod store dashboard.
            </Text>
          </View>

          {/* 10. Display API errors */}
          {error ? (
            <View className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
              <Text className="text-sm font-medium text-red-600">
                {error}
              </Text>
              <Text
                onPress={() => {
                  setLoading(true);
                  fetchStoreDetails();
                }}
                className="mt-2 text-sm font-semibold text-[#00B894]"
              >
                Try again
              </Text>
            </View>
          ) : null}

          {/* 11. Store information */}
          <View className="mb-3 mt-7">
            <Text className="text-lg font-bold text-[#123D4A]">
              Store Information
            </Text>
            <Text className="mt-1 text-sm text-[#64748B]">
              Your registered store details
            </Text>
          </View>

          <View className="rounded-2xl border border-[#E8EEF1] bg-white p-4">
            <View className="flex-row items-center py-3">
              <Phone size={19} color="#00B894" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-[#94A3B8]">
                  Contact Number
                </Text>
                <Text className="mt-1 text-sm font-semibold text-[#123D4A]">
                  {store?.contactNumber || "—"}
                </Text>
              </View>
            </View>

            <View className="h-px bg-[#F1F5F9]" />

            <View className="flex-row items-center py-3">
              <Clock3 size={19} color="#00B894" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-[#94A3B8]">
                  Operating Hours
                </Text>
                <Text className="mt-1 text-sm font-semibold text-[#123D4A]">
                  {store?.timings || "—"}
                </Text>
              </View>
            </View>

            <View className="h-px bg-[#F1F5F9]" />

            <View className="flex-row items-center py-3">
              <MapPin size={19} color="#00B894" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-[#94A3B8]">
                  Store Location
                </Text>
                <Text
                  numberOfLines={2}
                  className="mt-1 text-sm font-semibold text-[#123D4A]"
                >
                  {store?.addressLink || "—"}
                </Text>
              </View>
            </View>
          </View>

          {/* 12. Store services */}
          <View className="mb-3 mt-7">
            <Text className="text-lg font-bold text-[#123D4A]">
              Store Services
            </Text>
            <Text className="mt-1 text-sm text-[#64748B]">
              Services available at your store
            </Text>
          </View>

          <View className="rounded-2xl border border-[#E8EEF1] bg-white p-4">
            {store?.services?.length ? (
              store.services.map((service, index) => (
                <View
                  key={`${service}-${index}`}
                  className="flex-row items-center py-2"
                >
                  <View className="mr-3 h-2 w-2 rounded-full bg-[#00B894]" />
                  <Text className="text-sm font-medium text-[#123D4A]">
                    {service}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-sm text-[#64748B]">
                No services registered.
              </Text>
            )}
          </View>
        </View>
      </RefreshableScrollView>

      {/* 13. Show the initial loading indicator */}
      {loading && (
        <Loader fullScreen message="Loading your store..." />
      )}
    </SafeAreaView>
  );
}
