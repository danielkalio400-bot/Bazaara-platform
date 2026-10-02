import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { colors } from "@bazaara/mobile-ui";
import { openBazLens } from "@/lib/baz-lens";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  showBack?: boolean;
  onBack?: () => void;
};

export function ShoppingSearchBar({ value, onChangeText, onSubmit, showBack = false, onBack }: Props) {
  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack ?? (() => router.back())}
          hitSlop={10}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
      ) : null}

      <View style={styles.shell}>
        <View pointerEvents="none" style={styles.searchGlyph}>
          <View style={styles.searchRing} />
          <View style={styles.searchHandle} />
        </View>

        <TextInput
          maxFontSizeMultiplier={1.1}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          placeholder="Search products, groceries, stores, services…"
          placeholderTextColor="#667085"
          style={styles.input}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Baz Lens visual search"
          onPress={() => void openBazLens()}
          hitSlop={6}
          style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
        >
          <View style={styles.camera}>
            <View style={styles.cameraTop} />
            <View style={styles.cameraLens} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "100%",
  },
  backButton: {
    width: 29,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backGlyph: {
    color: colors.text,
    fontSize: 38,
    lineHeight: 40,
    fontWeight: "300",
    marginTop: -3,
  },
  shell: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    paddingLeft: 14,
    paddingRight: 7,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchGlyph: { width: 23, height: 23, marginRight: 8 },
  searchRing: {
    position: "absolute",
    left: 1,
    top: 1,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2.1,
    borderColor: "#344054",
  },
  searchHandle: {
    position: "absolute",
    left: 15,
    top: 15,
    width: 8,
    height: 2.1,
    borderRadius: 2,
    backgroundColor: "#344054",
    transform: [{ rotate: "45deg" }],
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    paddingVertical: 0,
    paddingRight: 3,
    color: "#101828",
    fontSize: 14.5,
  },
  iconAction: {
    width: 34,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    width: 21,
    height: 16,
    borderWidth: 1.8,
    borderColor: "#475467",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cameraTop: {
    position: "absolute",
    top: -4,
    width: 8,
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: "#475467",
  },
  cameraLens: {
    width: 7,
    height: 7,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#475467",
  },
  pressed: { opacity: 0.7 },
});
