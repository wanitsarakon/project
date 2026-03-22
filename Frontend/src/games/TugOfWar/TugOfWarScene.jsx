import Phaser from "phaser";

const TUG_IFRAME_SRC = "/tugofwar/index.html";
const TUG_MESSAGE_SOURCE = "tugofwar-game";
const TUG_MESSAGE_END = "tugofwar:end";

export default class TugOfWarScene extends Phaser.Scene {
  constructor() {
    super("TugOfWarScene");
    this._overlay = null;
    this._iframe = null;
    this._messageHandler = null;
    this._cleanupDone = false;
    this._resultHandled = false;
  }

  init(data = {}) {
    this.onGameEnd = data?.onGameEnd ?? null;
    this.roomCode = data?.roomCode ?? null;
    this.player = data?.player ?? null;
    this.roundId = data?.roundId ?? null;
    this._cleanupDone = false;
    this._resultHandled = false;
  }

  preload() {}

  create() {
    this._mountOverlay();
  }

  update() {}

  shutdown() {
    this._removeOverlay();
  }

  destroy() {
    this._removeOverlay();
  }

  _mountOverlay() {
    this._removeOverlay();
    this._cleanupDone = false;
    this._resultHandled = false;

    const overlay = document.createElement("div");
    overlay.id = "tug-overlay";
    overlay.style.cssText = [
      "position: fixed",
      "inset: 0",
      "width: 100vw",
      "height: 100vh",
      "z-index: 9999",
      "background: #000",
    ].join(";");

    const iframe = document.createElement("iframe");
    const query = new URLSearchParams();
    if (this.roomCode) query.set("roomCode", String(this.roomCode));
    if (this.player?.id != null) query.set("playerId", String(this.player.id));
    if (this.roundId != null) query.set("roundId", String(this.roundId));

    iframe.src = query.toString()
      ? `${TUG_IFRAME_SRC}?${query.toString()}`
      : TUG_IFRAME_SRC;
    iframe.title = "Tug Of War";
    iframe.allow = "autoplay";
    iframe.style.cssText = [
      "display: block",
      "width: 100%",
      "height: 100%",
      "border: 0",
      "background: #000",
    ].join(";");

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    this._overlay = overlay;
    this._iframe = iframe;
    this._messageHandler = (event) => {
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (!data || data.source !== TUG_MESSAGE_SOURCE) return;
      if (data.type !== TUG_MESSAGE_END) return;

      this._handleGameEnd(data.payload);
    };

    window.addEventListener("message", this._messageHandler);
  }

  _handleGameEnd(payload = {}) {
    if (this._resultHandled) return;
    this._resultHandled = true;

    const parsedScore = Number(payload?.score);
    const score = Number.isFinite(parsedScore) ? parsedScore : 0;
    const won = Boolean(payload?.won);
    const result = {
      ...payload,
      score,
      won,
      game: "TugOfWar",
    };

    this._removeOverlay();

    if (typeof this.onGameEnd === "function") {
      this.onGameEnd(result);
      return;
    }

    if (this.scene) {
      this.scene.start("FestivalMapScene");
    }
  }

  _removeOverlay() {
    if (this._messageHandler) {
      window.removeEventListener("message", this._messageHandler);
      this._messageHandler = null;
    }

    if (this._iframe) {
      this._iframe.remove();
      this._iframe = null;
    }

    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }

    this._cleanupDone = true;
  }
}
