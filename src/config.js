function trimTrailingSlash(value) {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

export const APP_CONFIG = {
  appName: process.env.REACT_APP_APP_NAME || "NB N-gram Utforsker",
  shareBaseUrl: trimTrailingSlash(process.env.REACT_APP_SHARE_BASE_URL || "")
};
