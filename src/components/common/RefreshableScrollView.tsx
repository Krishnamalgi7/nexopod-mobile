
import React from "react";
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
} from "react-native";

interface RefreshableScrollViewProps extends ScrollViewProps {
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function RefreshableScrollView({
  refreshing,
  onRefresh,
  children,
  className,
  ...scrollViewProps
}: RefreshableScrollViewProps) {
  return (
    <ScrollView
      {...scrollViewProps}
      className={className}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#00B894"
          colors={["#00B894"]}
          progressBackgroundColor="#FFFFFF"
        />
      }
    >
      {children}
    </ScrollView>
  );
}
