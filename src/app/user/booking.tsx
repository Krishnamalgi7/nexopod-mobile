import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, ScrollView, Text, View } from "react-native";
import { CalendarDays, ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { Pressable } from "react-native";
import UserBottomNavigation from "../../components/user/UserBottomNavigation";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../../config/api";

export default function UserBookingsScreen() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = await SecureStore.getItemAsync("customerToken");

        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/customers/bookings`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setBookings(result.data.bookings || []);
        }
      } catch (error) {
        console.error("Failed to fetch customer bookings:", error);
      }
    };

    fetchBookings();
  }, []);

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        {
          text: "Keep Booking",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("customerToken");

              if (!token) {
                Alert.alert("Error", "Please log in again.");
                return;
              }

              const response = await fetch(
                `${API_BASE_URL}/api/customers/bookings/${bookingId}/cancel`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                },
              );

              const result = await response.json();

              if (!response.ok || !result.success) {
                Alert.alert(
                  "Cancellation Failed",
                  result.message || "Unable to cancel booking.",
                );
                return;
              }

              setBookings((previousBookings) =>
                previousBookings.map((booking) =>
                  booking._id === bookingId
                    ? { ...booking, status: "cancelled" }
                    : booking,
                ),
              );

              Alert.alert("Success", "Your booking has been cancelled.");
            } catch (error) {
              console.error("Booking cancellation failed:", error);
              Alert.alert("Error", "Something went wrong. Please try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8FA]" edges={["top"]}>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-32"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-7 mt-5">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => router.replace("/user/home" as const)}
                className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white"
              >
                <ArrowLeft size={21} color="#142D46" />
              </Pressable>

              <View>
                <Text className="text-2xl font-extrabold text-[#142D46]">
                  My Bookings
                </Text>
                <Text className="mt-1 text-sm text-[#7B8798]">
                  View and manage your bookings
                </Text>
              </View>
            </View>
          </View>

          {bookings.length === 0 ? (
            <View className="mt-20 items-center rounded-3xl bg-white px-6 py-10">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E4F7F3]">
                <CalendarDays size={38} color="#00BFA5" />
              </View>

              <Text className="mt-5 text-lg font-bold text-[#142D46]">
                No Bookings Yet
              </Text>

              <Text className="mt-2 text-center text-sm leading-6 text-[#7B8798]">
                Your bookings will appear here once you book a service at a
                store.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {bookings.map((booking) => (
                <View key={booking._id} className="rounded-2xl bg-white p-4">
                  <Text className="text-lg font-bold text-[#142D46]">
                    {booking.storeId?.name || "Store"}
                  </Text>

                  <Text className="mt-2 text-sm font-semibold text-[#00BFA5]">
                    {booking.service}
                  </Text>

                  <Text className="mt-2 text-sm text-[#7B8798]">
                    {new Date(booking.startAt).toLocaleString("en-IN")}
                  </Text>

                  <View
                    className={`mt-3 self-start rounded-full px-3 py-1 ${
                      booking.status === "cancelled"
                        ? "bg-red-50"
                        : booking.status === "completed"
                          ? "bg-green-50"
                          : "bg-[#E4F7F3]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold capitalize ${
                        booking.status === "cancelled"
                          ? "text-red-700"
                          : booking.status === "completed"
                            ? "text-green-700"
                            : "text-[#008F7A]"
                      }`}
                    >
                      {booking.status?.replace("_", " ")}
                    </Text>
                  </View>

                  {booking.status === "confirmed" &&
                    new Date(booking.startAt) > new Date() && (
                      <Pressable
                        onPress={() => handleCancelBooking(booking._id)}
                        className="mt-4 items-center rounded-xl border border-red-200 bg-red-50 py-3"
                      >
                        <Text className="font-semibold text-red-600">
                          Cancel Booking
                        </Text>
                      </Pressable>
                    )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <UserBottomNavigation activeTab="bookings" />
      </View>
    </SafeAreaView>
  );
}
