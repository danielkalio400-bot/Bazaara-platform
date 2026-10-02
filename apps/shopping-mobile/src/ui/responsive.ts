import { PixelRatio, useWindowDimensions } from "react-native";

/**
 * BAZAARA Mobile Responsive System
 *
 * React Native works in logical density-independent pixels.
 * Never style the UI against physical device resolution
 * such as 1440 × 3120.
 */

export const PHONE_BREAKPOINTS = {
  tiny: 320,
  small: 360,
  medium: 390,
  large: 430,
  tablet: 600,
} as const;

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}

export function scaleForWidth(
  width: number,
  baseValue: number
): number {
  /**
   * 390dp is our reference handset.
   *
   * Large premium Android phones such as Galaxy Ultra
   * models typically fall close to the 390–430dp class
   * after Android density conversion.
   */
  const ratio = width / 390;

  return Math.round(
    clamp(
      baseValue * ratio,
      baseValue * 0.88,
      baseValue * 1.08
    )
  );
}

export function responsiveMetrics(width: number) {
  const tiny = width < 350;
  const small = width < 375;
  const large = width >= 400;
  const extraLarge = width >= 430;
  const tablet = width >= 600;

  return {
    width,

    tiny,
    small,
    large,
    extraLarge,
    tablet,

    contentPadding:
      tablet ? 28 :
      large ? 18 :
      16,

    sectionGap:
      tablet ? 30 :
      large ? 24 :
      20,

    cardGap:
      tablet ? 18 :
      large ? 14 :
      12,

    radiusSmall: 10,
    radiusMedium: 14,
    radiusLarge:
      tablet ? 22 : 18,

    screenTitle:
      tablet ? 38 :
      small ? 29 :
      large ? 34 :
      32,

    sectionTitle:
      tablet ? 30 :
      small ? 23 :
      large ? 27 :
      25,

    productTitle:
      tablet ? 20 :
      small ? 16 :
      18,

    body:
      tablet ? 17 :
      small ? 14 :
      15,

    smallText:
      tablet ? 15 :
      13,

    eyebrow:
      tablet ? 15 :
      13,

    buttonHeight:
      tablet ? 56 :
      large ? 52 :
      50,

    inputHeight:
      tablet ? 56 :
      large ? 52 :
      50,

    iconButton:
      tablet ? 46 :
      42,

    cartImage:
      tablet ? 112 :
      small ? 78 :
      large ? 92 :
      86,

    productCardImage:
      tablet ? 230 :
      large ? 188 :
      168,

    bottomTabHeight:
      tablet ? 68 :
      60,

    maxPhoneContent:
      460,
  };
}

export function useResponsive() {
  const {
    width,
    height,
    fontScale,
  } = useWindowDimensions();

  const metrics = responsiveMetrics(width);

  return {
    ...metrics,

    height,

    /**
     * Prevent extreme system font scaling from completely
     * destroying commerce layout while still retaining
     * accessibility enlargement.
     */
    fontScale: clamp(
      fontScale,
      1,
      1.35
    ),

    pixelRatio:
      PixelRatio.get(),

    portrait:
      height >= width,
  };
}

export type ResponsiveMetrics =
  ReturnType<typeof responsiveMetrics>;