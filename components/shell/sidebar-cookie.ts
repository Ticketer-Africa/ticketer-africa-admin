/**
 * Plain (non-client) module so the server layout can read the saved sidebar
 * state. Importing a constant from a "use client" file gives the server a
 * client reference, not the string.
 */
export const SIDEBAR_COOKIE_NAME = "sidebar_state";
