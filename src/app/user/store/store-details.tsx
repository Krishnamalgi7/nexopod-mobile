import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  Zap,
  CalendarClock,
  CircleCheck,
  Circle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../../config/api";
import RemoteImage from "../../../components/common/RemoteImage";
import OutsidePressModal from "../../../components/common/OutsidePressModal";
import * as SecureStore from "expo-secure-store";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface DayTiming {
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

interface StoreItem {
  _id: string;
  name: string;
  addressLink?: string;
  timings?: string;
  weeklyTimings?: Record<string, DayTiming>;
  services: string[];
  image?: unknown;
  images?: unknown[];
}

const getImageUri = (image: unknown): string | undefined => {
  if (typeof image === "string") {
    return image.startsWith("http") ? image : `${API_BASE_URL}${image}`;
  }

  if (image && typeof image === "object") {
    const item = image as Record<string, unknown>;

    const uri = item.path || item.url || item.uri || item.secure_url;

    if (typeof uri === "string") {
      return uri.startsWith("http") ? uri : `${API_BASE_URL}${uri}`;
    }
  }

  return undefined;
};

export default function StoreDetailsScreen() {
  const { storeId, service } = useLocalSearchParams<{
    storeId: string;
    service?: string;
  }>();

  const [store, setStore] = useState<StoreItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(
    service ?? null,
  );

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/public/stores/${storeId}`,
        );

        const result = await response.json();

        if (response.ok && result.success) {
          setStore(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch store details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchStore();
    }
  }, [storeId]);

  useEffect(() => {
    if (service) {
      setSelectedService(service);
    }
  }, [service]);

  const storeImages = store
    ? [store.image, ...(store.images || [])]
        .map(getImageUri)
        .filter((uri): uri is string => Boolean(uri))
        .filter((uri, index, array) => array.indexOf(uri) === index)
    : [];

  const goToPreviousImage = () => {
    setActiveImage((current) => Math.max(0, current - 1));
  };

  const goToNextImage = () => {
    setActiveImage((current) => Math.min(storeImages.length - 1, current + 1));
  };

  const handleServiceSelect = async (selectedService: string) => {
    const token = await SecureStore.getItemAsync("customerToken");

    if (!token) {
      router.push({
        pathname: "/user/login",
        params: {
          storeId,
          service: selectedService,
        },
      });
      return;
    }

    router.push({
      pathname: "/user/store/create-booking",
      params: {
        storeId,
        service: selectedService,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F8FA]">
        <ActivityIndicator size="large" color="#00BFA5" />
        <Text className="mt-3 text-sm text-[#7B8798]">
          Loading store details...
        </Text>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F8FA]">
        <Text className="text-lg font-bold text-[#142D46]">
          Store not found
        </Text>

        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-semibold text-[#00BFA5]">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8FA]" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 py-4">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft size={22} color="#142D46" />
          </Pressable>

          <Text className="ml-4 text-lg font-bold text-[#142D46]">
            Store Details
          </Text>
        </View>

        {/* Store Image Carousel */}
        <View className="mx-5 mt-2">
          <View className="relative h-64 overflow-hidden rounded-2xl bg-[#E4F7F3]">
            {storeImages.length > 0 ? (
              <Image
                key={storeImages[activeImage]}
                source={{ uri: storeImages[activeImage] }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full items-center justify-center">
                <ImageIcon size={42} color="#00BFA5" />
                <Text className="mt-2 text-sm text-[#7B8798]">
                  No store images available
                </Text>
              </View>
            )}

            {/* Previous Arrow */}
            {activeImage > 0 && (
              <Pressable
                onPress={goToPreviousImage}
                className="absolute left-3 top-1/2 h-10 w-10 -translate-y-5 items-center justify-center rounded-full bg-black/50"
              >
                <ChevronLeft size={26} color="#FFFFFF" />
              </Pressable>
            )}

            {/* Next Arrow */}
            {activeImage < storeImages.length - 1 && (
              <Pressable
                onPress={goToNextImage}
                className="absolute right-3 top-1/2 h-10 w-10 -translate-y-5 items-center justify-center rounded-full bg-black/50"
              >
                <ChevronRight size={26} color="#FFFFFF" />
              </Pressable>
            )}

            {/* Image Counter */}
            {storeImages.length > 0 && (
              <View className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1.5">
                <Text className="text-xs font-semibold text-white">
                  {activeImage + 1} / {storeImages.length}
                </Text>
              </View>
            )}
          </View>

          {/* Image Indicators */}
          {storeImages.length > 1 && (
            <View className="mt-4 flex-row justify-center gap-2">
              {storeImages.map((_, index) => (
                <Pressable
                  key={index}
                  onPress={() => setActiveImage(index)}
                  className={`h-2 rounded-full ${
                    activeImage === index
                      ? "w-6 bg-[#00BFA5]"
                      : "w-2 bg-[#C9D6D8]"
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        {/* Store Information */}
        <View className="px-5 pb-10">
          <View className="mt-6">
            <Text className="text-2xl font-bold text-[#142D46]">
              {store.name}
            </Text>

            <View className="flex-row items-center py-3">
              <View className="mr-3 h-8 w-11 items-center justify-center rounded-xl bg-[#E4F7F3]">
                <MapPin size={15} color="#00A889" />
              </View>

              <View className="flex-1">
                <Pressable
                  onPress={() => {
                    if (store.addressLink) {
                      Linking.openURL(store.addressLink);
                    }
                  }}
                  disabled={!store.addressLink}
                  className="self-start flex-row items-center rounded-full bg-[#E4F7F3] px-4 py-2"
                >
                  <Text className="mr-2 text-sm font-semibold text-[#008F75]">
                    View Store Location
                  </Text>
                  <ExternalLink size={15} color="#008F75" />
                </Pressable>
              </View>
            </View>

            <View className="flex-row items-center border-b border-[#E7EDF1] py-3">
              <View className="mr-3 h-8 w-11 items-center justify-center rounded-xl bg-[#E4F7F3]">
                <Clock size={15} color="#00A889" />
              </View>

              <View className="flex-1">
                <Pressable
                  onPress={() => setScheduleVisible(true)}
                  className="self-start rounded-full bg-[#E4F7F3] px-4 py-2"
                >
                  <Text className="text-sm font-semibold text-[#008F75]">
                    See weekly schedule
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Choose a Service */}
          <View className="mt-8">
            <Text className="text-xl font-bold text-[#142D46]">
              Choose a Service
            </Text>

            <Text className="mt-1 text-sm text-[#7B8798]">
              Select one service to continue
            </Text>

            <View className="mt-4 gap-3">
              {store.services?.map((item) => {
                const isSelected = selectedService === item;
                const isPhoneCharging = item === "Phone Charging";

                return (
                  <Pressable
                    key={item}
                    onPress={() => setSelectedService(item)}
                    className={`rounded-2xl border bg-white p-4 ${
                      isSelected ? "border-[#00BFA5]" : "border-[#E7EDF1]"
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View className="mr-4 h-16 w-16 items-center justify-center rounded-2xl bg-[#E4F7F3]">
                        {isPhoneCharging ? (
                          <Zap size={29} color="#00BFA5" />
                        ) : (
                          <CalendarClock size={29} color="#00BFA5" />
                        )}
                      </View>

                      <View className="flex-1">
                        <Text className="text-base font-bold text-[#171717]">
                          {item}
                        </Text>

                        <Text className="mt-2 text-sm text-[#7B8798]">
                          {isPhoneCharging
                            ? "Charge your phone while you relax"
                            : "store now and collect later"}
                        </Text>
                      </View>

                      {isSelected ? (
                        <CircleCheck size={23} color="#00BFA5" />
                      ) : (
                        <Circle size={23} color="#7B8798" />
                      )}
                    </View>

                    {isSelected && (
                      <View className="mt-2 self-start rounded-full bg-[#DDF5E8] px-2.5 py-1">
                        <Text className="text-xs font-semibold text-[#008F45]">
                          Selected
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => {
                if (selectedService) {
                  handleServiceSelect(selectedService);
                }
              }}
              disabled={!selectedService}
              className={`mt-4 h-16 items-center justify-center rounded-2xl ${
                selectedService ? "bg-[#00A995]" : "bg-[#A9CFC9]"
              }`}
            >
              <Text className="text-lg font-bold text-white">Continue →</Text>
            </Pressable>

            <Text className="mt-4 text-center text-sm text-[#7B8798]">
              You can select only one service at a time
            </Text>
          </View>
        </View>
      </ScrollView>

      <OutsidePressModal
        visible={scheduleVisible}
        onClose={() => setScheduleVisible(false)}
      >
        <View className="mb-5">
          <Text className="text-lg font-bold text-[#123D4A]">
            Weekly Schedule
          </Text>
          <Text className="mt-1 text-sm text-gray-500">
            Store operating hours
          </Text>
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
    </SafeAreaView>
  );
}
