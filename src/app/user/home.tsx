
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  MapPin,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react-native";

export default function UserHomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const { width } = useWindowDimensions();
const [activeSlide, setActiveSlide] = useState(0);
const carouselWidth = width - 40;

const carouselImages = [
  require("../../../assets/images/user_page/caresoul1.png"),
  require("../../../assets/images/user_page/caresoul2.png"),
  require("../../../assets/images/user_page/caresoul3.png"),
  require("../../../assets/images/user_page/caresoul4.png"),
];


  return (
    <SafeAreaView className="flex-1 bg-[#F5F8FA]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5 pb-28 pt-4">
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

            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full border border-[#E7EDF1] bg-white">
                <Bell size={21} color="#164653" />
              </View>

              <View className="h-11 w-11 items-center justify-center rounded-full border border-[#E7EDF1] bg-white">
                <UserRound size={21} color="#164653" />
              </View>
            </View>
          </View>

          {/* Greeting */}
          <View className="mt-8">
            <Text className="text-[23px] font-bold text-[#142D46]">
              Hello, Welcome! 👋
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
              onPress={() => {}}
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
    pagingEnabled
    showsHorizontalScrollIndicator={false}
    onMomentumScrollEnd={(event) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / carouselWidth
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

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
