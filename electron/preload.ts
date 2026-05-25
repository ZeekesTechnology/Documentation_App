import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("documentationApp", {
  platform: process.platform,
});
