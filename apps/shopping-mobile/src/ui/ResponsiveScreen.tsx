import type {
  PropsWithChildren,
} from "react";

import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from "react-native";

import {
  useResponsive,
} from "./responsive";

type Props = PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  scrollProps?: ScrollViewProps;
}>;

export function ResponsiveScreen({
  children,
  scroll = true,
  style,
  contentStyle,
  scrollProps,
}: Props) {
  const responsive = useResponsive();

  const inner = (
    <View
      style={[
        styles.content,
        {
          paddingHorizontal:
            responsive.contentPadding,

          maxWidth:
            responsive.tablet
              ? 720
              : responsive.maxPhoneContent,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View
        style={[
          styles.screen,
          style,
        ]}
      >
        {inner}
      </View>
    );
  }

  return (
    <ScrollView
      {...scrollProps}
      style={[
        styles.screen,
        style,
        scrollProps?.style,
      ]}
      contentContainerStyle={[
        styles.scrollContent,
        scrollProps?.contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {inner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  scrollContent: {
    flexGrow: 1,
  },

  content: {
    width: "100%",
    alignSelf: "center",
    paddingTop: 18,
    paddingBottom: 28,
  },
});