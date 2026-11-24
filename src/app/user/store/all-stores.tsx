import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { API_BASE_URL } from "../../../config/api";
import RemoteImage from "../../../components/common/RemoteImage";

interface StoreImage {
  type: string;
  path: string;
}

interface StoreItem {
  _id: string;
  name: string;
  addressLink?: string;
  services: string[];
  image?: StoreImage;
  images?: StoreImage[];
}

interface Pagination {
  totalStores: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const getImageUrl = (image?: StoreImage) => {
  if (!image?.path) return null;
  return `${API_BASE_URL}${image.path}`;
};

const serviceFilters = ["all", "Phone Charging", "Pick Me Later"] as const;

export default function AllStoresScreen() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] =
    useState<(typeof serviceFilters)[number]>("all");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          search: searchQuery.trim(),
          service: selectedService,
          page: String(page),
          limit: "10",
        });

        const response = await fetch(
          `${API_BASE_URL}/api/public/stores?${params.toString()}`,
        );

        const result = await response.json();

        console.log("STORES API RESPONSE:", JSON.stringify(result, null, 2));
        console.log("API BASE URL:", API_BASE_URL);

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to fetch stores.");
        }

        if (!cancelled) {
          setStores(result.data || []);
          setPagination(result.pagination || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load stores. Please try again.",
          );
          setStores([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedService, page]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleServiceFilter = (service: (typeof serviceFilters)[number]) => {
    setSelectedService(service);
    setPage(1);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8FA]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <ArrowLeft size={22} color="#142D46" />
        </Pressable>

        <View className="ml-4">
          <Text className="text-xl font-bold text-[#142D46]">All Stores</Text>
          <Text className="mt-0.5 text-xs text-[#7B8798]">
            Discover stores and services
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5 pb-10">
          {/* Search */}
          <View className="mt-3 h-[54px] flex-row items-center rounded-2xl border border-[#E7EDF1] bg-white px-4">
            <Search size={20} color="#7B8798" />

            <TextInput
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search stores..."
              placeholderTextColor="#9AA5B1"
              className="ml-3 flex-1 text-sm text-[#142D46]"
              returnKeyType="search"
            />
          </View>

          {/* Service Filters */}
          <View className="mt-6">
            <View className="mb-3 flex-row items-center">
              <SlidersHorizontal size={17} color="#164653" />
              <Text className="ml-2 text-sm font-bold text-[#142D46]">
                Filter by Service
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {serviceFilters.map((service) => {
                const isSelected = selectedService === service;

                return (
                  <Pressable
                    key={service}
                    onPress={() => handleServiceFilter(service)}
                    className={`rounded-full border px-4 py-2.5 ${
                      isSelected
                        ? "border-[#00BFA5] bg-[#00BFA5]"
                        : "border-[#E7EDF1] bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? "text-white" : "text-[#142D46]"
                      }`}
                    >
                      {service === "all" ? "All Services" : service}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Results Count */}
          <View className="mb-4 mt-7 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-[#142D46]">
              Explore Stores
            </Text>

            <Text className="text-xs font-medium text-[#7B8798]">
              {pagination?.totalStores ?? 0} stores
            </Text>
          </View>

          {/* Loading */}
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#00BFA5" />
              <Text className="mt-3 text-sm text-[#7B8798]">
                Finding stores...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center py-12">
              <Text className="text-sm text-red-500">{error}</Text>
              <Pressable
                onPress={() => setPage((current) => current)}
                className="mt-3"
              >
                <Text className="font-semibold text-[#00BFA5]">Try again</Text>
              </Pressable>
            </View>
          ) : stores.length === 0 ? (
            <View className="items-center py-12">
              <MapPin size={35} color="#00BFA5" />
              <Text className="mt-3 text-base font-bold text-[#142D46]">
                No stores found
              </Text>
              <Text className="mt-1 text-sm text-[#7B8798]">
                Try another search or service filter.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {stores.map((store) => {
                const storeImage = getImageUrl(store.image);

                console.log("STORE:", store.name);
                console.log("MAIN IMAGE:", JSON.stringify(store.image));
                console.log("IMAGES:", JSON.stringify(store.images));
                console.log("FINAL IMAGE URL:", storeImage);

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
                    <RemoteImage
                      uri={storeImage}
                      className="h-40 w-full"
                      resizeMode="cover"
                    />

                    <View className="p-4">
                      <Text className="text-base font-bold text-[#142D46]">
                        {store.name}
                      </Text>

                      <Text className="mb-2 mt-3 text-xs font-medium text-[#7B8798]">
                        Available Services
                      </Text>

                      <View className="flex-row flex-wrap gap-2">
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
          )}

          {/* Pagination */}
          {!loading && pagination && pagination.totalStores > 0 && (
            <View className="mt-7 flex-row items-center justify-between">
              <Pressable
                disabled={!pagination.hasPrevPage}
                onPress={() => setPage((current) => current - 1)}
                className={`flex-row items-center rounded-xl border border-[#E7EDF1] bg-white px-4 py-3 ${
                  !pagination.hasPrevPage ? "opacity-40" : ""
                }`}
              >
                <ChevronLeft size={18} color="#142D46" />
                <Text className="ml-1 text-sm font-semibold text-[#142D46]">
                  Previous
                </Text>
              </Pressable>

              <Text className="text-sm font-semibold text-[#142D46]">
                {pagination.currentPage} / {pagination.totalPages}
              </Text>

              <Pressable
                disabled={!pagination.hasNextPage}
                onPress={() => setPage((current) => current + 1)}
                className={`flex-row items-center rounded-xl border border-[#E7EDF1] bg-white px-4 py-3 ${
                  !pagination.hasNextPage ? "opacity-40" : ""
                }`}
              >
                <Text className="mr-1 text-sm font-semibold text-[#142D46]">
                  Next
                </Text>
                <ChevronRight size={18} color="#142D46" />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
