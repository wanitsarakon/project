# Horse Delivery Character Plan

This plan assumes the character reference image from chat is saved as:

`Frontend/src/games/HorseDelivery/assetsHorse/horse-character-reference.png`

## Frame plan

- `run`: 6 frames, loop, `12 fps`
- `jump`: 6 frames, one-shot, `10 fps`
- `hit`: 3 frames, one-shot, `8 fps`

Total: `15 frames`

## Normalized output

- Export separate sheets for Phaser instead of one giant mixed sheet.
- Output cell size: `256x256`
- Output files:
  - `generated/horse-run-sheet.png`
  - `generated/horse-jump-sheet.png`
  - `generated/horse-hit-sheet.png`
  - `generated/horse-animation-manifest.json`

## Why 256x256

- Large enough for the widest frame in the reference image.
- Easy to load with `this.load.spritesheet(...)` in Phaser.
- Gives us stable collision and alignment even when the pose width changes.

## Important limitation

The chat image is a reference sheet, not a production sprite sheet:

- it has a painted dark background
- it includes section labels
- the pose boxes are not perfectly even

So this workflow solves frame planning and normalization first. It does not guarantee clean transparency around the character. If the final in-game result needs a clean cutout, the best next step is a transparent export of each pose or a cleaned source sheet.

## Run command

From `Frontend/`:

```bash
npm run crop:horse
```

If you want to use a different config file:

```bash
node tools/crop-horse-sheet.mjs path/to/custom-config.json
```
