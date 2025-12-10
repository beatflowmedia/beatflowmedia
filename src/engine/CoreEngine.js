// CoreEngine interface: abstract playback engine
export default class CoreEngine {
  constructor() {
    if (new.target === CoreEngine) {
      throw new TypeError("Cannot instantiate CoreEngine directly");
    }
  }

  load(track) {
    throw new Error("load() not implemented");
  }

  play() {
    throw new Error("play() not implemented");
  }

  pause() {
    throw new Error("pause() not implemented");
  }

  seek(time) {
    throw new Error("seek() not implemented");
  }

  setVolume(volume) {
    throw new Error("setVolume() not implemented");
  }

  onTimeUpdate(cb) {
    throw new Error("onTimeUpdate() not implemented");
  }

  onDurationChange(cb) {
    throw new Error("onDurationChange() not implemented");
  }

  onVolumeChange(cb) {
    throw new Error("onVolumeChange() not implemented");
  }

  onEnded(cb) {
    throw new Error("onEnded() not implemented");
  }
}
