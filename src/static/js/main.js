const { ipcRenderer } = require("electron");
const querystring = require("querystring");
const subsrt = require("subsrt");
const url = require("url");

const video_url_element = document.querySelector("#video-url");
const subtitle_url_element = document.querySelector("#subtitle-url");
const form = document.querySelector("form");
const video_file_picker = document.querySelector("#video-file-picker");
const subtitle_file_picker = document.querySelector("#subtitle-file-picker");

let player;

const convertToVTT = async (subtitle) => {
    const response = await fetch(subtitle);
    const text = await response.text();
    const vtt = subsrt.convert(text, { format: "vtt" });
    const url = URL.createObjectURL(new Blob([vtt], { type: "text/plain" }));
    return url;
};

// play
form.onsubmit = async (e) => {
    e.preventDefault();
    const video = video_url_element.value;
    const subtitle = subtitle_url_element.value;
    const vtt_url = subtitle && (await convertToVTT(subtitle));

    // create video element
    const video_parent = document.querySelector("#video-parent");
    video_parent.innerHTML = `
    <video id="player" class="mb-0 img-fluid" controls>
        <source src="${video}" />
        <track src="${vtt_url}" kind="captions" default />
        <p>This browser does not #support the video element.</p>
    </video>
    `;
    player = new Plyr("#player");
};

// asking for file
const ask_for_file = (file_format, file_types) => {
    // send to the main process
    ipcRenderer.send("ask-for-file", {
        file_format: file_format,
        file_types: file_types,
    });
};

video_file_picker.onclick = (e) => {
    // send to the main process
    ipcRenderer.send("ask-for-file__video", null);
};

subtitle_file_picker.onclick = (e) => {
    // send to the main process
    ipcRenderer.send("ask-for-file__subtitle", null);
};

// get video from the main process
ipcRenderer.on("answer-for-file__video", (e, filePath) => {
    const path = encodeURI(
        url.format({
            pathname: filePath,
            protocol: "file",
        })
    );

    video_url_element.value = path;
});

// get subtitle from the main process
ipcRenderer.on("answer-for-file__subtitle", (e, filePath) => {
    // debugger;
    const path = encodeURI(
        url.format({
            pathname: filePath,
            protocol: "file",
        })
    );

    subtitle_url_element.value = path;
});

// listening on playback events
ipcRenderer.on("playback-control__play", () => player.play());
ipcRenderer.on("playback-control__pause", () => player.pause());
ipcRenderer.on("playback-control__increase-volumne", () =>
    player.increaseVolume(0.1)
);
ipcRenderer.on("playback-control__decrease-volumne", () =>
    player.decreaseVolume(0.1)
);
