import type { ComponentRef } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { API_BASE_URL } from "../../config/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Bell,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react-native";
import RemoteImage from "../../components/common/RemoteImage";
import UserBottomNavigation from "../../components/user/UserBottomNavigation";

interface StoreItem {
  _id: string;
  name: string;
  addressLink?: string;
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

export default function UserHomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedService, setSelectedService] = useState("All Services");

  const serviceFilters = ["All Services", "Phone Charging", "Pick Me Later"];

  const filteredStores = stores.filter((store) => {
    const matchesSearch = store.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesService =
      selectedService === "All Services" ||
      store.services?.includes(selectedService);

    return matchesSearch && matchesService;
  });

  const { width } = useWindowDimensions();
  const [activeSlide, setActiveSlide] = useState(0);

  const carouselRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const carouselWidth = width - 40;

  const carouselImages = [
    require("../../../assets/images/user_page/caresoul1.png"),
    require("../../../assets/images/user_page/caresoul2.png"),
    require("../../../assets/images/user_page/caresoul3.png"),
    require("../../../assets/images/user_page/caresoul4.png"),
  ];

  // Fetch Stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/public/stores?limit=10`,
        );

        const result = await response.json();

        if (response.ok && result.success) {
          setStores(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setStoresLoading(false);
      }
    };

    fetchStores();
  }, []);

  // Carousel Auto Slide
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSlide((current) => (current + 1) % carouselImages.length);
    }, 3000);

    return () => clearTimeout(timer);
  }, [activeSlide]);

  // Carousel Scroll
  useEffect(() => {
    carouselRef.current?.scrollTo({
      x: activeSlide * carouselWidth,
      animated: true,
    });
  }, [activeSlide, carouselWidth]);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8FA]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5 pb-24 pt-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[29px] font-extrabold tracking-tight text-[#142D46]">
                Nexo<Text className="text-[#00BFA5]">Pod</Text>
              </Text>
              <Text className="mt-0.5 text-xs text-[#7B8798]">
                Discover. Book. Enjoy.
              </Text>
            </View>

            <View className="h-11 w-11 items-center justify-center rounded-full border border-[#E7EDF1] bg-white">
              <Bell size={21} color="#164653" />
            </View>
          </View>

          {/* Greeting */}
          <View className="mt-8">
            <Text className="text-[23px] font-bold text-[#142D46]">
              Hello, Welcome!
            </Text>
            <Text className="mt-1 text-sm text-[#7B8798]">
              Find the perfect place for your next experience.
            </Text>
          </View>

          {/* Search */}
          <View className="mt-6 flex-row items-center gap-3">
            <View className="h-[54px] flex-1 flex-row items-center rounded-2xl border border-[#E7EDF1] bg-white px-4">
              <Search size={20} color="#7B8798" />

              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search stores near you..."
                placeholderTextColor="#9AA5B1"
                className="ml-3 flex-1 text-sm text-[#142D46]"
                returnKeyType="search"
              />
            </View>

            <Pressable
              className="h-[54px] w-[54px] items-center justify-center rounded-2xl bg-[#00BFA5]"
              onPress={() => setFilterVisible(true)}
            >
              <SlidersHorizontal size={21} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Location */}
          <View className="mt-5 flex-row items-center">
            <MapPin size={17} color="#00BFA5" />
            <Text className="ml-2 text-xs text-[#7B8798]">
              Discover stores around you
            </Text>
          </View>

          {/* Promotional Carousel */}
          <View className="mt-7">
            <ScrollView
              horizontal
              ref={carouselRef}
              pagingEnabled
              nestedScrollEnabled
              directionalLockEnabled
              decelerationRate="fast"
              snapToInterval={carouselWidth}
              snapToAlignment="start"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / carouselWidth,
                );
                setActiveSlide(index);
              }}
            >
              {carouselImages.map((image, index) => (
                <Image
                  key={index}
                  source={image}
                  resizeMode="cover"
                  style={{
                    width: carouselWidth,
                    height: 175,
                    marginRight: 5,
                    borderRadius: 20,
                  }}
                />
              ))}
            </ScrollView>

            <View className="mt-4 flex-row justify-center gap-2">
              {carouselImages.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 rounded-full ${
                    activeSlide === index
                      ? "w-6 bg-[#00BFA5]"
                      : "w-2 bg-[#C9D6D8]"
                  }`}
                />
              ))}
            </View>
          </View>

          {/* Nearby Stores */}
          <View className="mt-8">
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold text-[#142D46]">
                  Nearby Stores
                </Text>
                <Text className="mt-1 text-xs text-[#7B8798]">
                  Explore stores and their available services
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-sm font-semibold text-[#00BFA5]">
                  {filteredStores.length} stores
                </Text>

                <Pressable
                  onPress={() => router.push("/user/store/all-stores")}
                  className="mt-1 flex-row items-center"
                >
                  <Text className="text-sm font-bold text-[#00BFA5]">
                    View More
                  </Text>
                  <ChevronRight size={17} color="#00BFA5" />
                </Pressable>
              </View>
            </View>

            {storesLoading ? (
              <Text className="py-6 text-center text-sm text-[#7B8798]">
                Finding stores for you...
              </Text>
            ) : filteredStores.length === 0 ? (
              <Text className="py-6 text-center text-sm text-[#7B8798]">
                No stores found.
              </Text>
            ) : (
              <>
                <View className="gap-4">
                  {filteredStores.map((store) => {
                    const storeImage =
                      getImageUri(store.image) ||
                      getImageUri(store.images?.[0]);

                    return (
                      <Pressable
                        key={store._id}
                        onPress={() =>
                          router.push({
                            pathname: "/user/store/store-details",
                            params: { storeId: store._id },
                          })
                        }
                        className="overflow-hidden rounded-2xl border border-[#E7EDF1] bg-white"
                      >
                        {storeImage ? (
                          <Image
                            source={{ uri: storeImage }}
                            className="h-40 w-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="h-40 items-center justify-center bg-[#E4F7F3]">
                            <MapPin size={32} color="#00BFA5" />
                          </View>
                        )}

                        <View className="p-4">
                          <Text className="text-base font-bold text-[#142D46]">
                            {store.name}
                          </Text>

                          <Text className="mt-2 text-xs font-medium text-[#7B8798]">
                            Available Services
                          </Text>

                          <View className="mt-2 flex-row flex-wrap gap-2">
                            {store.services?.map((service) => (
                              <View
                                key={service}
                                className="rounded-full bg-[#E4F7F3] px-3 py-1.5"
                              >
                                <Text className="text-xs font-medium text-[#164653]">
                                  {service}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Bottom View More */}
                <Pressable
                  onPress={() => router.push("/user/store/all-stores")}
                  className="mt-5 flex-row items-center justify-center py-2"
                >
                  <Text className="text-sm font-bold text-[#00BFA5]">
                    View More
                  </Text>
                  <ChevronRight size={17} color="#00BFA5" />
                </Pressable>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            className="flex-1"
            onPress={() => setFilterVisible(false)}
          />

          <View className="rounded-t-[28px] bg-white px-5 pb-10 pt-6">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-extrabold text-[#142D46]">
                Filter Stores
              </Text>

              <Pressable onPress={() => setFilterVisible(false)}>
                <Text className="text-sm font-semibold text-[#7B8798]">
                  Close
                </Text>
              </Pressable>
            </View>

            <Text className="mb-4 text-sm text-[#7B8798]">
              Choose a service to discover matching stores.
            </Text>

            {serviceFilters.map((service) => {
              const active = selectedService === service;

              return (
                <Pressable
                  key={service}
                  onPress={() => setSelectedService(service)}
                  className={`mb-3 flex-row items-center justify-between rounded-xl border px-4 py-4 ${
                    active
                      ? "border-[#00BFA5] bg-[#E4F7F3]"
                      : "border-[#E7EDF1] bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active ? "text-[#008F75]" : "text-[#142D46]"
                    }`}
                  >
                    {service}
                  </Text>

                  <View
                    className={`h-5 w-5 items-center justify-center rounded-full border ${
                      active
                        ? "border-[#00A995] bg-[#00A995]"
                        : "border-[#CBD5E1]"
                    }`}
                  >
                    {active && (
                      <View className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </View>
                </Pressable>
              );
            })}

            <View className="mt-3 flex-row gap-3">
              <Pressable
                onPress={() => setSelectedService("All Services")}
                className="h-12 flex-1 items-center justify-center rounded-xl border border-[#E7EDF1]"
              >
                <Text className="font-bold text-[#64748B]">Reset</Text>
              </Pressable>

              <Pressable
                onPress={() => setFilterVisible(false)}
                className="h-12 flex-1 items-center justify-center rounded-xl bg-[#00A995]"
              >
                <Text className="font-bold text-white">Apply Filter</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <UserBottomNavigation activeTab="home" />
    </SafeAreaView>
  );
}
