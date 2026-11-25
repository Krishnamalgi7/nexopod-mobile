import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, CalendarDays, Clock, Store } from "lucide-react-native";
import { API_BASE_URL } from "@/config/api";
import * as SecureStore from "expo-secure-store";

type StoreService = "Phone Charging" | "Pick Me Later";

interface DayTiming {
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

interface StoreData {
  _id: string;
  name: string;
  services: StoreService[];
  weeklyTimings?: Record<string, DayTiming>;
}

interface BookedRange {
  startAt: string;
  endAt: string;
}

export default function CreateBookingScreen() {
  const { storeId, service } = useLocalSearchParams<{
    storeId: string;
    service: StoreService;
  }>();

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const [customerName, setCustomerName] = useState("User");
  const [customerPhone, setCustomerPhone] = useState("");
  const [hasSelectedStartTime, setHasSelectedStartTime] = useState(false);

  const fetchStore = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/stores/${storeId}`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load store details.");
      }

      setStore(result.data);
    } catch (error) {
      Alert.alert(
        "Unable to load store",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchStore();
    } else {
      setLoading(false);
    }
  }, [storeId, fetchStore]);

  useEffect(() => {
    const fetchCustomerProfile = async () => {
      try {
        const token = await SecureStore.getItemAsync("customerToken");

        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/customers/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (response.ok && result.success) {
          const customer = result.data.customer;
          setCustomerName(customer.name?.trim() || "User");
          setCustomerPhone(customer.phone || "");
        }
      } catch (error) {
        console.error("Failed to fetch customer profile:", error);
      }
    };

    fetchCustomerProfile();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!storeId || !service) return;

      setAvailabilityLoading(true);
      setAvailabilityError("");
      setBookedTimes([]);
      setBookedRanges([]);

      try {
        const endpoint =
          service === "Phone Charging" ? "phone-charging" : "pick-me-later";

        const response = await fetch(
          `${API_BASE_URL}/api/public/stores/${storeId}/${endpoint}/availability?date=${formatDate(selectedDate)}`,
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to fetch availability.");
        }

        if (service === "Phone Charging") {
          setBookedTimes(result.data.bookedTimes || []);
        } else {
          setBookedRanges(result.data.bookedRanges || []);
        }
      } catch (error) {
        setAvailabilityError(
          error instanceof Error
            ? error.message
            : "Unable to fetch availability.",
        );
      } finally {
        setAvailabilityLoading(false);
      }
    };

    fetchAvailability();
  }, [storeId, service, selectedDate]);

  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const handleSubmit = async () => {
    if (availabilityLoading || availabilityError) {
      Alert.alert("Please wait", "Availability could not be verified.");
      return;
    }

    const startAt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      startTime.getHours(),
      startTime.getMinutes(),
    );

    const endAt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      endTime.getHours(),
      endTime.getMinutes(),
    );

    if (startAt <= new Date()) {
      Alert.alert("Invalid time", "Please select a future start time.");
      return;
    }

    if (service === "Pick Me Later" && endAt <= startAt) {
      Alert.alert(
        "Invalid collection time",
        "Collection time must be after the start time.",
      );
      return;
    }

    const token = await SecureStore.getItemAsync("customerToken");

    if (!token) {
      Alert.alert("Login required", "Please log in to create a booking.");
      return;
    }

    setSubmitting(true);

    try {
      const endpoint =
        service === "Phone Charging" ? "phone-charging" : "pick-me-later";

      const body =
        service === "Phone Charging"
          ? {
              storeId,
              startAt: startAt.toISOString(),
            }
          : {
              storeId,
              startAt: startAt.toISOString(),
              endAt: endAt.toISOString(),
            };

      const response = await fetch(`${API_BASE_URL}/api/bookings/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        Alert.alert(
          "Booking unsuccessful",
          result.message || "Unable to create booking. Please try again.",
        );
        return;
      }

