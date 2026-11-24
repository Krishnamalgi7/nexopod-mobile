import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  UserRound,
  Phone,
  Pencil,
  CalendarDays,
  Heart,
  CreditCard,
  ShieldCheck,
  CircleHelp,
  Info,
  ChevronRight,
  LogOut,
  X,
  Check,
} from "lucide-react-native";
import { API_BASE_URL } from "../../config/api";
import UserBottomNavigation from "../../components/user/UserBottomNavigation";
import ConfirmationModal from "../../components/common/ConfirmationModal";

const menuItems = [
  {
    title: "My Bookings",
    subtitle: "View and manage your bookings",
    Icon: CalendarDays,
    route: "/user/booking",
  },
  {
    title: "Favourite Stores",
    subtitle: "Your saved store list",
    Icon: Heart,
  },
  {
    title: "Payment Methods",
    subtitle: "Manage your payment options",
    Icon: CreditCard,
  },
  {
    title: "Terms & Conditions",
    subtitle: "Read our terms and policies",
    Icon: ShieldCheck,
  },
  {
    title: "Help & Support",
    subtitle: "Get assistance and FAQs",
    Icon: CircleHelp,
  },
  {
    title: "About NexoPod",
    subtitle: "App version 1.0.0",
    Icon: Info,
  },
] as const;

export default function UserProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editedName, setEditedName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync("customerToken");

      if (!token) {
        router.replace("/user/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/customers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to load profile.");
        return;
      }

      const customer = result.data.customer;
      setName(customer.name || "");
      setEditedName(customer.name || "");
      setPhone(customer.phone || "");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = editedName.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("Name must be between 2 and 100 characters.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = await SecureStore.getItemAsync("customerToken");

      if (!token) {
        router.replace("/user/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/customers/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to update your name.");
        return;
      }

      setName(result.data.customer.name);
      setEditedName(result.data.customer.name);
      setIsEditing(false);
      setSuccessVisible(true);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("customerToken");
    setLogoutVisible(false);
    router.replace("/");
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F8FA]">
        <ActivityIndicator size="large" color="#00BFA5" />
        <Text className="mt-3 text-sm text-[#7B8798]">
          Loading your profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8FA]" edges={["top"]}>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-2xl font-extrabold tracking-tight text-[#142D46]">
              Nexo<Text className="text-[#00BFA5]">Pod</Text>
            </Text>

            <Pressable
              onPress={() =>
                Alert.alert("Notifications", "No new notifications.")
              }
              className="h-12 w-12 items-center justify-center rounded-full bg-white"
            >
              <Bell size={22} color="#00A995" />
              <View className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border border-white bg-red-500" />
            </Pressable>
          </View>

          <Text className="mb-4 mt-5 text-2xl font-extrabold text-[#142D46]">
            My Profile
          </Text>

          {/* Profile Card */}
          <View className="rounded-2xl border border-white bg-[#E9FBF7] p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#CFF4EB]">
                <UserRound size={34} color="#00A995" />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-base font-extrabold text-[#142D46]">
                  {name || "Welcome"}
                </Text>

                <View className="mt-2 flex-row items-center">
                  <Phone size={15} color="#64748B" />
                  <Text className="ml-2 text-xs text-[#64748B]">
                    {phone ? `+91 ${phone}` : "Phone unavailable"}
                  </Text>
                </View>

                <Text className="mt-1.5 text-[11px] text-[#7B8798]">
                  Verified mobile number
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setEditedName(name);
                  setError("");
                  setIsEditing(true);
                }}
                className="flex-row items-center rounded-full border border-[#00A995] px-2.5 py-1.5"
              >
                <Pencil size={13} color="#00A995" />
                <Text className="ml-1 text-xs font-bold text-[#00A995]">
                  Edit
                </Text>
              </Pressable>
            </View>

            {isEditing && (
              <View className="mt-4 border-t border-[#CDEDE5] pt-3">
                <Text className="mb-2 text-sm font-semibold text-[#142D46]">
                  Edit your name
                </Text>

                <TextInput
                  value={editedName}
                  onChangeText={(value) => {
                    setEditedName(value);
                    setError("");
                  }}
                  placeholder="Enter your name"
                  maxLength={100}
                  className="h-11 rounded-xl border border-[#B8E8DC] bg-white px-4 text-sm text-[#142D46]"
                />

                <Text className="mt-2 text-xs text-[#7B8798]">
                  Your mobile number cannot be changed.
                </Text>

                {error ? (
                  <Text className="mt-2 text-sm text-red-500">{error}</Text>
                ) : null}

                <View className="mt-3 flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      setIsEditing(false);
                      setEditedName(name);
                      setError("");
                    }}
                    className="h-10 flex-1 flex-row items-center justify-center rounded-xl border border-[#D5E5E1]"
                  >
                    <X size={16} color="#64748B" />
                    <Text className="ml-2 text-sm font-semibold text-[#64748B]">
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSave}
                    disabled={saving}
                    className="h-10 flex-1 flex-row items-center justify-center rounded-xl bg-[#00A995]"
                  >
                    {saving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Check size={16} color="white" />
                        <Text className="ml-2 text-sm font-bold text-white">
                          Save
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Menu */}
          <View className="mt-5 rounded-2xl bg-white px-4 shadow-sm">
            {menuItems.map((item, index) => (
              <Pressable
                key={item.title}
                onPress={() => {
                  if ("route" in item) {
                    router.push(item.route);
                  } else {
                    Alert.alert(
                      item.title,
                      "This section will be available soon.",
                    );
                  }
                }}
                className={`min-h-[76px] flex-row items-center ${
                  index !== menuItems.length - 1
                    ? "border-b border-[#E7EDF1]"
                    : ""
                }`}
              >
                <View className="w-11 items-start justify-center">
                  <item.Icon size={23} color="#00A995" strokeWidth={2.1} />
                </View>

                <View className="flex-1 py-3">
                  <Text className="text-sm font-extrabold text-[#142D46]">
                    {item.title}
                  </Text>
                  <Text className="mt-1 text-xs text-[#64748B]">
                    {item.subtitle}
                  </Text>
                </View>

                <ChevronRight size={19} color="#64748B" />
              </Pressable>
            ))}
          </View>

          {/* Logout */}
          <View className="mt-5 items-center">
            <Pressable
              onPress={() => setLogoutVisible(true)}
              className="h-12 w-1/2 flex-row items-center justify-center rounded-xl border border-[#FF7777] bg-[#FFF0F0]"
            >
              <LogOut size={18} color="#E51E24" />
              <Text className="ml-2 text-sm font-bold text-[#E51E24]">
                Logout
              </Text>
            </Pressable>
          </View>

          {error && !isEditing ? (
            <Text className="mt-4 text-center text-sm text-red-500">
              {error}
            </Text>
          ) : null}
        </ScrollView>

        {/* Navbar bottom */}
        <UserBottomNavigation activeTab="profile" />
      </View>

      <ConfirmationModal
        visible={logoutVisible}
        type="logout"
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Yes, Logout"
        onCancel={() => setLogoutVisible(false)}
        onConfirm={handleLogout}
      />

      <ConfirmationModal
        visible={successVisible}
        type="success"
        title="Profile Updated"
        message="Your name has been updated successfully."
        confirmText="OK"
        showCancel={false}
        onCancel={() => setSuccessVisible(false)}
        onConfirm={() => setSuccessVisible(false)}
      />
    </SafeAreaView>
  );
}
