import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { LogOut, ArrowRight, CheckCircle2 } from "lucide-react-native";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  type?: "logout" | "service" | "success";
  showCancel?: boolean;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText,
  onCancel,
  onConfirm,
  loading = false,
  type = "logout",
  showCancel = true,
}: ConfirmationModalProps) {
  const isLogout = type === "logout";
  const accentColor = isLogout ? "#DC2626" : "#00A995";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/55 px-5">
        <View className="w-full rounded-3xl bg-white px-5 pb-6 pt-6">
          <View
            className={`h-[70px] w-[70px] self-center items-center justify-center rounded-full ${
              type === "success"
                ? "bg-[#DCFCE7]"
                : isLogout
                  ? "bg-[#FCE4E4]"
                  : "bg-[#E4F7F3]"
            }`}
          >
            {type === "success" ? (
  <CheckCircle2 size={32} color="#16A34A" />
) : isLogout ? (
  <LogOut size={32} color={accentColor} strokeWidth={2.2} />
) : (
  <ArrowRight size={32} color={accentColor} strokeWidth={2.2} />
)}
          </View>

          <Text className="mt-5 text-center text-[22px] font-extrabold text-[#171717]">
            {title}
          </Text>

          <Text className="mt-2 text-center text-base leading-6 text-[#7B8798]">
            {message}
          </Text>

          <View className="mt-7 flex-row gap-3">
            {showCancel && (
            <Pressable
              onPress={onCancel}
              disabled={loading}
              className="h-14 flex-1 items-center justify-center rounded-[28px] border border-[#E5E7EB] bg-[#F3F4F6]"
            >
              <Text className="text-lg font-bold text-[#171717]">Cancel</Text>
              
            </Pressable>
            )}

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={{ backgroundColor: accentColor }}
              className="h-14 flex-1 items-center justify-center rounded-[18px]"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-lg font-bold text-white">
                  {confirmText}
                </Text>
              )}
            </Pressable>
            
          </View>
        </View>
      </View>
    </Modal>
  );
}
