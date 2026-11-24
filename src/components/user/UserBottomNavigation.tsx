import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, CalendarDays, UserRound } from "lucide-react-native";

type TabName = "home" | "bookings" | "profile";

export default function UserBottomNavigation({
  activeTab,
}: {
  activeTab: TabName;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: "home" as const, label: "Home", route: "/user/home", Icon: House },
    {
      name: "bookings" as const,
      label: "Bookings",
      route: "/user/booking",
      Icon: CalendarDays,
    },
    {
      name: "profile" as const,
      label: "Profile",
      route: "/user/profile",
      Icon: UserRound,
    },
  ];

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: Math.max(insets.bottom, 10),
        left: 0,
        right: 0,
        zIndex: 100,
        elevation: 10,
      }}
    >
      <View
        className="mx-7 flex-row items-center rounded-full bg-white px-2 py-1.5"
        style={{
          height: 70,
          shadowColor: "#142D46",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.13,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        {tabs.map(({ name, label, route, Icon }) => {
          const active = activeTab === name;

          return (
            <Pressable
              key={name}
              onPress={() =>
                router.replace(
                  route as "/user/home" | "/user/booking" | "/user/profile",
                )
              }
              className="flex-1 items-center justify-center"
            >
              <View
                className={`h-[56px] w-[92%] items-center justify-center rounded-full ${
                  active ? "bg-[#E4F7F3]" : "bg-transparent"
                }`}
              >
                <Icon
                  size={24}
                  color={active ? "#00A995" : "#64748B"}
                  strokeWidth={2}
                />
                <Text
                  className={`mt-0.5 text-xs ${
                    active
                      ? "font-bold text-[#00A995]"
                      : "font-medium text-[#64748B]"
                  }`}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
