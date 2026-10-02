export { verticalColors, type VerticalColorKey } from "./vertical-theme";
import { useState, type PropsWithChildren, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ColorValue,
  type ImageSourcePropType,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export const colors = {
  indigo: "#5B4DFF", indigoBright: "#7166FF", blue: "#2563EB", navy: "#0F172A",
  surface: "#182234", card: "#202C40", cardElevated: "#26354D", orange: "#F97316",
  green: "#22C55E", red: "#EF4444", text: "#F8FAFC", muted: "#AEBBD0",
  muted2: "#7E8DA6", border: "rgba(203,213,225,0.14)", borderStrong: "rgba(203,213,225,0.24)",
  white: "#FFFFFF", light: "#F8FAFC", ink: "#111827",
} as const;

export const spacing = { xs: 5, sm: 8, md: 14, lg: 20, xl: 28 } as const;
export const radius = { sm: 9, md: 14, lg: 18, pill: 999 } as const;

export function useMobileLayout() {
  const { width, height } = useWindowDimensions();
  const tablet = width >= 600;
  const compact = width < 380;
  const contentWidth = tablet ? Math.min(width, 760) : width;
  const horizontalPadding = tablet ? 22 : compact ? 13 : 16;
  const columns = tablet ? 3 : 2;
  const gap = tablet ? 14 : compact ? 8 : 10;
  const cardWidth = Math.floor((contentWidth - horizontalPadding * 2 - gap * (columns - 1)) / columns);
  return { width, height, tablet, compact, contentWidth, horizontalPadding, columns, gap, cardWidth };
}

export function Screen({ children, scroll = true, style, tabBarSafe = true, retail = false }: PropsWithChildren<{ scroll?: boolean; style?: StyleProp<ViewStyle>; tabBarSafe?: boolean; retail?: boolean }>) {
  const layout = useMobileLayout();
  const insets = useSafeAreaInsets();
  const bottomPadding = tabBarSafe ? 126 + insets.bottom : 22 + insets.bottom;
  const content = <View style={[styles.screenContent, { paddingHorizontal: layout.horizontalPadding, maxWidth: layout.tablet ? 760 : undefined, paddingBottom: bottomPadding }, style]}>{children}</View>;
  return (
    <SafeAreaView style={[styles.safeArea, retail && styles.retailSafeArea]} edges={["top", "left", "right"]}>
      {scroll ? <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function Brand({ suffix = "Shopping" }: { suffix?: string }) {
  return <View style={styles.brandRow}><Text maxFontSizeMultiplier={1.1} style={styles.brand}>BAZAARA<Text style={styles.brandDot}>.</Text></Text><View style={styles.brandDivider} /><Text maxFontSizeMultiplier={1.1} style={styles.brandSuffix}>{suffix}</Text></View>;
}

export function CartGlyph({ size = 22, color = colors.text }: { size?: number; color?: ColorValue }) {
  const wheel = Math.max(3, Math.round(size * 0.16));
  return <View style={{ width: size, height: size }}>
    <View style={{ position: "absolute", left: 2, top: 2, width: Math.round(size * 0.27), height: 2, backgroundColor: color, transform: [{ rotate: "18deg" }] }} />
    <View style={{ position: "absolute", left: Math.round(size * 0.22), top: Math.round(size * 0.25), width: Math.round(size * 0.64), height: Math.round(size * 0.42), borderWidth: 2, borderColor: color, borderRadius: 3 }} />
    <View style={{ position: "absolute", left: Math.round(size * 0.28), bottom: 1, width: wheel, height: wheel, borderRadius: wheel, backgroundColor: color }} />
    <View style={{ position: "absolute", right: Math.round(size * 0.08), bottom: 1, width: wheel, height: wheel, borderRadius: wheel, backgroundColor: color }} />
  </View>;
}

export function CartButton({ count, onPress }: { count?: number; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Cart${count ? `, ${count} items` : ""}`} onPress={onPress} style={({ pressed }) => [styles.cartButton, pressed && styles.pressed]}>
    <CartGlyph size={21} />
    {typeof count === "number" && count > 0 ? <View style={styles.cartBadge}><Text maxFontSizeMultiplier={1.05} style={styles.cartBadgeText}>{count > 99 ? "99+" : count}</Text></View> : null}
  </Pressable>;
}

export function SectionTitle({ eyebrow, title, action, retail = false }: { eyebrow?: string; title: string; action?: ReactNode; retail?: boolean }) {
  return <View style={styles.sectionHead}><View style={{ flex: 1 }}>{eyebrow ? <Text maxFontSizeMultiplier={1.1} style={[styles.eyebrow, retail && styles.retailEyebrow]}>{eyebrow}</Text> : null}<Text maxFontSizeMultiplier={1.1} style={[styles.sectionTitle, retail && styles.retailSectionTitle]}>{title}</Text></View>{action}</View>;
}

export function Button({ label, onPress, kind = "primary", disabled = false, loading = false, compact = false }:
  { label: string; onPress?: () => void; kind?: "primary" | "secondary" | "danger" | "orange"; disabled?: boolean; loading?: boolean; compact?: boolean }) {
  const background = kind === "orange" ? colors.orange : kind === "danger" ? colors.red : kind === "secondary" ? colors.card : colors.indigo;
  return <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, compact && styles.buttonCompact, { backgroundColor: background }, kind === "secondary" && styles.secondaryButton, (disabled || loading) && styles.disabled, pressed && styles.pressed]}>{loading ? <ActivityIndicator color={colors.white} /> : <Text maxFontSizeMultiplier={1.1} style={styles.buttonText}>{label}</Text>}</Pressable>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) { return <View style={[styles.card, style]}>{children}</View>; }

export function Field({ label, error, multiline, keyboardType, ...props }: TextInputProps & { label: string; error?: string; keyboardType?: KeyboardTypeOptions }) {
  return <View style={styles.fieldWrap}><Text maxFontSizeMultiplier={1.1} style={styles.fieldLabel}>{label}</Text><TextInput maxFontSizeMultiplier={1.15} placeholderTextColor={colors.muted2} multiline={multiline} keyboardType={keyboardType} style={[styles.field, multiline && styles.fieldMultiline, error ? styles.fieldError : null]} {...props} />{error ? <Text maxFontSizeMultiplier={1.1} style={styles.errorText}>{error}</Text> : null}</View>;
}

export function Pill({ label, active = false, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}><Text maxFontSizeMultiplier={1.08} numberOfLines={1} style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text></Pressable>;
}

export function Status({ label, kind = "neutral" }: { label: string; kind?: "success" | "danger" | "neutral" | "accent" }) {
  const tone = kind === "success" ? colors.green : kind === "danger" ? colors.red : kind === "accent" ? colors.orange : colors.muted;
  return <View style={[styles.status, { borderColor: tone }]}><Text maxFontSizeMultiplier={1.08} style={[styles.statusText, { color: tone }]}>{label}</Text></View>;
}

export type MobileProductCardProps = {
  /** White/orange retail treatment for the Shopping storefront; opt-in. */
  retail?: boolean;
  image?: string | ImageSourcePropType | null;
  brand?: string | null;
  title: string;
  price: string;
  oldPrice?: string | null;
  seller?: string | null;
  discount?: string | null;
  inStock?: boolean;
  saved?: boolean;
  onPress?: () => void;
  onAdd?: () => void;
  onSave?: () => void;
  onSeller?: () => void;
  addBusy?: boolean;
  quantity?: number;
  maxQuantity?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
};

export function ProductCard(props: MobileProductCardProps) {
  const source = typeof props.image === "string" ? { uri: props.image } : props.image ?? undefined;
  const [imageFailed, setImageFailed] = useState(false);
  const layout = useMobileLayout();
  return <View style={[styles.productCard, props.retail && styles.retailProductCard, { width: layout.cardWidth }]}>
    <View style={[styles.productMedia, props.retail && styles.retailProductMedia]}>
      {source && !imageFailed ? <Image source={source} style={styles.productImage} resizeMode="cover" onError={() => setImageFailed(true)} /> : <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>BAZAARA</Text></View>}
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${props.title}`} onPress={props.onPress} style={StyleSheet.absoluteFill} />
      {props.discount ? <View pointerEvents="none" style={styles.discount}><Text maxFontSizeMultiplier={1.05} style={styles.discountText}>{props.discount}</Text></View> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={props.saved ? `Remove ${props.title} from Wishlist` : `Save ${props.title}`} onPress={props.onSave} style={styles.heart} hitSlop={8}><Text maxFontSizeMultiplier={1.05} style={[styles.heartText, props.saved && { color: colors.orange }]}>{props.saved ? "♥" : "♡"}</Text></Pressable>
    </View>
    <View style={[styles.productBody, props.retail && styles.retailProductBody]}>
      <Pressable accessibilityRole="button" onPress={props.onPress}>
        {props.brand ? <Text maxFontSizeMultiplier={1.08} style={[styles.productBrand, props.retail && styles.retailProductBrand]}>{props.brand}</Text> : null}
        <Text maxFontSizeMultiplier={1.1} numberOfLines={2} style={[styles.productTitle, props.retail && styles.retailProductTitle]}>{props.title}</Text>
        <View style={styles.priceRow}><Text maxFontSizeMultiplier={1.08} style={[styles.price, props.retail && styles.retailProductPrice]}>{props.price}</Text>{props.oldPrice ? <Text maxFontSizeMultiplier={1.08} style={styles.oldPrice}>{props.oldPrice}</Text> : null}</View>
        <Text maxFontSizeMultiplier={1.08} style={[styles.stock, props.retail && styles.retailProductStock, !props.inStock && { color: colors.red }]}>{props.inStock ? "In stock" : "Out of stock"}</Text>
      </Pressable>
      {props.seller ? <Pressable onPress={props.onSeller} disabled={!props.onSeller}><Text maxFontSizeMultiplier={1.08} numberOfLines={1} style={[styles.seller, props.retail && styles.retailProductSeller, props.onSeller && styles.sellerLink]}>{props.seller}{props.onSeller ? " ›" : ""}</Text></Pressable> : null}
      {(props.quantity ?? 0) > 0 ? (
        <View style={[styles.inlineQty, props.retail && styles.retailInlineQty]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${props.title} quantity`} disabled={props.addBusy} onPress={props.onDecrement} style={({ pressed }) => [styles.inlineQtyButton, props.retail && styles.retailInlineQtyButton, pressed && styles.pressed, props.addBusy && styles.disabled]}>
            <Text style={styles.inlineQtyButtonText}>−</Text>
          </Pressable>
          <Text maxFontSizeMultiplier={1.05} style={[styles.inlineQtyValue, props.retail && styles.retailInlineQtyValue]}>{props.quantity}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${props.title} quantity`} disabled={props.addBusy || (!!props.maxQuantity && (props.quantity ?? 0) >= props.maxQuantity)} onPress={props.onIncrement} style={({ pressed }) => [styles.inlineQtyButton, props.retail && styles.retailInlineQtyButton, pressed && styles.pressed, (props.addBusy || (!!props.maxQuantity && (props.quantity ?? 0) >= props.maxQuantity)) && styles.disabled]}>
            <Text style={styles.inlineQtyButtonText}>+</Text>
          </Pressable>
        </View>
      ) : (
        <Button label={props.addBusy ? "Adding…" : "Add to cart"} onPress={props.onAdd} disabled={!props.inStock || props.addBusy} kind={props.retail ? "orange" : "primary"} compact />
      )}
    </View>
  </View>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <Card style={styles.empty}><Text maxFontSizeMultiplier={1.1} style={styles.emptyTitle}>{title}</Text><Text maxFontSizeMultiplier={1.1} style={styles.emptyText}>{message}</Text>{action}</Card>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.navy },
  retailSafeArea: { backgroundColor: "#F5F5F5" },
  scrollContent: { flexGrow: 1 },
  screenContent: { width: "100%", alignSelf: "center", flexGrow: 1, paddingTop: 4, backgroundColor: colors.navy },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { color: colors.text, fontWeight: "900", fontSize: 18, letterSpacing: -0.8 },
  brandDot: { color: colors.indigoBright },
  brandDivider: { width: 1, height: 20, backgroundColor: colors.borderStrong },
  brandSuffix: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  cartButton: { width: 42, height: 42, borderRadius: 11, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  cartBadge: { position: "absolute", right: -4, top: -5, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: colors.orange },
  cartBadgeText: { color: colors.white, fontSize: 9, fontWeight: "900" },
  sectionHead: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 17, marginBottom: 10 },
  retailEyebrow: { color: "#B65F0C" },
  retailSectionTitle: { color: "#292929" },
  eyebrow: { color: colors.orange, fontSize: 9, fontWeight: "900", letterSpacing: 1.05, textTransform: "uppercase" },
  sectionTitle: { color: colors.text, fontSize: 20, lineHeight: 23, fontWeight: "900", letterSpacing: -0.5, marginTop: 3 },
  button: { minHeight: 43, borderRadius: radius.sm, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  buttonCompact: { minHeight: 38 },
  secondaryButton: { borderWidth: 1, borderColor: colors.borderStrong },
  buttonText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, padding: 12 },
  fieldWrap: { gap: 5, marginBottom: 8 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  field: { minHeight: 42, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, paddingHorizontal: 10, backgroundColor: colors.card, color: colors.text, fontSize: 13 },
  fieldMultiline: { minHeight: 80, paddingTop: 9, textAlignVertical: "top" },
  fieldError: { borderColor: colors.red },
  errorText: { color: "#FCA5A5", fontSize: 10 },
  pill: { minHeight: 34, paddingHorizontal: 11, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  pillActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  pillText: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  pillTextActive: { color: colors.white },
  status: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 4, alignSelf: "flex-start" },
  statusText: { fontSize: 9, fontWeight: "800" },
  retailProductCard: { backgroundColor: "#FFFFFF", borderColor: "#E8E8E8", borderRadius: 8 },
  retailProductMedia: { backgroundColor: "#FFFFFF" },
  retailProductBody: { backgroundColor: "#FFFFFF" },
  retailProductBrand: { color: "#875522" },
  retailProductTitle: { color: "#292929" },
  retailProductPrice: { color: "#D46E0A" },
  retailProductStock: { color: "#247D4A" },
  retailInlineQty: { backgroundColor: "#FFF8F0", borderColor: "#E6A65D" },
  retailInlineQtyButton: { backgroundColor: "#E9861C" },
  retailInlineQtyValue: { color: "#292929" },
  retailProductSeller: { color: "#666666" },
  productCard: { overflow: "hidden", borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 10, alignSelf: "flex-start" },
  productMedia: { aspectRatio: 1.08, backgroundColor: colors.light },
  productImage: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#E7EBF2" },
  imagePlaceholderText: { color: "#64748B", fontWeight: "900", fontSize: 9 },
  discount: { position: "absolute", zIndex: 2, top: 7, left: 7, paddingHorizontal: 6, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.orange },
  discountText: { color: colors.white, fontWeight: "900", fontSize: 9 },
  heart: { position: "absolute", zIndex: 3, top: 7, right: 7, width: 31, height: 31, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,23,42,0.82)", borderWidth: 1, borderColor: "rgba(255,255,255,0.65)" },
  heartText: { color: colors.white, fontSize: 18, lineHeight: 20 },
  productBody: { padding: 9, gap: 4, height: 156, justifyContent: "space-between" },
  productBrand: { color: colors.muted2, fontSize: 8, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 3 },
  productTitle: { minHeight: 31, maxHeight: 32, color: colors.text, fontSize: 11.2, lineHeight: 15.5, fontWeight: "700" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 5, flexWrap: "wrap" },
  price: { color: colors.orange, fontWeight: "900", fontSize: 14 },
  oldPrice: { color: colors.muted2, fontSize: 8.5, textDecorationLine: "line-through" },
  stock: { color: colors.green, fontSize: 8.5, fontWeight: "800", marginTop: 4 },
  seller: { color: colors.muted2, fontSize: 8.5, minHeight: 13 },
  sellerLink: { color: colors.indigoBright, fontWeight: "700" },
  inlineQty: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: radius.sm, overflow: "hidden", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.indigoBright },
  inlineQtyButton: { width: 38, alignSelf: "stretch", alignItems: "center", justifyContent: "center", backgroundColor: colors.indigo },
  inlineQtyButtonText: { color: colors.white, fontSize: 20, lineHeight: 22, fontWeight: "800" },
  inlineQtyValue: { minWidth: 28, textAlign: "center", color: colors.text, fontSize: 13, fontWeight: "900" },
  empty: { marginTop: 18, alignItems: "center", gap: 7, paddingVertical: 22 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "900", textAlign: "center" },
  emptyText: { color: colors.muted, lineHeight: 17, fontSize: 12, textAlign: "center", marginBottom: 7 },
});
