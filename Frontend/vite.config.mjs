import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        qa: fileURLToPath(new URL("./qa.html", import.meta.url)),
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/phaser")) {
            return "phaser";
          }

          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom")
          ) {
            return "react-vendor";
          }

          if (id.includes("/src/games/")) {
            if (id.includes("/src/games/FishScooping/")) return "game-fish";
            if (id.includes("/src/games/HorseDelivery/")) return "game-horse";
            if (id.includes("/src/games/WorshipBooth/")) return "game-worship";
            if (id.includes("/src/games/BoxingGame/")) return "game-boxing";
            if (id.includes("/src/games/CookingGame/")) return "game-cooking";
            if (id.includes("/src/games/BalloonShoot/")) return "game-balloon";
            if (id.includes("/src/games/DollGame/")) return "game-doll";
            if (id.includes("/src/games/FlowerGame/")) return "game-flower";
            if (id.includes("/src/games/HauntedHouse/")) return "game-haunted";
            if (id.includes("/src/games/TugOfWar/")) return "game-tug";
            return "game-core";
          }
        },
      },
    },
  },
});
