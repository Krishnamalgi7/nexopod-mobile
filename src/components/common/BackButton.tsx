
import React from "react";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

interface BackButtonProps {
  onPress?: () => void;
  className?: string;
}

export default function BackButton({
  onPress,
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  // 1. Navigate back or execute the custom action.
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    router.back();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      className={`h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white active:bg-[#F0FDF9] ${className}`}
    >
      <ArrowLeft size={21} color="#00B894" strokeWidth={2.2} />
    </Pressable>
  );
}
