import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  MapPin,
  Phone,
  Clock,
  CalendarDays,
  Store,
  LogOut,
  X,
  Plus,
  ImagePlus,
  Pencil,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { disconnectShopOwnerSocket } from "@/services/socket";
import { API_BASE_URL } from "@/config/api";
import BottomNavigation from "@/components/common/BottomNavigation";
import OutsidePressModal from "@/components/common/OutsidePressModal";
import { fetch as expoFetch } from "expo/fetch";
import { File } from "expo-file-system";

interface DayTiming {
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

interface StoreImage {
  type: string;
  path: string;
}

type StoreService = "Phone Charging" | "Pick Me Later";

interface StoreData {
  name: string;
  addressLink: string;
  contactNumber: string;
  timings: string;
  services: StoreService[];
  weeklyTimings: Record<string, DayTiming>;
  image: StoreImage;
  images: StoreImage[];
  isActive: boolean;
  createdAt: string;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function ProfileScreen() {
  const router = useRouter();

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContactNumber, setEditContactNumber] = useState("");
  const [editAddressLink, setEditAddressLink] = useState("");
  type StoreService = "Phone Charging" | "Pick Me Later";

  const [editServices, setEditServices] = useState<StoreService[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileRequest, setProfileRequest] = useState<{
    status: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    createdAt?: string;
    reviewedAt?: string;
    proposedProfile?: {
      isActive?: boolean;
    };
  } | null>(null);
  const [editWeeklyTimings, setEditWeeklyTimings] = useState<
    Record<string, DayTiming>
  >({});

