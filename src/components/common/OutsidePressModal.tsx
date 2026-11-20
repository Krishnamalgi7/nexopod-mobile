import { X } from "lucide-react-native";
import { ReactNode } from "react";
import {
  Modal,
  Pressable,
  View,
  type GestureResponderEvent,
} from "react-native";

interface OutsidePressModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function OutsidePressModal({
  visible,
  onClose,
  children,
}: OutsidePressModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center px-5">
        <Pressable onPress={onClose} className="absolute inset-0 bg-black/40" />

        <View
          className="relative w-full rounded-3xl bg-white p-5"
          style={{ maxHeight: "85%" }}
        >
          <Pressable
            onPress={onClose}
            className="absolute right-4 top-4 z-10 h-8 w-8 items-center justify-center rounded-full bg-gray-100"
            hitSlop={8}
          >
            <X size={19} color="#374151" />
          </Pressable>

          {children}
        </View>
      </View>
    </Modal>
  );
}
