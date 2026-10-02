import { useMemo, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@bazaara/mobile-ui";
import { parseShoppingIntent } from "../src/lib/shopping-intent";

const examples = [
  "Headphones under ₦50k",
  "Verified sellers with laptops under ₦500k",
  "New arrival sneakers",
  "Office chairs between ₦30k and ₦120k",
];
const ranges = [
  { label: "Under ₦25k", minor: "2500000" },
  { label: "Under ₦100k", minor: "10000000" },
  { label: "Under ₦500k", minor: "50000000" },
];

export default function SmartShopScreen() {
  const [phrase, setPhrase] = useState("");
  const intent = useMemo(() => parseShoppingIntent(phrase), [phrase]);
  const labels = [
    intent.q ? `“${intent.q}”` : "All categories",
    intent.maxPriceMinor ? `Under ₦${(Number(intent.maxPriceMinor) / 100).toLocaleString("en-NG")}` : null,
    intent.minPriceMinor ? `From ₦${(Number(intent.minPriceMinor) / 100).toLocaleString("en-NG")}` : null,
    intent.verifiedSeller ? "Verified sellers" : null,
    intent.sort === "newest" ? "Newest first" : null,
    intent.sort === "price_asc" ? "Lowest price first" : null,
    "In stock",
  ].filter((value): value is string => Boolean(value));

  function browse(params: Record<string, string | undefined>) {
    Keyboard.dismiss();
    router.push({ pathname: "/search-results", params: Object.fromEntries(Object.entries(params).filter((entry) => entry[1] !== undefined)) as Record<string, string> });
  }

  return <Screen style={styles.screen}>
    <View style={styles.hero}><Text style={styles.eyebrow}>BAZAARA / SMART FIND</Text>
      <Text style={styles.title}>Ask for it. <Text style={styles.accent}>Find it.</Text></Text>
      <Text style={styles.description}>Describe your product, price range or seller preference. Smart Find converts your words into live catalogue filters.</Text>
    </View>

    <View style={styles.panel}><Text style={styles.sectionTitle}>What are you looking for?</Text>
      <TextInput accessibilityLabel="Describe the product you need" multiline value={phrase} onChangeText={setPhrase} maxLength={240} placeholder="e.g. Verified headphones under ₦50k" placeholderTextColor="#7791AA" style={styles.input} />
      {phrase.trim() ? <View style={styles.plan}><Text style={styles.planHeader}>YOUR SEARCH PLAN</Text>
        <View style={styles.tags}>{labels.map((label) => <Text key={label} style={styles.tag}>{label}</Text>)}</View>
      </View> : <View style={styles.examples}>{examples.map((item) => <Pressable accessibilityRole="button" key={item} onPress={() => setPhrase(item)} style={styles.example}><Text style={styles.exampleText}>{item} ↗</Text></Pressable>)}</View>}
      <Pressable accessibilityRole="button" disabled={!phrase.trim()} onPress={() => browse(intent)} style={({ pressed }) => [styles.button, !phrase.trim() && styles.disabled, pressed && styles.pressed]}><Text style={styles.buttonText}>Show matching products →</Text></Pressable>
      <Text style={styles.disclaimer}>Smart Find uses transparent search rules. For conversational recommendations, open BazAI.</Text>
    </View>

    <Text style={styles.sectionTitle}>Shop with a budget</Text>
    <View style={styles.budgetGrid}>{ranges.map((item) => <Pressable key={item.label} accessibilityRole="button" onPress={() => browse({ maxPriceMinor: item.minor, inStock: "true", vertical: "SHOPPING", sort: "featured" })} style={({ pressed }) => [styles.budgetCard, pressed && styles.pressed]}><Text style={styles.budgetLabel}>BUDGET FINDER</Text><Text style={styles.budgetTitle}>{item.label}</Text><Text style={styles.budgetAction}>Browse items ↗</Text></Pressable>)}</View>
    <Text style={styles.sectionTitle}>Explore another way</Text>
    <View style={styles.actions}><Pressable onPress={() => browse({ verifiedSeller: "true", inStock: "true", vertical: "SHOPPING" })} style={styles.action}><Text style={styles.actionTitle}>✓ Verified sellers</Text><Text style={styles.actionSubtitle}>See products from verified merchants.</Text></Pressable><Pressable onPress={() => browse({ sort: "newest", inStock: "true", vertical: "SHOPPING" })} style={styles.action}><Text style={styles.actionTitle}>✳ New arrivals</Text><Text style={styles.actionSubtitle}>Explore newly listed products.</Text></Pressable><Pressable onPress={() => router.push("/bazai")} style={styles.action}><Text style={styles.actionTitle}>✧ Ask BazAI</Text><Text style={styles.actionSubtitle}>Open the connected shopping assistant.</Text></Pressable></View>
  </Screen>;
}

const styles = StyleSheet.create({
  screen:{backgroundColor:"#060E19",gap:17},
  hero:{backgroundColor:"#0C2238",borderRadius:22,borderWidth:1,borderColor:"#285471",padding:25,marginTop:6},
  eyebrow:{fontSize:11,color:"#83E9FF",letterSpacing:2,fontWeight:"900"},
  title:{color:"#F5FBFF",fontSize:43,letterSpacing:-2,lineHeight:47,fontWeight:"900",marginTop:14},
  accent:{color:"#69E4FF"},
  description:{fontSize:15,color:"#B7CDE1",lineHeight:23,marginTop:13},
  panel:{backgroundColor:"#121F2D",borderWidth:1,borderColor:"#2A4257",borderRadius:21,padding:18,gap:15},
  sectionTitle:{fontSize:21,color:"#F3F9FF",fontWeight:"900",letterSpacing:-.6,marginTop:9},
  input:{minHeight:93,borderRadius:14,borderWidth:1,borderColor:"#4C6378",backgroundColor:"#0A1725",color:"#F4F9FF",fontSize:16,lineHeight:23,padding:15,textAlignVertical:"top"},
  examples:{flexDirection:"row",flexWrap:"wrap",gap:9},
  example:{borderRadius:999,borderColor:"#35516A",borderWidth:1,paddingVertical:10,paddingHorizontal:13},
  exampleText:{fontSize:12,color:"#C5E7F5",fontWeight:"700"},
  plan:{gap:9},planHeader:{color:"#89DDF2",fontWeight:"900",fontSize:11,letterSpacing:1},
  tags:{flexDirection:"row",flexWrap:"wrap",gap:8},tag:{paddingVertical:8,paddingHorizontal:11,borderRadius:10,borderColor:"#39717B",borderWidth:1,backgroundColor:"#113541",color:"#B8F1FF",fontSize:12,fontWeight:"700"},
  button:{minHeight:50,backgroundColor:"#55DAFA",borderRadius:12,alignItems:"center",justifyContent:"center"},buttonText:{fontSize:15,fontWeight:"900",color:"#062333"},
  disabled:{opacity:.5},pressed:{opacity:.85},disclaimer:{color:"#8EA7BE",fontSize:12,lineHeight:18},
  budgetGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},budgetCard:{minWidth:"46%",flexGrow:1,minHeight:115,borderWidth:1,borderColor:"#2D4C65",borderRadius:16,padding:16,justifyContent:"space-between",backgroundColor:"#10233A"},
  budgetLabel:{color:"#81BDD1",fontWeight:"900",fontSize:10,letterSpacing:1},budgetTitle:{fontSize:21,color:"#FAFDFF",fontWeight:"900",letterSpacing:-.8},budgetAction:{color:"#90ECFF",fontSize:12,fontWeight:"800"},
  actions:{gap:10},action:{padding:18,borderRadius:16,borderWidth:1,borderColor:"#2B455C",backgroundColor:"#111F2F",gap:4},actionTitle:{color:"#D8F6FF",fontWeight:"800",fontSize:16},actionSubtitle:{color:"#9FB7CE",lineHeight:20,fontSize:13},
});
