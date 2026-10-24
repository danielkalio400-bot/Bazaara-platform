import assert from "node:assert/strict";
import path from "node:path";

export async function verifyColorScopes(page, output) {
  await page.getByRole("button", { name: "Color", exact: true }).click();
  for (const [mode, label] of Object.entries({
    histogram: "RGB histogram",
    waveform: "Luma waveform",
    parade: "RGB parade",
    vectorscope: "Vectorscope",
  })) {
    await page.getByLabel("Color scope", { exact: true }).selectOption(mode);
    await page.waitForFunction((label) => {
      const canvas = document.querySelector(
        `canvas[aria-label="${label} of the preview"]`,
      );
      if (!canvas) return false;
      const data = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let colored = 0;
      for (let i = 0; i < data.length; i += 4)
        if (
          Math.max(data[i], data[i + 1], data[i + 2]) -
            Math.min(data[i], data[i + 1], data[i + 2]) >
          60
        )
          colored++;
      return colored > 80;
    }, label);
  }
  await page
    .getByRole("img", { name: "Vectorscope of the preview", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(output, "color-vectorscope-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("slider", { name: /^Brightness/ }).focus();
  await page.getByRole("slider", { name: /^Brightness/ }).press("Home");
  await page.waitForFunction(() => {
    const text = document.querySelector(
      '[aria-label="Preview luma statistics"]',
    )?.textContent;
    const mean = text?.match(/mean ([\d.]+)%/);
    return mean && Number(mean[1]) < 5;
  });
  await page
    .getByRole("button", { name: "Reset color adjustments", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      Number(
        document
          .querySelector('[aria-label="Preview luma statistics"]')
          ?.textContent?.match(/mean ([\d.]+)%/)?.[1],
      ) > 5,
  );
  await page
    .getByLabel("Color scope", { exact: true })
    .selectOption("waveform");
  const canvas = page.getByRole("img", {
    name: "Luma waveform of the preview",
    exact: true,
  });
  await page.waitForTimeout(250);
  const before = await canvas.evaluate((el) => el.toDataURL());
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForFunction((before) => {
    const canvas = document.querySelector(
      'canvas[aria-label="Luma waveform of the preview"]',
    );
    return (
      document.querySelector('button[aria-label="Pause"]') &&
      canvas?.toDataURL() !== before
    );
  }, before);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByLabel("Timeline playhead", { exact: true }).focus();
  await page.getByLabel("Timeline playhead", { exact: true }).press("Home");
  assert.match(
    await page
      .getByLabel("Preview luma statistics", { exact: true })
      .innerText(),
    /Luma: min/,
  );
  console.log(
    "PASS: histogram/waveform/parade/vectorscope traces, adjustment feedback and updates during playback",
  );
}
