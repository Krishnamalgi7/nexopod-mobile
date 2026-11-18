
import { ActivityIndicator, Text, View } from "react-native";

interface LoaderProps {
  visible?: boolean;
  message?: string;
  fullScreen?: boolean;
}

export default function Loader({
  visible = true,
  message = "Please wait...",
  fullScreen = false,
}: LoaderProps) {
  if (!visible) return null;

  return (
    <View
      className={`items-center justify-center ${
        fullScreen
          ? "absolute inset-0 z-50 bg-white/80"
          : "py-6"
      }`}
    >
      <ActivityIndicator size="large" color="#00B894" />

      {message ? (
        <Text className="mt-3 text-sm font-medium text-[#64748B]">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
