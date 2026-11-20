import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { CalendarDays, RefreshCw } from "lucide-react-native";
import BottomNavigation from "@/components/common/BottomNavigation";
import { API_BASE_URL } from "@/config/api";
import BackButton from "@/components/common/BackButton";
import Loader from "@/components/common/Loader";
import RefreshableScrollView from "@/components/common/RefreshableScrollView";

import {
  connectShopOwnerSocket,
  subscribeToBookingEvents,
} from "@/services/socket";

interface Booking {
  _id: string;
  service: "Phone Charging" | "Pick Me Later";
  startAt: string;
  status: "confirmed" | "in_progress" | "completed";
  customerId?: {
    _id: string;
    name: string;
  } | null;
  nextAction: {
    label: string;
    status: "in_progress" | "completed";
  } | null;
}

export default function BookingsScreen() {
  const router = useRouter();

  const [phoneChargingBookings, setPhoneChargingBookings] = useState<Booking[]>(
    [],
  );
  const [pickMeLaterBookings, setPickMeLaterBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState("");
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState<
    "all" | "Phone Charging" | "Pick Me Later"
  >("all");

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const loadedCursors = useRef<string[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch bookings from the API
  const fetchBookings = useCallback(
    async (
      cursor: string | null = null,
      append = false,
      rememberCursor = false,
      service = selectedService,
    ) => {
      try {
        setError("");

        const token = await SecureStore.getItemAsync("shopOwnerToken");

        if (!token) {
          router.replace("/login");
          return null;
        }

        const cursorQuery = cursor
          ? `&cursor=${encodeURIComponent(cursor)}`
          : "";

        const serviceQuery = `&service=${encodeURIComponent(service)}`;

        const response = await fetch(
          `${API_BASE_URL}/api/shop-owners/bookings?limit=20${serviceQuery}${cursorQuery}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const result = await response.json();

        if (response.status === 401 || response.status === 403) {
          await SecureStore.deleteItemAsync("shopOwnerToken");
          router.replace("/login");
          return null;
        }

        if (!response.ok) {
          throw new Error(result.message || "Unable to load bookings.");
        }

        const phoneBookings: Booking[] =
          result.data.phoneCharging?.bookings || [];

        const storageBookings: Booking[] =
          result.data.pickMeLater?.bookings || [];

        setPhoneChargingBookings((previous) => {
          if (!append) return phoneBookings;

          const uniqueBookings = new Map(
            previous.map((booking) => [booking._id, booking]),
          );

          phoneBookings.forEach((booking: Booking) => {
            uniqueBookings.set(booking._id, booking);
          });

          return Array.from(uniqueBookings.values());
        });

        setPickMeLaterBookings((previous) => {
          if (!append) return storageBookings;

          const uniqueBookings = new Map(
            previous.map((booking) => [booking._id, booking]),
          );

          storageBookings.forEach((booking: Booking) => {
            uniqueBookings.set(booking._id, booking);
          });

          return Array.from(uniqueBookings.values());
        });

        const responseNextCursor = result.data.pagination?.nextCursor || null;

        setNextCursor(responseNextCursor);
        setHasNextPage(result.data.pagination?.hasNextPage || false);

        if (!append) {
          loadedCursors.current = [];
        } else if (rememberCursor && cursor) {
          loadedCursors.current = [...loadedCursors.current, cursor];
        }

        return responseNextCursor;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to connect to the server.",
        );

        return null;
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [router, selectedService],
  );

  // Refresh all currently loaded booking pages
  const refreshLoadedBookings = useCallback(async () => {
    const pagesToReload = loadedCursors.current.length + 1;
    let cursor: string | null = null;

    for (let page = 0; page < pagesToReload; page++) {
      const nextPageCursor = await fetchBookings(cursor, page > 0, page > 0);

      if (!nextPageCursor) break;

      cursor = nextPageCursor;
    }
  }, [fetchBookings]);

  // Set up socket connection and event listeners
  useEffect(() => {
    fetchBookings();

    let isMounted = true;

    const unsubscribe = subscribeToBookingEvents(() => {
      if (isMounted) {
        refreshLoadedBookings();
      }
    });

    connectShopOwnerSocket();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchBookings, refreshLoadedBookings]);

  const handleServiceFilter = (
    service: "all" | "Phone Charging" | "Pick Me Later",
  ) => {
    if (service === selectedService) return;

    setSelectedService(service);
    loadedCursors.current = [];
    setLoading(true);

    
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    refreshLoadedBookings();
  };

  // Load the next set of bookings using the cursor.
  const handleLoadMore = () => {
    if (!hasNextPage || loadingMore || !nextCursor) return;

    setLoadingMore(true);
    fetchBookings(nextCursor, true, true);
  };

  // Handle booking status update
  const handleUpdateStatus = async (
    bookingId: string,
    status: "in_progress" | "completed",
  ) => {
    try {
      setUpdatingBookingId(bookingId);
      setError("");

      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to update booking.");
      }

      await refreshLoadedBookings();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update booking.",
      );
    } finally {
      setUpdatingBookingId("");
    }
  };

  // Format booking date for display
  const formatBookingDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  // Get a user-friendly label for the booking status
  const getStatusLabel = (status: Booking["status"]) => {
    if (status === "in_progress") return "In Progress";
    if (status === "completed") return "Completed";
    return "Confirmed";
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <View className="flex-row items-center px-5 pb-3 pt-4">
        <BackButton />

        <View className="ml-4 flex-1">
          <Text className="text-xl font-bold text-[#123D4A]">Bookings</Text>
          <Text className="mt-1 text-xs text-[#64748B]">
            Manage your store bookings
          </Text>
        </View>

        <Pressable
          onPress={handleRefresh}
          disabled={refreshing}
          className="h-11 w-11 items-center justify-center rounded-xl bg-white"
        >
          <RefreshCw size={19} color="#00B894" />
        </Pressable>
      </View>

      <RefreshableScrollView
        className="flex-1"
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-8 pt-3">
          <View className="mb-5 mt-2 flex-row rounded-3xl bg-[#E8EEF1] p-1">
            {(["all", "Phone Charging", "Pick Me Later"] as const).map(
              (service) => (
                <Pressable
                  key={service}
                  onPress={() => handleServiceFilter(service)}
                  className={`flex-1 items-center justify-center rounded-3xl px-2 py-3 ${
                    selectedService === service
                      ? "bg-[#123D4A]"
                      : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedService === service
                        ? "text-white"
                        : "text-[#64748B]"
                    }`}
                  >
                    {service === "all" ? "All" : service}
                  </Text>
                </Pressable>
              ),
            )}
          </View>

          {error ? (
            <View className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4">
              <Text className="text-sm text-red-600">{error}</Text>
              <Pressable
                onPress={() => {
                  setLoading(true);
                  fetchBookings();
                }}
                className="mt-2"
              >
                <Text className="text-sm font-bold text-red-600">
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View className="rounded-2xl border border-[#E8EEF1] bg-white px-4 py-6">
            {!loading &&
            phoneChargingBookings.length === 0 &&
            pickMeLaterBookings.length === 0 &&
            !error ? (
              <View className="items-center px-2 py-5">
                <CalendarDays size={35} color="#94A3B8" />
                <Text className="mt-4 text-base font-bold text-[#123D4A]">
                  No bookings yet
                </Text>
                <Text className="mt-2 text-center text-sm text-[#64748B]">
                  New customer bookings will appear here.
                </Text>
              </View>
            ) : (
              <>
                {phoneChargingBookings.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    updatingBookingId={updatingBookingId}
                    onUpdateStatus={handleUpdateStatus}
                    getStatusLabel={getStatusLabel}
                    formatBookingDate={formatBookingDate}
                  />
                ))}

                {pickMeLaterBookings.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    updatingBookingId={updatingBookingId}
                    onUpdateStatus={handleUpdateStatus}
                    getStatusLabel={getStatusLabel}
                    formatBookingDate={formatBookingDate}
                  />
                ))}
              </>
            )}
          </View>
          {hasNextPage ? (
            <Pressable
              onPress={handleLoadMore}
              disabled={loadingMore}
              className="mt-2 h-12 items-center justify-center rounded-xl border border-[#00B894] bg-white"
            >
              {loadingMore ? (
                <ActivityIndicator color="#00B894" />
              ) : (
                <Text className="text-sm font-bold text-[#00B894]">
                  Load More Bookings
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </RefreshableScrollView>

      <BottomNavigation activeTab="bookings" />

      {loading ? <Loader fullScreen message="Loading bookings..." /> : null}
    </SafeAreaView>
  );
}

interface BookingCardProps {
  booking: Booking;
  updatingBookingId: string;
  onUpdateStatus: (
    bookingId: string,
    status: "in_progress" | "completed",
  ) => void;
  getStatusLabel: (status: Booking["status"]) => string;
  formatBookingDate: (date: string) => string;
}

function BookingCard({
  booking,
  updatingBookingId,
  onUpdateStatus,
  getStatusLabel,
  formatBookingDate,
}: BookingCardProps) {
  const action = booking.nextAction;
  const isUpdating = updatingBookingId === booking._id;

  return (
    <View className="mb-4 rounded-2xl border border-[#E8EEF1] bg-white p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold text-[#123D4A]">
            {booking.service}
          </Text>

          <Text className="mt-1 text-sm text-[#64748B]">
            {booking.customerId?.name || "Customer"}
          </Text>
        </View>

        <View
          className={`rounded-full px-3 py-1 ${
            booking.status === "completed"
              ? "bg-green-50"
              : booking.status === "in_progress"
                ? "bg-blue-50"
                : "bg-amber-50"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              booking.status === "completed"
                ? "text-green-700"
                : booking.status === "in_progress"
                  ? "text-blue-700"
                  : "text-amber-700"
            }`}
          >
            {getStatusLabel(booking.status)}
          </Text>
        </View>
      </View>

      <View className="my-4 h-px bg-[#F1F5F9]" />

      <Text className="text-xs font-medium text-[#94A3B8]">
        BOOKING DATE & TIME
      </Text>

      <Text className="mt-1 text-sm font-semibold text-[#123D4A]">
        {formatBookingDate(booking.startAt)}
      </Text>

      {action ? (
        <Pressable
          onPress={() => onUpdateStatus(booking._id, action.status)}
          disabled={Boolean(updatingBookingId)}
          className={`mt-4 h-12 flex-row items-center justify-center rounded-xl bg-[#00B894] ${
            updatingBookingId ? "opacity-60" : "active:opacity-80"
          }`}
        >
          {isUpdating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-sm font-bold text-white">{action.label}</Text>
          )}
        </Pressable>
      ) : (
        <View className="mt-4 rounded-xl bg-[#F1F5F9] py-3">
          <Text className="text-center text-sm font-semibold text-[#64748B]">
            Booking completed
          </Text>
        </View>
      )}
    </View>
  );
}
