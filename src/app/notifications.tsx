
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { Bell, CheckCheck, Clock3 } from "lucide-react-native";
import { useRouter } from "expo-router";

import { API_BASE_URL } from "@/config/api";
import BackButton from "@/components/common/BackButton";
import RefreshableScrollView from "@/components/common/RefreshableScrollView";
import Loader from "@/components/common/Loader";
import {
  connectShopOwnerSocket,
  subscribeToBookingEvents,
} from "@/services/socket";

interface Notification {
  _id: string;
  type: "new_booking" | "booking_completed";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setError("");

      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to load notifications.");
      }

      setNotifications(result.data.notifications || []);
    } catch (error) {
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

  useEffect(() => {
    fetchNotifications();

    const unsubscribe = subscribeToBookingEvents(() => {
      fetchNotifications();
    });

    connectShopOwnerSocket();

    return unsubscribe;
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      setUpdating(true);
      setError("");

      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to update notification.");
      }

      setNotifications((previous) =>
        previous.filter((item) => item._id !== notificationId)
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update notification."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setUpdating(true);
      setError("");

      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to update notifications.");
      }

      setNotifications([]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update notifications."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading notifications..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <View className="flex-row items-center justify-between px-5 pb-4 pt-4">
        <View className="flex-row items-center">
          <BackButton />
          <View className="ml-3">
            <Text className="text-xl font-extrabold text-[#123D4A]">
              Notifications
            </Text>
            <Text className="mt-1 text-xs text-[#64748B]">
              Your latest store updates
            </Text>
          </View>
        </View>

        {notifications.length > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            disabled={updating}
            className="flex-row items-center rounded-xl bg-[#E7F8F2] px-3 py-2"
          >
            <CheckCheck size={16} color="#00A985" />
            <Text className="ml-1 text-xs font-semibold text-[#00A985]">
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      <RefreshableScrollView
        className="flex-1"
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-8">
          {error ? (
            <View className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <Pressable
                key={notification._id}
                onPress={() => handleMarkRead(notification._id)}
                disabled={updating}
                className="mb-3 flex-row rounded-2xl border border-[#E8EEF1] bg-white p-4"
              >
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#E7F8F2]">
                  <Bell size={21} color="#00A985" />
                </View>

                <View className="ml-3 flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-sm font-bold text-[#123D4A]">
                      {notification.title}
                    </Text>
                    <View className="ml-2 h-2 w-2 rounded-full bg-[#00B894]" />
                  </View>

                  <Text className="mt-1 text-sm leading-5 text-[#64748B]">
                    {notification.message}
                  </Text>

                  <View className="mt-3 flex-row items-center">
                    <Clock3 size={13} color="#94A3B8" />
                    <Text className="ml-1 text-xs text-[#94A3B8]">
                      {new Date(notification.createdAt).toLocaleString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </Text>
                  </View>

                  <Text className="mt-2 text-xs font-semibold text-[#00A985]">
                    Tap to mark as read
                  </Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View className="mt-20 items-center px-6">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#E7F8F2]">
                <Bell size={29} color="#00A985" />
              </View>

              <Text className="mt-5 text-lg font-bold text-[#123D4A]">
                You're all caught up!
              </Text>

              <Text className="mt-2 text-center text-sm text-[#94A3B8]">
                New booking and completion notifications will appear here.
              </Text>
            </View>
          )}
        </View>
      </RefreshableScrollView>

      {updating && (
        <View className="absolute inset-0 items-center justify-center bg-white/40">
          <ActivityIndicator size="large" color="#00B894" />
        </View>
      )}
    </SafeAreaView>
  );
}
