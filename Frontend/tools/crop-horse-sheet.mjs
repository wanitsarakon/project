import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const defaultConfigPath = path.join(
  projectRoot,
  "src/games/HorseDelivery/assetsHorse/horse-character-sheet.config.json",
);

function resolveFromProject(relativePath) {
  return path.resolve(projectRoot, relativePath);
}

function dataUrlToBuffer(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  return Buffer.from(base64, "base64");
}

const configPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : defaultConfigPath;

const config = JSON.parse(await fs.readFile(configPath, "utf8"));
const sourcePath = resolveFromProject(config.sourceImage);
const outputDir = resolveFromProject(config.output.directory);

try {
  await fs.access(sourcePath);
} catch {
  console.error(
    `Missing source image: ${sourcePath}\n` +
    "Save the character reference image into that path, then rerun `npm run crop:horse`.",
  );
  process.exit(1);
}

await fs.mkdir(outputDir, { recursive: true });

const sourceBuffer = await fs.readFile(sourcePath);
const sourceDataUrl = `data:image/png;base64,${sourceBuffer.toString("base64")}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  const outputs = await page.evaluate(async ({ sourceDataUrl, config }) => {
    const loadImage = (src) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });

    const image = await loadImage(sourceDataUrl);

    const makeCanvas = (width, height) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    };

    const outputSheets = [];

    for (const animation of config.animations) {
      const frameWidth = config.output.frameWidth;
      const frameHeight = config.output.frameHeight;
      const sheetCanvas = makeCanvas(frameWidth * animation.frames.length, frameHeight);
      const sheetCtx = sheetCanvas.getContext("2d");

      const frameRects = [];

      animation.frames.forEach((frame, index) => {
        const cellCanvas = makeCanvas(frameWidth, frameHeight);
        const cellCtx = cellCanvas.getContext("2d");
        const anchorY = frame.anchorY ?? animation.anchorY ?? 0.92;
        const offsetX = frame.offsetX ?? 0;
        const offsetY = frame.offsetY ?? 0;

        const maxScale = frame.maxScale ?? 1;
        const fitPaddingX = frame.fitPaddingX ?? 6;
        const fitPaddingY = frame.fitPaddingY ?? 6;
        const availableWidth = Math.max(1, frameWidth - fitPaddingX * 2);
        const availableHeight = Math.max(1, frameHeight - fitPaddingY * 2);
        const scale = Math.min(
          maxScale,
          availableWidth / frame.width,
          availableHeight / frame.height,
          1,
        );
        const destWidth = Math.round(frame.width * scale);
        const destHeight = Math.round(frame.height * scale);
        const destX = Math.round((frameWidth - destWidth) / 2 + offsetX);
        const destY = Math.round(frameHeight * anchorY - destHeight + offsetY);

        cellCtx.clearRect(0, 0, frameWidth, frameHeight);
        cellCtx.drawImage(
          image,
          frame.x,
          frame.y,
          frame.width,
          frame.height,
          destX,
          destY,
          destWidth,
          destHeight,
        );

        sheetCtx.drawImage(cellCanvas, index * frameWidth, 0);
        frameRects.push({
          index,
          source: {
            x: frame.x,
            y: frame.y,
            width: frame.width,
            height: frame.height,
          },
          destination: {
            x: destX,
            y: destY,
            width: destWidth,
            height: destHeight,
          },
        });
      });

      outputSheets.push({
        key: animation.key,
        fps: animation.fps,
        loop: Boolean(animation.loop),
        frameWidth,
        frameHeight,
        frameCount: animation.frames.length,
        fileName: animation.sheetName,
        dataUrl: sheetCanvas.toDataURL("image/png"),
        frameRects,
      });
    }

    return outputSheets;
  }, { sourceDataUrl, config });

  for (const sheet of outputs) {
    await fs.writeFile(
      path.join(outputDir, sheet.fileName),
      dataUrlToBuffer(sheet.dataUrl),
    );
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceImage: config.sourceImage,
    outputDirectory: config.output.directory,
    frameWidth: config.output.frameWidth,
    frameHeight: config.output.frameHeight,
    animations: outputs.map((sheet) => ({
      key: sheet.key,
      fileName: sheet.fileName,
      fps: sheet.fps,
      loop: sheet.loop,
      frameCount: sheet.frameCount,
      startFrame: 0,
      endFrame: sheet.frameCount - 1,
      frameRects: sheet.frameRects,
    })),
  };

  await fs.writeFile(
    path.join(outputDir, "horse-animation-manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  console.log(`Generated ${outputs.length} sprite sheets in ${outputDir}`);
  outputs.forEach((sheet) => {
    console.log(`- ${sheet.key}: ${sheet.frameCount} frames -> ${sheet.fileName}`);
  });
} finally {
  await browser.close();
}