  const [selectedMainImage, setSelectedMainImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [keepExistingMainImage, setKeepExistingMainImage] = useState(true);

  const [existingGalleryImages, setExistingGalleryImages] = useState<
    StoreImage[]
  >([]);

  const [selectedGalleryImages, setSelectedGalleryImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);

  const fetchProfile = useCallback(async () => {
    try {
      setError("");

      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/shop-owners/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to fetch store details.");
      }

      setStore(result.data.store);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  const [inactiveEditInfoVisible, setInactiveEditInfoVisible] = useState(false);

  const [deactivationConfirmVisible, setDeactivationConfirmVisible] =
    useState(false);

  const fetchProfileRequestStatus = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("shopOwnerToken");
      if (!token) return;

      const response = await expoFetch(
        `${API_BASE_URL}/api/shop-owners/profile-change-request/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) return;

      const result = await response.json();

      if (result.success) {
        setProfileRequest(result.data.request || null);
      }
    } catch (err) {
      console.error("Unable to fetch profile request status:", err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchProfileRequestStatus();
  }, [fetchProfile, fetchProfileRequestStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile();
    fetchProfileRequestStatus();
  };

  const handleLogout = async () => {
    disconnectShopOwnerSocket();
    await SecureStore.deleteItemAsync("shopOwnerToken");
    router.replace("/");
  };

  const getImageUrl = (image?: StoreImage) => {
    if (!image?.path) return null;
    return `${API_BASE_URL}${image.path}`;
  };

  const requestImagePermission = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("Please allow photo library access to select store images.");
      return false;
    }

    return true;
  };

  const pickMainImage = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedMainImage(result.assets[0]);
      setKeepExistingMainImage(false);
      setError("");
    }
  };

  const pickGalleryImages = async () => {
    const remainingSlots =
      4 - existingGalleryImages.length - selectedGalleryImages.length;

    if (remainingSlots <= 0) {
      setError("You can add a maximum of 4 gallery images.");
      return;
    }

    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedGalleryImages((previous) => [
        ...previous,
        ...result.assets.slice(0, remainingSlots),
      ]);
      setError("");
    }
  };

  const handleRequestReactivation = async () => {
    try {
      setSavingProfile(true);
      setError("");

      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/profile-change-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: true }),
        },
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to request store reactivation.",
        );
      }

      await fetchProfileRequestStatus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to request store reactivation.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestDeactivation = async () => {
    try {
      setSavingProfile(true);
      setError("");

      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/profile-change-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: false }),
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to request store deactivation.",
        );
      }

      setDeactivationConfirmVisible(false);
      await fetchProfileRequestStatus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to request store deactivation.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!store) return;

    if (!editName.trim()) {
      setError("Store name is required.");
      return;
    }

    if (editServices.length === 0) {
      setError("At least one store service must remain enabled.");
      return;
    }

    if (!selectedMainImage && !keepExistingMainImage) {
      setError("Please select a main store image.");
      return;
    }

    try {
      setSavingProfile(true);
      setError("");

      const token = await SecureStore.getItemAsync("shopOwnerToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const formData = new FormData();

      formData.append("name", editName.trim());
      formData.append("contactNumber", editContactNumber.trim());
      formData.append("addressLink", editAddressLink.trim());
      formData.append("services", JSON.stringify(editServices));
      formData.append("weeklyTimings", JSON.stringify(editWeeklyTimings));

      formData.append(
        "existingImages",
        JSON.stringify(existingGalleryImages.map((image) => image.path)),
      );

      if (!selectedMainImage && keepExistingMainImage && store.image?.path) {
        formData.append("mainImagePath", store.image.path);
      }

      if (selectedMainImage) {
        const mainImageFile = new File(selectedMainImage.uri);
        formData.append("image", mainImageFile);
      }

      selectedGalleryImages.forEach((image) => {
        const galleryImageFile = new File(image.uri);
        formData.append("images", galleryImageFile);
      });

      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/profile-change-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("shopOwnerToken");
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit profile change request.",
        );
      }

      setEditVisible(false);
      setSelectedMainImage(null);
      setSelectedGalleryImages([]);

      await fetchProfileRequestStatus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit profile change request.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#123D4A" />
        <Text className="mt-3 text-gray-500">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC] px-6">
        <Text className="text-center text-gray-600">
          {error || "Store details are unavailable."}
        </Text>
        <Pressable
          onPress={fetchProfile}
          className="mt-4 rounded-xl bg-[#123D4A] px-6 py-3"
        >
          <Text className="font-semibold text-white">Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <View className="border-b border-gray-100 bg-white px-5 py-4">
        <Text className="text-2xl font-bold text-[#123D4A]">My Profile</Text>
        <Text className="mt-1 text-sm text-gray-500">
          Manage your store information
        </Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="px-5 pb-8 pt-5">
          {error ? (
            <Text className="mb-3 text-sm text-red-500">{error}</Text>
          ) : null}

          {profileRequest && (
            <View
              className={`mb-4 rounded-xl border p-4 ${
                profileRequest.status === "pending"
                  ? "border-amber-200 bg-amber-50"
                  : profileRequest.status === "approved"
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  profileRequest.status === "pending"
                    ? "text-amber-800"
                    : profileRequest.status === "approved"
                      ? "text-green-800"
                      : "text-red-800"
                }`}
              >
                {profileRequest.proposedProfile?.isActive === false
                  ? profileRequest.status === "pending"
                    ? "Deactivation Request Pending"
                    : profileRequest.status === "approved"
                      ? "Deactivation Approved"
                      : "Deactivation Request Rejected"
                  : profileRequest.proposedProfile?.isActive === true
                    ? profileRequest.status === "pending"
                      ? "Reactivation Request Pending"
                      : profileRequest.status === "approved"
                        ? "Reactivation Approved"
                        : "Reactivation Request Rejected"
                    : profileRequest.status === "pending"
                      ? "Profile Changes Awaiting Approval"
                      : profileRequest.status === "approved"
                        ? "Profile Changes Approved"
                        : "Profile Changes Rejected"}
              </Text>

              <Text className="mt-1 text-xs text-gray-600">
                {profileRequest.proposedProfile?.isActive === false
                  ? profileRequest.status === "pending"
                    ? "Your store will remain active until the Super Admin approves deactivation."
                    : profileRequest.status === "approved"
                      ? "Your store deactivation has been approved."
                      : "Your store remains active because the deactivation request was rejected."
                  : profileRequest.proposedProfile?.isActive === true
                    ? profileRequest.status === "pending"
                      ? "Your store will remain inactive until the Super Admin approves reactivation."
                      : profileRequest.status === "approved"
                        ? "Your store reactivation has been approved."
                        : "Your store remains inactive because the reactivation request was rejected."
                    : profileRequest.status === "pending"
                      ? "Your submitted changes are being reviewed. Your current approved profile remains visible until approval."
                      : profileRequest.status === "approved"
                        ? "Your requested store profile changes have been approved."
                        : "Your requested changes were not approved."}
              </Text>

              {profileRequest.status === "rejected" &&
                profileRequest.rejectionReason && (
                  <Text className="mt-2 text-xs font-medium text-red-700">
                    Reason: {profileRequest.rejectionReason}
                  </Text>
                )}
            </View>
          )}

          <View className="rounded-2xl border border-gray-100 bg-white p-4">
            <View className="flex-row items-center">
              {store.image?.path ? (
                <Image
                  source={{ uri: getImageUrl(store.image) || "" }}
                  className="h-20 w-20 rounded-xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-xl bg-[#E6F4F1]">
                  <Store size={32} color="#123D4A" />
                </View>
              )}

              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-[#123D4A]">
                  {store.name}
                </Text>

                <View
                  className={`mt-2 self-start rounded-full px-3 py-1 ${
                    store.isActive ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      store.isActive ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {store.isActive ? "Active Store" : "Inactive Store"}
                  </Text>
                </View>
              </View>

              <Pressable
                disabled={
                  store.isActive && profileRequest?.status === "pending"
                }
                onPress={() => {
                  if (!store.isActive) {
                    setInactiveEditInfoVisible(true);
                    return;
                  }

                  setEditName(store.name);
                  setEditContactNumber(store.contactNumber);
                  setEditAddressLink(store.addressLink);
                  setEditServices(
                    store.services?.length ? [...store.services] : [],
                  );

                  setEditWeeklyTimings(
                    Object.fromEntries(
                      DAYS.map((day) => {
                        const dayKey = day.toLowerCase();
                        const timing = store.weeklyTimings?.[dayKey];

                        return [
                          dayKey,
                          timing ? { ...timing } : { isClosed: true },
                        ];
                      }),
                    ),
                  );

                  setSelectedMainImage(null);
                  setKeepExistingMainImage(!!store.image?.path);
                  setExistingGalleryImages(store.images || []);
                  setSelectedGalleryImages([]);

                  setEditVisible(true);
                }}
                className={`ml-2 h-10 w-10 items-center justify-center rounded-xl ${
                  store.isActive ? "bg-[#E6F4F1]" : "bg-gray-100"
                }`}
              >
                <Pencil
                  size={18}
                  color={store.isActive ? "#008F75" : "#9CA3AF"}
                />
              </Pressable>
            </View>

            {!store.isActive && (
              <View className="mt-5">
                <Text className="mb-3 text-sm leading-5 text-red-600">
                  Your store is currently inactive. Submit a reactivation
                  request to the Super Admin to restore access to store
                  operations.
                </Text>

                {profileRequest?.status === "pending" &&
                profileRequest?.proposedProfile?.isActive === true ? (
                  <View className="rounded-xl bg-amber-50 px-4 py-3">
                    <Text className="text-center text-sm font-bold text-amber-800">
                      Reactivation Request Pending
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={handleRequestReactivation}
                    disabled={savingProfile}
                    className="h-12 flex-row items-center justify-center rounded-xl bg-[#008F75]"
                  >
                    {savingProfile ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="font-bold text-white">
                        Request Store Reactivation
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            )}

            {store.isActive && (
              <View className="mt-5">
                {profileRequest?.status === "pending" &&
                profileRequest?.proposedProfile?.isActive === false ? (
                  <View className="rounded-xl bg-amber-50 px-4 py-3">
                    <Text className="text-center text-sm font-bold text-amber-800">
                      Deactivation Request Pending
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setDeactivationConfirmVisible(true)}
                    className="h-12 items-center justify-center rounded-xl border border-red-200 bg-red-50"
                  >
                    <Text className="font-bold text-red-600">
                      Request Store Deactivation
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            <Text className="mb-3 mt-5 text-lg font-bold text-[#123D4A]">
              Store Information
            </Text>

            <View className="flex-row items-center py-4">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E6F4F1]">
                <Phone size={19} color="#00A985" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-500">Contact Number</Text>
                <Text className="mt-1 font-semibold text-gray-800">
                  {store.contactNumber || "Not specified"}
                </Text>
              </View>
            </View>

            <View className="h-px bg-gray-100" />

            <View className="flex-row items-center py-4">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E6F4F1]">
                <MapPin size={19} color="#00A985" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-500">Store Location</Text>
                <Pressable
                  onPress={() => {
                    if (store.addressLink) {
                      Linking.openURL(store.addressLink);
                    }
                  }}
                  disabled={!store.addressLink}
                >
                  <Text className="mt-2 self-start rounded-2xl bg-[#E6F4F1] px-3 py-2">
                    {store.addressLink
                      ? "View on Google Maps"
                      : "Not specified"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="h-px bg-gray-100" />

            <View className="flex-row items-center py-4">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E6F4F1]">
                <Clock size={19} color="#00A985" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-500">
                  Tap below see Store Timings
                </Text>
                <Pressable
                  onPress={() => setScheduleVisible(true)}
                  className="mt-2 self-start rounded-2xl bg-[#E6F4F1] px-3 py-2"
                >
                  <Text className="text-sm font-semibold text-[#008F75]">
                    See weekly schedule
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="h-px bg-gray-100" />

            <View className="flex-row items-start py-4">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E6F4F1]">
                <Store size={19} color="#00A985" />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-500">Store Services</Text>

                {store.services?.length > 0 ? (
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {store.services.map((service) => (
                      <View
                        key={service}
                        className="rounded-full border border-[#B9E5DF] bg-[#E6F4F1] px-3 py-2"
                      >
                        <Text className="text-xs font-semibold text-[#008F75]">
                          {service}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="mt-2 text-sm text-gray-500">
                    No services enabled
                  </Text>
                )}
              </View>
            </View>

            <View className="my-4 h-px bg-gray-100" />
            {store.images?.length > 0 && (
              <>
                <Text className="mb-3 mt-0 text-lg font-bold text-[#123D4A]">
                  Store Gallery
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {store.images.map((image, index) => (
                    <Image
                      key={`${image.path}-${index}`}
                      source={{ uri: getImageUrl(image) || "" }}
                      className="mr-3 h-28 w-36 rounded-xl"
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </>
            )}
          </View>

          <View className="mt-8">
            <Pressable
              onPress={handleLogout}
              className="w-36 self-center flex-row items-center justify-center rounded-2xl border border-red-700 bg-red-600 py-3"
            >
              <LogOut size={19} color="#FFFFFF" />
              <Text className="ml-2 font-semibold text-white">Logout</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      {/* Bottom navbar */}
      <BottomNavigation activeTab="profile" />
      {/* weekly Schedule */}
      <OutsidePressModal
        visible={scheduleVisible}
        onClose={() => setScheduleVisible(false)}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-bold text-[#123D4A]">
              Weekly Schedule
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Your store operating hours
            </Text>
          </View>

          <Pressable onPress={() => setScheduleVisible(false)}>
            <Text className="font-semibold text-[#008F75]">Close</Text>
          </Pressable>
        </View>

        {DAYS.map((day) => {
          const timing = store.weeklyTimings?.[day.toLowerCase()];

          return (
            <View
              key={day}
              className="flex-row items-center justify-between border-b border-gray-100 py-3"
            >
              <Text className="font-medium text-gray-700">{day}</Text>

              <Text className="text-right text-sm text-gray-500">
                {!timing
                  ? "Not specified"
                  : timing.isClosed
                    ? "Closed"
                    : `${timing.openTime} - ${timing.closeTime}`}
              </Text>
            </View>
          );
        })}
      </OutsidePressModal>

      <OutsidePressModal
        visible={inactiveEditInfoVisible}
        onClose={() => setInactiveEditInfoVisible(false)}
      >
        <View className="items-center py-2">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Pencil size={25} color="#9CA3AF" />
          </View>

          <Text className="text-xl font-bold text-[#123D4A]">
            Activate Your Store
          </Text>

          <Text className="mt-3 text-center text-sm leading-6 text-gray-600">
            Your store is currently inactive. You need approval from the Super
            Admin to reactivate your store before you can edit your store
            information.
          </Text>

          <Pressable
            onPress={() => setInactiveEditInfoVisible(false)}
            className="mt-5 w-full items-center rounded-xl bg-[#008F75] py-3"
          >
            <Text className="font-bold text-white">Got It</Text>
          </Pressable>
        </View>
      </OutsidePressModal>

      <OutsidePressModal
        visible={deactivationConfirmVisible}
        onClose={() => setDeactivationConfirmVisible(false)}
      >
        <View className="items-center py-2">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Store size={26} color="#DC2626" />
          </View>

          <Text className="text-xl font-bold text-[#123D4A]">
            Request Store Deactivation?
          </Text>

          <Text className="mt-3 text-center text-sm leading-6 text-gray-600">
            Your store will continue operating until the Super Admin reviews
            your request. Once approved, your store will become inactive and
            will stop accepting new bookings.
          </Text>

          <View className="mt-5 w-full flex-row gap-3">
            <Pressable
              onPress={() => setDeactivationConfirmVisible(false)}
              disabled={savingProfile}
              className="flex-1 items-center rounded-xl border border-gray-200 py-3"
            >
              <Text className="font-bold text-gray-600">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleRequestDeactivation}
              disabled={savingProfile}
              className="flex-1 items-center rounded-xl bg-red-600 py-3"
            >
              {savingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-bold text-white">Confirm Request</Text>
              )}
            </Pressable>
          </View>
        </View>
      </OutsidePressModal>

      {/* Edit */}
      <OutsidePressModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
      >
        <ScrollView
          style={{
            maxHeight: Dimensions.get("window").height * 0.75,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled
        >
          <Text className="text-lg font-bold text-[#123D4A]">
            Edit Store Profile
          </Text>

          <Text className="mb-5 mt-1 text-sm text-gray-500">
            Update your store information
          </Text>

          {/* Main Store Image */}
          <Text className="mb-2 text-sm font-semibold text-gray-700">
            Main Store Image
          </Text>

          <View className="mb-5 flex-row">
            {selectedMainImage ? (
              <View className="relative">
                <Image
                  source={{ uri: selectedMainImage.uri }}
                  className="h-28 w-28 rounded-xl"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => setSelectedMainImage(null)}
                  className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full bg-red-500"
                >
                  <X size={15} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : keepExistingMainImage && store.image?.path ? (
              <View className="relative">
                <Image
                  source={{ uri: getImageUrl(store.image) || "" }}
                  className="h-28 w-28 rounded-xl"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => setKeepExistingMainImage(false)}
                  className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full bg-red-500"
                >
                  <X size={15} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={pickMainImage}
                className="h-28 w-28 items-center justify-center rounded-xl border border-dashed border-[#00A985] bg-[#E6F4F1]"
              >
                <ImagePlus size={25} color="#008F75" />
                <Text className="mt-2 text-xs font-medium text-[#008F75]">
                  Upload Image
                </Text>
              </Pressable>
            )}
          </View>

          {/* Store Gallery */}
          <Text className="mb-2 text-sm font-semibold text-gray-700">
            Store Gallery (Maximum 4)
          </Text>

          <View className="mb-5 flex-row flex-wrap gap-3">
            {existingGalleryImages.map((image, index) => (
              <View key={`${image.path}-${index}`} className="relative">
                <Image
                  source={{ uri: getImageUrl(image) || "" }}
                  className="h-24 w-24 rounded-xl"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() =>
                    setExistingGalleryImages((current) =>
                      current.filter((_, imageIndex) => imageIndex !== index),
                    )
                  }
                  className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full bg-red-500"
                >
                  <X size={15} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}

            {selectedGalleryImages.map((image, index) => (
              <View key={image.uri} className="relative">
                <Image
                  source={{ uri: image.uri }}
                  className="h-24 w-24 rounded-xl"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() =>
                    setSelectedGalleryImages((current) =>
                      current.filter((_, imageIndex) => imageIndex !== index),
                    )
                  }
                  className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full bg-red-500"
                >
                  <X size={15} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}

            {existingGalleryImages.length + selectedGalleryImages.length <
              4 && (
              <Pressable
                onPress={pickGalleryImages}
                className="h-24 w-24 items-center justify-center rounded-xl border border-dashed border-[#00A985] bg-[#E6F4F1]"
              >
                <Plus size={25} color="#008F75" />
                <Text className="mt-1 text-xs font-medium text-[#008F75]">
                  Add Image
                </Text>
              </Pressable>
            )}
          </View>

          <Text className="mb-2 text-sm font-semibold text-gray-700">
            Store Name
          </Text>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            placeholder="Enter store name"
            className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-gray-800"
          />

          <Text className="mb-2 text-sm font-semibold text-gray-700">
            Contact Number
          </Text>
          <TextInput
            value={editContactNumber}
            onChangeText={setEditContactNumber}
            placeholder="Enter 10-digit contact number"
            keyboardType="phone-pad"
            maxLength={10}
            className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-gray-800"
          />

          <Text className="mb-2 text-sm font-semibold text-gray-700">
            Google Maps Link
          </Text>
          <TextInput
            value={editAddressLink}
            onChangeText={setEditAddressLink}
            placeholder="Paste Google Maps link"
            autoCapitalize="none"
            keyboardType="url"
            className="mb-5 rounded-xl border border-gray-200 px-4 py-3 text-gray-800"
          />

          {/* Store Services */}
          <Text className="mb-3 mt-2 text-base font-bold text-[#123D4A]">
            Store Services
          </Text>

          <Text className="mb-3 text-xs text-gray-500">
            At least one service must remain enabled.
          </Text>

          {(["Phone Charging", "Pick Me Later"] as StoreService[]).map(
            (service) => {
              const enabled = editServices.includes(service);

              return (
                <Pressable
                  key={service}
                  onPress={() => {
                    if (enabled && editServices.length === 1) {
                      setError("At least one service must remain enabled.");
                      return;
                    }

                    setEditServices((current) =>
                      enabled
                        ? current.filter((item) => item !== service)
                        : [...current, service],
                    );

                    setError("");
                  }}
                  className={`mb-3 flex-row items-center justify-between rounded-xl border p-4 ${
                    enabled
                      ? "border-[#00A985] bg-[#E6F4F1]"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <View>
                    <Text className="font-semibold text-[#123D4A]">
                      {service}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-500">
                      {enabled ? "Enabled" : "Disabled"}
                    </Text>
                  </View>

                  <View
                    className={`h-6 w-11 justify-center rounded-full px-1 ${
                      enabled ? "bg-[#00A985]" : "bg-gray-300"
                    }`}
                  >
                    <View
                      className={`h-4 w-4 rounded-full bg-white ${
                        enabled ? "self-end" : "self-start"
                      }`}
                    />
                  </View>
                </Pressable>
              );
            },
          )}

          <Text className="mb-3 mt-2 text-base font-bold text-[#123D4A]">
            Weekly Schedule
          </Text>

          {DAYS.map((day) => {
            const dayKey = day.toLowerCase();
            const timing = editWeeklyTimings[dayKey];

            if (!timing) return null;

            return (
              <View
                key={dayKey}
                className="mb-3 rounded-xl border border-gray-200 p-3"
              >
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="font-semibold text-gray-800">{day}</Text>

                  <Pressable
                    onPress={() =>
                      setEditWeeklyTimings((current) => ({
                        ...current,
                        [dayKey]: {
                          ...current[dayKey],
                          isClosed: !current[dayKey].isClosed,
                        },
                      }))
                    }
                    className={`rounded-full px-4 py-2 ${
                      timing.isClosed ? "bg-red-50" : "bg-green-50"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        timing.isClosed ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      {timing.isClosed ? "Closed" : "Open"}
                    </Text>
                  </Pressable>
                </View>

                {!timing.isClosed && (
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="mb-1 text-xs text-gray-500">
                        Opening Time
                      </Text>
                      <TextInput
                        value={timing.openTime || ""}
                        onChangeText={(value) =>
                          setEditWeeklyTimings((current) => ({
                            ...current,
                            [dayKey]: {
                              ...current[dayKey],
                              openTime: value,
                            },
                          }))
                        }
                        placeholder="09:00 AM"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-gray-800"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="mb-1 text-xs text-gray-500">
                        Closing Time
                      </Text>
                      <TextInput
                        value={timing.closeTime || ""}
                        onChangeText={(value) =>
                          setEditWeeklyTimings((current) => ({
                            ...current,
                            [dayKey]: {
                              ...current[dayKey],
                              closeTime: value,
                            },
                          }))
                        }
                        placeholder="09:00 PM"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-gray-800"
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          <Text className="mb-4 text-xs text-gray-500">
            Enter time in 12-hour format, such as 09:00 AM or 09:00 PM.
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setEditVisible(false)}
              disabled={savingProfile}
              className="flex-1 items-center rounded-xl border border-gray-200 py-3"
            >
              <Text className="font-semibold text-gray-600">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSaveProfile}
              disabled={savingProfile}
              className="flex-1 items-center rounded-xl bg-[#008F75] py-3"
            >
              {savingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-semibold text-white">Save Changes</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </OutsidePressModal>
    </SafeAreaView>
  );
}
