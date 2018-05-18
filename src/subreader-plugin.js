const Plugin = videojs.getPlugin("plugin");
const MenuButton = videojs.getComponent("MenuButton");
const Menu = videojs.getComponent("Menu");
const Component = videojs.getComponent("Component");

class SubReaderPlugin extends Plugin {
  constructor(player, options) {
    super(player, options);

    player.on("ready", () => {
      const subreaderMenuButton = player.controlBar.addChild(
        "subReaderMenuButton"
      );
      player.controlBar.subreader = subreaderMenuButton;

      const controlBarEl = player.controlBar.el();
      controlBarEl.insertBefore(
        subreaderMenuButton.el(),
        controlBarEl.firstChild.nextSibling
      );
    });

    player.on("pause", function() {
      console.log("Paused");
    });
    player.on("ended", function() {
      console.log("Ended");
    });
    player.on("playing", function() {
      console.log("Playing");
    });
    player.on("seeking", function() {
      console.log("Seeking");
    });
    player.on("timeupdate", function() {
      console.log("TimeUpdate", Math.floor(player.currentTime() * 1000));
    });

    this.getSubtitles().then(subtitles => {
      console.log("subtitles", subtitles);
    });
  }

  getTracks() {
    const tracks = this.player.textTracks();
    return new Promise(resolve => {
      function handleAddTrack() {
        const _tracks = [];
        for (let i = 0; i < tracks.length; i++) {
          _tracks.push(tracks[i]);
        }
        tracks.removeEventListener("addtrack", handleAddTrack);
        resolve(_tracks);
      }

      tracks.addEventListener("addtrack", handleAddTrack);
    });
  }

  getSubtitles(cb) {
    return this.getTracks()
      .then(tracks => {
        return tracks.map(track => {
          return new Promise(resolve => {
            function handleCues() {
              const cues = [];
              for (let j = 0; j < track.cues.length; j++) {
                const cue = track.cues[j];
                const div = document.createElement("div");
                div.innerHTML = cue.text;
                cues.push({
                  text: div.innerText,
                  timeIn: Math.floor(cue.startTime * 1000),
                  timeOut: Math.floor(cue.endTime * 1000)
                });
              }
              track.oncuechange = null;
              track.removeEventListener("loadeddata", handleCues);
              resolve({
                language: track.language,
                cues
              });
            }
            track.oncuechange = handleCues;
            track.addEventListener("loadeddata", handleCues);
          });
        });
      })
      .then(subtitles => Promise.all(subtitles));
  }
}

class SubReaderMenuButton extends MenuButton {
  constructor(player, options) {
    super(player, options);
    this.controlText("SubReader");
  }

  update() {
    const menu = this.createMenu();

    if (this.menu) {
      this.menu.dispose();
      this.removeChild(this.menu);
    }

    this.menu = menu;
    this.addChild(menu);

    this.buttonPressed_ = false;
    this.menuButton_.el_.setAttribute("aria-expanded", "false");
    this.show();
  }

  createMenu() {
    return new SubReaderMenu(this.player_);
  }

  buildCSSClass() {
    return `vjs-subreader-button ${super.buildCSSClass()}`;
  }
}

class SubReaderMenu extends Menu {
  createEl() {
    const el = document.createElement("div");
    el.className = "vjs-subreader-qr-container";
    this.contentEl_ = el;
    return el;
  }
}

Component.registerComponent("SubReaderMenu", SubReaderMenu);
Component.registerComponent("SubReaderMenuButton", SubReaderMenuButton);
videojs.registerPlugin("subreader", SubReaderPlugin);
