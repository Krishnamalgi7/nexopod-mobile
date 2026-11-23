
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Home,
  ClipboardList,
  UserRound,
} from "lucide-react-native";

type TabName = "home" | "bookings" | "profile";

interface BottomNavigationProps {
  activeTab: TabName;
}

const tabs = [
  { name: "home", label: "Home", route: "/dashboard", Icon: Home },
  { name: "bookings", label: "Bookings", route: "/bookings", Icon: ClipboardList },
  { name: "profile", label: "Profile", route: "/profile", Icon: UserRound },
] as const;

export default function BottomNavigation({
  activeTab,
}: BottomNavigationProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-around border-t border-[#E8EEF1] bg-white px-2 pb-2 pt-3">
      {tabs.map(({ name, label, route, Icon }) => {
        const isActive = activeTab === name;

        return (
          <Pressable
            key={name}
            onPress={() => router.replace(route)}
            className="flex-1 items-center"
          >
            <Icon
              size={22}
              color={isActive ? "#00A985" : "#94A3B8"}
            />
            <Text
              className={`mt-1 text-xs ${
                isActive
                  ? "font-bold text-[#00A985]"
                  : "font-medium text-[#64748B]"
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
