export const PLAYER_NAME_MAX_LENGTH = 20;
export const PLAYER_NAME_ALLOWED_MESSAGE =
  "ใช้ได้เฉพาะภาษาไทย ภาษาอังกฤษ และเว้นวรรค";

const asciiLetterPattern = /^[A-Za-z]$/;
const thaiScriptPattern = /^\p{Script=Thai}$/u;
const letterOrMarkPattern = /^[\p{Letter}\p{Mark}]$/u;

function isAllowedPlayerNameCharacter(char) {
  if (char === " ") {
    return true;
  }

  if (asciiLetterPattern.test(char)) {
    return true;
  }

  return thaiScriptPattern.test(char) && letterOrMarkPattern.test(char);
}

export function hasUnsupportedPlayerNameChars(value = "") {
  return Array.from(String(value)).some((char) => {
    if (/\s/u.test(char)) {
      return false;
    }

    return !isAllowedPlayerNameCharacter(char);
  });
}

export function sanitizePlayerNameInput(value = "") {
  return Array.from(String(value))
    .map((char) => (/\s/u.test(char) ? " " : char))
    .filter((char) => isAllowedPlayerNameCharacter(char))
    .join("")
    .replace(/ {2,}/g, " ")
    .slice(0, PLAYER_NAME_MAX_LENGTH);
}

export function normalizePlayerName(value = "") {
  return sanitizePlayerNameInput(value).trim();
}

export function validatePlayerName(value = "") {
  const normalizedName = normalizePlayerName(value);

  if (!normalizedName) {
    return {
      valid: false,
      normalizedName,
      error: "กรุณากรอกชื่อ",
    };
  }

  if (normalizedName.length > PLAYER_NAME_MAX_LENGTH) {
    return {
      valid: false,
      normalizedName,
      error: `ชื่อต้องไม่เกิน ${PLAYER_NAME_MAX_LENGTH} ตัวอักษร`,
    };
  }

  if (Array.from(normalizedName).some((char) => !isAllowedPlayerNameCharacter(char))) {
    return {
      valid: false,
      normalizedName,
      error: PLAYER_NAME_ALLOWED_MESSAGE,
    };
  }

  return {
    valid: true,
    normalizedName,
    error: "",
  };
}
