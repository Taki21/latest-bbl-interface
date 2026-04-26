type PrivyValue = unknown;

function textFromPrivyValue(value: PrivyValue): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  const preferredKeys = ["address", "email", "name", "url"];

  for (const key of preferredKeys) {
    const nested = record[key];
    if (typeof nested === "string") return nested;
  }

  return "";
}

export function getPrivyDisplayUser(privyUser: any) {
  return {
    name:
      textFromPrivyValue(privyUser?.name) ||
      textFromPrivyValue(privyUser?.google?.name) ||
      "User",
    email:
      textFromPrivyValue(privyUser?.email) ||
      textFromPrivyValue(privyUser?.google?.email),
    avatar:
      textFromPrivyValue(privyUser?.profilePictureUrl) ||
      textFromPrivyValue(privyUser?.google?.picture) ||
      "/logo.jpg",
  };
}
