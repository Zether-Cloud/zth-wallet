const { app, Menu, ipcMain, shell } = require("electron");

module.exports = function(mainWindow) {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Exit",
          click() {
            app.quit();
          }
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
        { role: "selectall" }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload();
          }
        },
        {
          label: "Toggle Developer Tools",
          accelerator: process.platform === "darwin"
            ? "Alt+Command+I"
            : "Ctrl+Shift+I",
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          }
        },
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      role: "window",
      submenu: [
        { role: "minimize" },
        { role: "close" }
      ]
    },
    {
      role: "help",
      submenu: [
        {
          label: "About the ZTH wallet",
          click() {
            const infoData = { version: app.getVersion() };
            mainWindow.webContents.send("showAboutDialog", infoData);
          }
        },
        {
          label: "ZTH documentation",
          click() {
            try {
              shell.openExternal("https://zether.org");
            } catch (err) {
              console.error("Failed to open ZTH Documentation page:", err);
            }
          }
        },
        {
          label: "Report issue on GitHub",
          click() {
            try {
              shell.openExternal("https://github.com/zether-cloud/zth-wallet/issues");
            } catch (err) {
              console.error("Failed to open GitHub Issues page:", err);
            }
          }
        },
        {
          label: "Official Website",
          click() {
            try {
              shell.openExternal("https://zether.org");
            } catch (err) {
              console.error("Failed to open the Zether official website:", err);
            }
          }
        }
      ]
    }
  ];

  if (process.platform === "darwin") {
    const name = app.getName();
    template.unshift({
      label: name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services", submenu: [] },
        { type: "separator" },
        { role: "hide" },
        { role: "hideothers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    });

    template[1].submenu.push(
      { type: "separator" },
      {
        label: "Speech",
        submenu: [
          { role: "startspeaking" },
          { role: "stopspeaking" }
        ]
      }
    );

    template[3].submenu = [
      { label: "Close", accelerator: "CmdOrCtrl+W", role: "close" },
      { label: "Minimize", accelerator: "CmdOrCtrl+M", role: "minimize" },
      { label: "Zoom", role: "zoom" },
      { type: "separator" },
      { label: "Bring All to Front", role: "front" }
    ];
  }

  ipcMain.on("openURL", (event, arg) => {
    shell.openExternal(arg);
  });

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
