import { BrowserWindow, Menu, app, dialog, shell } from "electron";
import { getCurrentVersion } from "./updater";

export function setApplicationMenu(mainWindow: BrowserWindow): void {
  const sendOpenUpdate = (): void => {
    if (mainWindow.isDestroyed()) {
      return;
    }

    mainWindow.webContents.send("help:open-update");
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  };

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [{ role: "quit", label: "Exit MenschDocs" }],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    {
      label: "Help",
      submenu: [
        {
          label: "Search for Update",
          click: sendOpenUpdate,
        },
        { type: "separator" },
        {
          label: "MenschDocs on GitHub",
          click: () => {
            void shell.openExternal(
              "https://github.com/ZeekesTechnology/Documentation_App"
            );
          },
        },
        {
          label: "About MenschDocs",
          click: () => {
            void dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About MenschDocs",
              message: "MenschDocs",
              detail: `Version ${getCurrentVersion()}\nInternal documentation platform`,
            });
          },
        },
      ],
    },
  ];

  if (process.platform === "darwin") {
    template.unshift({
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
