import { useRouter } from "expo-router";

import * as SecureStore from "expo-secure-store";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Clock3,
  LogOut,
  Store,
  Home,
  ClipboardList,
  BriefcaseBusiness,
  UserRound,
} from "lucide-react-native";

import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Loader from "@/components/common/Loader";
import RefreshableScrollView from "@/components/common/RefreshableScrollView";
import { API_BASE_URL } from "@/config/api";

import {
  connectShopOwnerSocket,
  disconnectShopOwnerSocket,
  subscribeToBookingEvents,
} from "@/services/socket";

import BottomNavigation from "@/components/common/BottomNavigation";

interface DashboardData {
  store: {
    name: string;
    isActive: boolean;
    image: {
      type: string;
      path: string;
    };
  };
  overview: {
    total: number;
    completed: number;
    pending: number;
  };
  unreadCount: number;
  recentBookings: {
    id: string;
    service: string;
    startAt: string;
    status: "confirmed" | "in_progress" | "completed";
    customerName: string;
  }[];
}

export default function DashboardScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      disconnectShopOwnerSocket();
      await SecureStore.deleteItemAsync("shopOwnerToken");
      router.replace("/");
    } catch (error) {
      console.error("[Dashboard] Logout failed.");
      setError("Unable to log out. Please try again.");
    }
  };

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
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
      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/dashboard`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      // 4. Clear invalid sessions and return to login.
      if (response.status === 401) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/profile");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to load store details.");
      }

      // 5. Save the authenticated store information.
      setDashboard(result.data);
    } catch (error) {
      console.error("[Dashboard] Store details request failed.");

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

  // Load store details when the dashboard opens.
  useEffect(() => {
    fetchStoreDetails();

    let isMounted = true;

    const unsubscribe = subscribeToBookingEvents(() => {
      if (isMounted) {
        fetchStoreDetails();
      }
    });

    connectShopOwnerSocket();

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
          {/* Dashboard Header */}
          <View className="mb-7 mt-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-extrabold text-[#123D4A]">
                  Nexo<Text className="text-[#00B894]">Pod</Text>
                </Text>
                <Text className="mt-1 text-sm text-[#64748B]">Shop Owner</Text>
              </View>

              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => router.push("/notifications")}
                  className="h-12 w-12 items-center justify-center rounded-2xl border border-[#E8EEF1] bg-white"
                >
                  <Bell size={23} color="#123D4A" />

                  {(dashboard?.unreadCount ?? 0) > 0 && (
                    <View className="absolute -right-1 -top-1 min-w-5 h-5 items-center justify-center rounded-full bg-red-500 px-1">
                      <Text className="text-[10px] font-bold text-white">
                        {(dashboard?.unreadCount ?? 0) > 99
                          ? "99+"
                          : dashboard?.unreadCount}
                      </Text>
                    </View>
                  )}
                </Pressable>

                <View className="h-12 w-12 items-center justify-center rounded-full bg-[#087C68]">
                  <Store size={23} color="#FFFFFF" />
                </View>
              </View>
            </View>

            <Text className="mt-7 text-3xl font-extrabold text-[#111827]">
              Dashboard
            </Text>

            <Text className="mt-2 text-base text-[#64748B]">
              Here's what's happening at your store today.
            </Text>
          </View>

          {/* Store Overview */}
          <View className="overflow-hidden rounded-3xl bg-[#006B63] p-5">
            <View className="flex-row items-center">
              {dashboard?.store.image?.path ? (
                <Image
                  source={{
                    uri: `${API_BASE_URL}${dashboard.store.image.path}`,
                  }}
                  className="h-16 w-16 rounded-2xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#00A98F]">
                  <Store size={34} color="#FFFFFF" />
                </View>
              )}

              <View className="ml-4 flex-1">
                <Text className="text-xl font-extrabold text-white">
                  {dashboard?.store.name || "Loading store..."}
                </Text>

                <View
                  className={`mt-3 flex-row items-center self-start rounded-full px-3 py-1 ${
                    dashboard?.store.isActive ? "bg-[#00A86B]" : "bg-[#D94848]"
                  }`}
                >
                  <View className="mr-2 h-2 w-2 rounded-full bg-white" />
                  <Text className="text-xs font-bold text-white">
                    {dashboard?.store.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {!dashboard?.store.isActive && (
            <View className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <View className="flex-row items-center">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-red-100">
                  <Store size={19} color="#DC2626" />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-red-700">
                    Store Currently Inactive
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-red-600">
                    Your store is not accepting new bookings or providing
                    services. You can still access your dashboard.
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => router.push("/profile")}
                className="mt-4 items-center rounded-xl bg-red-600 py-3"
              >
                <Text className="text-sm font-bold text-white">
                  Go to Profile
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => router.push("/bookings")}
            className="mt-5 flex-row items-center rounded-2xl border border-[#E8EEF1] bg-white p-4 active:bg-[#F0FDF9]"
          >
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#E6FBF5]">
              <CalendarDays size={23} color="#00B894" />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-[#123D4A]">
                Manage Bookings
              </Text>
              <Text className="mt-1 text-xs text-[#64748B]">
                View and manage customer bookings
              </Text>
            </View>

            <ChevronRight size={20} color="#64748B" />
          </Pressable>

          {/* Today's Overview */}

          {/* Today's Overview */}
          <View className="mb-4 mt-7">
            <Text className="text-xl font-extrabold text-[#123D4A]">
              Today's Overview
            </Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 items-center rounded-2xl border border-[#E5F1F0] bg-white p-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#DDFBF3]">
                <CalendarDays size={25} color="#00A985" />
              </View>
              <Text className="mt-3 text-2xl font-extrabold text-[#123D4A]">
                {dashboard?.overview.total ?? 0}
              </Text>
              <Text className="mt-1 text-center text-xs font-semibold text-[#64748B]">
                Bookings
              </Text>
            </View>

            <View className="flex-1 items-center rounded-2xl border border-[#DDF2E7] bg-white p-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#DDF8E8]">
                <CircleCheck size={26} color="#0BA85B" />
              </View>
              <Text className="mt-3 text-2xl font-extrabold text-[#123D4A]">
                {dashboard?.overview.completed ?? 0}
              </Text>
              <Text className="mt-1 text-center text-xs font-semibold text-[#64748B]">
                Completed
              </Text>
            </View>

            <View className="flex-1 items-center rounded-2xl border border-[#F5EBDD] bg-white p-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0D3]">
                <Clock3 size={25} color="#F09A18" />
              </View>
              <Text className="mt-3 text-2xl font-extrabold text-[#123D4A]">
                {dashboard?.overview.pending ?? 0}
              </Text>
              <Text className="mt-1 text-center text-xs font-semibold text-[#64748B]">
                Pending
              </Text>
            </View>
          </View>

          {/* Recent Bookings */}
          <View className="mb-4 mt-7 flex-row items-center justify-between">
            <Text className="text-xl font-extrabold text-[#123D4A]">
              Recent Bookings
            </Text>

            <Pressable onPress={() => router.push("/bookings")}>
              <Text className="text-sm font-bold text-[#00A985]">
                View All ›
              </Text>
            </Pressable>
          </View>

          <View className="rounded-2xl border border-[#E8EEF1] bg-white p-4">
            {dashboard?.recentBookings.length ? (
              dashboard.recentBookings.map((booking) => (
                <View
                  key={booking.id}
                  className="border-b border-[#F1F5F9] py-3 last:border-b-0"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-sm font-bold text-[#123D4A]">
                      {booking.customerName}
                    </Text>
                    <Text className="ml-2 text-xs font-semibold text-[#00A985]">
                      {booking.status.replace("_", " ")}
                    </Text>
                  </View>

                  <Text className="mt-1 text-sm text-[#64748B]">
                    {booking.service}
                  </Text>

                  <Text className="mt-1 text-xs text-[#94A3B8]">
                    {new Date(booking.startAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="py-4 text-center text-sm text-[#94A3B8]">
                No recent bookings available.
              </Text>
            )}
          </View>

          {/* 10. Display API errors */}
          {error ? (
            <View className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
              <Text className="text-sm font-medium text-red-600">{error}</Text>
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
        </View>
      </RefreshableScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" />

      {/* 13. Show the initial loading indicator */}
      {loading && <Loader fullScreen message="Loading your store..." />}
    </SafeAreaView>
  );
}
