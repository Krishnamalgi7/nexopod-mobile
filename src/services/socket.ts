
import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "@/config/api";

export interface BookingSocketEvent {
  booking: {
    id: string;
    service: string;
    startAt: string;
    status: "confirmed" | "in_progress" | "completed";
    customerName: string;
  };
}

type BookingEventName = "new_booking" | "booking_completed";

type BookingEventHandler = (
  event: BookingSocketEvent,
  eventName: BookingEventName
) => void;

let shopOwnerSocket: Socket | null = null;
let connectedToken = "";

const listeners = new Set<BookingEventHandler>();

const notifyListeners = (
  event: BookingSocketEvent,
  eventName: BookingEventName
) => {
  listeners.forEach((listener) => listener(event, eventName));
};

export const connectShopOwnerSocket = async () => {
  const token = await SecureStore.getItemAsync("shopOwnerToken");

  if (!token) {
    disconnectShopOwnerSocket();
    return null;
  }

  if (shopOwnerSocket && connectedToken !== token) {
    disconnectShopOwnerSocket();
  }

  if (!shopOwnerSocket) {
    connectedToken = token;

    shopOwnerSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
    });

    shopOwnerSocket.on("new_booking", (event: BookingSocketEvent) => {
      notifyListeners(event, "new_booking");
    });

    shopOwnerSocket.on("booking_completed", (event: BookingSocketEvent) => {
      notifyListeners(event, "booking_completed");
    });

    shopOwnerSocket.on("connect_error", (error) => {
      console.error("[Socket] Connection failed:", error.message);
    });
  }

  return shopOwnerSocket;
};

export const subscribeToBookingEvents = (
  handler: BookingEventHandler
) => {
  listeners.add(handler);

  return () => {
    listeners.delete(handler);
  };
};

export const disconnectShopOwnerSocket = () => {
  if (shopOwnerSocket) {
    shopOwnerSocket.removeAllListeners();
    shopOwnerSocket.disconnect();
    shopOwnerSocket = null;
    connectedToken = "";
  }

  listeners.clear();
};