      Alert.alert(
        "Booking Confirmed",
        "Your booking has been created successfully.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/user/booking"),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Connection error",
        "Unable to create booking. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const parseTime = (value?: string) => {
    if (!value) return "Not available";
    return value;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F8FA]">
        <ActivityIndicator size="large" color="#00BFA5" />
        <Text className="mt-3 text-sm text-[#7B8798]">
          Loading booking details...
        </Text>
      </SafeAreaView>
    );
  }

  if (!store || !service || !store.services.includes(service)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F8FA] px-6">
        <Text className="text-lg font-bold text-[#142D46]">
          Booking details unavailable
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-semibold text-[#00BFA5]">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8FA]" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center px-5 py-4">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={23} color="#142D46" />
          </Pressable>
          <Text className="text-xl font-bold text-[#142D46]">
            Create Booking
          </Text>
        </View>

        <View className="mx-5 rounded-2xl border border-[#E7EDF1] bg-white p-4">
          <View className="flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#E4F7F3]">
              <Store size={21} color="#00A985" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-[#142D46]">
                {store.name}
              </Text>
              <Text className="mt-1 text-sm text-[#7B8798]">{service}</Text>
            </View>
          </View>
        </View>

        <View className="mx-5 mt-5 rounded-2xl border border-[#E7EDF1] bg-white p-4">
          <Text className="text-base font-bold text-[#142D46]">
            Select Date
          </Text>

          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="mt-3 flex-row items-center rounded-xl border border-[#E7EDF1] px-4 py-4"
          >
            <CalendarDays size={20} color="#00A985" />
            <Text className="ml-3 flex-1 font-semibold text-[#142D46]">
              {selectedDate.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (event.type === "set" && date) {
                  setStartTime(date);
                  setHasSelectedStartTime(true);
                }
              }}
            />
          )}

          <View className="mt-5">
            <Text className="text-base font-bold text-[#142D46]">
              Store Timings
            </Text>
            <Text className="mt-2 text-sm text-[#7B8798]">
              {(() => {
                const day = selectedDate
                  .toLocaleDateString("en-US", { weekday: "long" })
                  .toLowerCase();
                const timing = store.weeklyTimings?.[day];

                if (!timing || timing.isClosed) return "Closed on this day";

                return `${parseTime(timing.openTime)} – ${parseTime(timing.closeTime)}`;
              })()}
            </Text>
          </View>
        </View>

        <View className="mx-5 mt-5 rounded-2xl border border-[#E7EDF1] bg-white p-4">
          <Text className="text-base font-bold text-[#142D46]">
            {service === "Phone Charging"
              ? "Select Charging Start Time"
              : "Select Storage Period"}
          </Text>

          <Pressable
            onPress={() => setShowStartPicker(true)}
            className="mt-3 flex-row items-center rounded-xl border border-[#E7EDF1] px-4 py-4"
          >
            <Clock size={20} color="#00A985" />
            <Text className="ml-3 flex-1 font-semibold text-[#142D46]">
              Start: {formatTime(startTime)}
            </Text>
          </Pressable>

          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              onChange={(event, date) => {
                setShowStartPicker(false);
                if (event.type === "set" && date) {
                  setStartTime(date);
                }
              }}
            />
          )}

          {hasSelectedStartTime && (
            <View className="mt-4 rounded-xl border border-[#D5EEE8] bg-[#E4F7F3] p-4">
              <Text className="text-sm font-bold text-[#142D46]">
                Booking Customer
              </Text>

              <Text className="mt-2 text-sm font-semibold text-[#142D46]">
                {customerName}
              </Text>

              <Text className="mt-1 text-sm text-[#64748B]">
                {customerPhone ? `+91 ${customerPhone}` : "Phone unavailable"}
              </Text>
            </View>
          )}

          {availabilityLoading ? (
            <View className="mt-3 flex-row items-center">
              <ActivityIndicator size="small" color="#00BFA5" />
              <Text className="ml-2 text-xs text-[#7B8798]">
                Checking availability...
              </Text>
            </View>
          ) : availabilityError ? (
            <Text className="mt-3 text-xs font-medium text-red-500">
              {availabilityError}
            </Text>
          ) : (
            <Text className="mt-3 text-xs text-[#7B8798]">
              {service === "Phone Charging"
                ? `${bookedTimes.length} booked start time(s) on this date`
                : `${bookedRanges.length} existing storage booking(s) on this date`}
            </Text>
          )}

          {service === "Pick Me Later" && (
            <>
              <Pressable
                onPress={() => setShowEndPicker(true)}
                className="mt-3 flex-row items-center rounded-xl border border-[#E7EDF1] px-4 py-4"
              >
                <Clock size={20} color="#00A985" />
                <Text className="ml-3 flex-1 font-semibold text-[#142D46]">
                  Collection: {formatTime(endTime)}
                </Text>
              </Pressable>

              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (event.type === "set" && date) {
                      setEndTime(date);
                    }
                  }}
                />
              )}
            </>
          )}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitting || availabilityLoading || !!availabilityError}
          className={`mx-5 mt-6 flex-row items-center justify-center rounded-xl bg-[#00BFA5] py-4 ${
            submitting || availabilityLoading || availabilityError
              ? "opacity-50"
              : ""
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-bold text-white">
              Confirm Booking
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
