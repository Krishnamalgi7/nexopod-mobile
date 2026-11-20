import { useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import Loader from "@/components/common/Loader";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import {
  Image,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";

const onboardingImages = [
  require("../../assets/images/onboarding/welcome.png"),
  require("../../assets/images/onboarding/discover.png"),
  require("../../assets/images/onboarding/login-intro.png"),
];

export default function HomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const token = await SecureStore.getItemAsync("shopOwnerToken");

        if (token) {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("[Onboarding] Session check failed.");
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 2. Handle swipe gestures between onboarding screens.
  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 20 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),

      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -60) {
          setCurrentSlide((previous) =>
            Math.min(previous + 1, onboardingImages.length - 1),
          );
        } else if (gestureState.dx > 60) {
          setCurrentSlide((previous) => Math.max(previous - 1, 0));
        }
      },
    }),
  ).current;

  // 1. Handle onboarding navigation.
  const handleNext = () => {
    if (currentSlide < onboardingImages.length - 1) {
      setCurrentSlide((previous) => previous + 1);
      return;
    }
    router.push("/login");
  };

  if (checkingSession) {
    return <Loader fullScreen message="Checking your session..." />;
  }

  return (
    <View className="flex-1 bg-[#EFFFFB]" {...swipeResponder.panHandlers}>
      {/* 2. Display onboarding artwork across the screen. */}
      <Animated.View
        key={currentSlide}
        entering={FadeInRight.duration(450)}
        exiting={FadeOutLeft.duration(300)}
        className="absolute inset-0"
      >
        <Image
          source={onboardingImages[currentSlide]}
          resizeMode="cover"
          className="h-full w-full"
        />
      </Animated.View>

      <SafeAreaView
        className="flex-1 justify-end px-6 pb-24"
        edges={["top", "bottom"]}
      >
        {/* 3. Show pagination dots only on the first two screens. */}
        {currentSlide < 2 && (
          <View className="mb-6 flex-row items-center justify-center gap-3">
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                className={`h-3 rounded-full ${
                  currentSlide === index
                    ? "w-7 bg-[#00B894]"
                    : "w-3 bg-[#A7EEE1]"
                }`}
              />
            ))}
          </View>
        )}

        {/* 4. Adjust button spacing separately for each screen. */}
        <View className={currentSlide === 2 ? "mb-28" : ""}>
          <Pressable
            onPress={handleNext}
            className="h-[58px] items-center justify-center rounded-3xl bg-[#00B894] shadow-lg active:opacity-80"
          >
            <Text className="text-lg font-bold text-white">
              {currentSlide === 2 ? "Login" : "Next"}
            </Text>
          </Pressable>

          {/* 5. Show terms only on the third screen. */}
          {currentSlide === 2 && (
            <View className="mt-4 flex-row items-center justify-center px-2">
              <ShieldCheck size={24} color="#00B894" />
              <Text className="ml-2 flex-1 text-center text-xs leading-5 text-[#64748B]">
                By continuing, you agree to our{" "}
                <Text className="font-semibold text-[#00A985] underline">
                  Terms and Conditions
                </Text>{" "}
                and{" "}
                <Text className="font-semibold text-[#00A985] underline">
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
