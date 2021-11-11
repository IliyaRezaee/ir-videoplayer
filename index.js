const {
    app,
    BrowserWindow,
    Menu,
    Tray,
    nativeImage,
    ipcMain,
    dialog,
} = require("electron");

let mainWindow;
let tray;
let isHideOnTray = false;
let mainMenuTemplate;
let player_playing = false;

process.env.NODE_ENV = "development";

app.on("ready", () => {
    // system tray ico setup
    const icon = nativeImage.createFromPath("src/assets/icon.png");
    tray = new Tray(icon);

    const contextMenu = [
        {
            label: isHideOnTray
                ? "Show IR Player"
                : "Hide IR Player from taskbar",
            click() {
                isHideOnTray ? mainWindow.show() : mainWindow.hide();
                isHideOnTray = !isHideOnTray;

                // change the label and rerender the context menu
                (contextMenu[0].label = isHideOnTray
                    ? "Show IR Player"
                    : "Hide IR Player from taskbar"),
                    tray.setContextMenu(Menu.buildFromTemplate(contextMenu));
            },
        },
        { type: "separator" },
        {
            label: "Play",
            click() {
                if (!player_playing) {
                    mainWindow.webContents.send("playback-control__play", null);
                } else {
                    mainWindow.webContents.send(
                        "playback-control__pause",
                        null
                    );
                }
                player_playing = !player_playing;
                // update the label and rerender the menu
                contextMenu[2].label = player_playing ? "Puase" : "Play";
                tray.setContextMenu(Menu.buildFromTemplate(contextMenu));
            },
        },
        {
            label: "Increase volumne",
            click() {
                mainWindow.webContents.send(
                    "playback-control__increase-volumne",
                    null
                );
            },
        },
        {
            label: "Decrease volumne",
            click() {
                mainWindow.webContents.send(
                    "playback-control__decrease-volumne",
                    null
                );
            },
        },
        { type: "separator" },

        {
            label: "Open Video",
            accelerator: "Ctrl+O",
            click() {
                ask_for_file(
                    "Video",
                    ["mp4", "mkv", "avi"],
                    "answer-for-file__video"
                );
            },
        },
        {
            label: "Open Subtitle",
            accelerator: "Ctrl+Shift+O",
            click() {
                ask_for_file(
                    "Subtitle",
                    ["srt", "vtt", "sub"],
                    "answer-for-file__subtitle"
                );
            },
        },
        { type: "separator" },
        {
            label: "Quit",
            click() {
                app.quit();
            },
        },
    ];

    tray.setContextMenu(Menu.buildFromTemplate(contextMenu));

    // setup main menu
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainMenuTemplate = [
        {
            label: "File",
            submenu: [
                {
                    label: "Open Video",
                    accelerator: "Ctrl+O",
                    click() {
                        ask_for_file(
                            "Video",
                            ["mp4", "mkv", "avi"],
                            "answer-for-file__video"
                        );
                    },
                },
                {
                    label: "Open Subtitle",
                    accelerator: "Ctrl+Shift+O",
                    click() {
                        ask_for_file(
                            "Subtitle",
                            ["srt", "vtt", "sub"],
                            "answer-for-file__subtitle"
                        );
                    },
                },
                { type: "separator" },
                {
                    label: "Quit",
                    accelerator: "Ctrl+Q",
                    click() {
                        app.quit();
                    },
                },
            ],
        },
    ];

    // Add developer tools option if in dev
    if (process.env.NODE_ENV !== "production") {
        mainMenuTemplate.push({
            label: "Developer Tools",
            submenu: [
                {
                    role: "reload",
                },
                {
                    label: "Toggle DevTools",
                    accelerator: "Ctrl+I",
                    click(item, focusedWindow) {
                        focusedWindow.toggleDevTools();
                    },
                },
            ],
        });
    }
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.loadFile("src/index.html");
});

const ask_for_file = async (file_format, file_types, channel) => {
    const file = await dialog.showOpenDialog(mainWindow, {
        properties: ["openFile"],
        filters: [{ name: file_format, extensions: file_types }],
    });

    if (!file.canceled) {
        // send it back to the renderer
        mainWindow.webContents.send(channel, file.filePaths[0]);
    }

    console.log(file);
};

// listening on messages from video from renderer
ipcMain.on("ask-for-file__video", (e) => {
    ask_for_file("Video", ["mp4", "mkv", "avi"], "answer-for-file__video");
});

// listening on messages from subtitle from renderer
ipcMain.on("ask-for-file__subtitle", (e) => {
    ask_for_file(
        "Subtitle",
        ["srt", "vtt", "sub"],
        "answer-for-file__subtitle"
    );
});
