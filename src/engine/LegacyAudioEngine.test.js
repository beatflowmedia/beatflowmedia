import LegacyAudioEngine from "./LegacyAudioEngine";

describe("LegacyAudioEngine", () => {
  let audioElem;
  let engine;

  beforeEach(() => {
    // Create a fake audio element object with spyable methods and event listeners
    audioElem = {
      src: "",
      load: jest.fn(),
      play: jest.fn().mockReturnValue(Promise.resolve()),
      pause: jest.fn(),
      volume: 0.5,
      currentTime: 0,
      duration: 120,
      _listeners: {},
      addEventListener: jest.fn((event, cb) => {
        audioElem._listeners[event] = cb;
      }),
      removeEventListener: jest.fn((event, cb) => {
        delete audioElem._listeners[event];
      })
    };
    engine = new LegacyAudioEngine(audioElem);
  });

  it("loads track URL into audio.src and calls load()", () => {
    const track = { streamUrl: "/test.mp3", fileName: "foo.mp3" };
    engine.load(track);
    expect(audioElem.src).toContain("/test.mp3");
    expect(audioElem.load).toHaveBeenCalled();
  });

  it("play() calls play() on audio element", async () => {
    await engine.play();
    expect(audioElem.play).toHaveBeenCalled();
  });

  it("pause() calls pause() on audio element", () => {
    engine.pause();
    expect(audioElem.pause).toHaveBeenCalled();
  });

  it("seek() sets currentTime on audio element", () => {
    engine.seek(30);
    expect(audioElem.currentTime).toBe(30);
  });

  it("setVolume() sets volume on audio element", () => {
    engine.setVolume(0.2);
    expect(audioElem.volume).toBe(0.2);
  });

  it("onTimeUpdate() subscribes and unsubscribes correctly", () => {
    const cb = jest.fn();
    const unsub = engine.onTimeUpdate(cb);
    // simulate event
    audioElem._listeners.timeupdate();
    expect(cb).toHaveBeenCalledWith(audioElem.currentTime);
    // unsubscribe
    unsub();
    expect(audioElem._listeners.timeupdate).toBeUndefined();
  });

  it("onDurationChange() subscribes and unsubscribes correctly", () => {
    const cb = jest.fn();
    const unsub = engine.onDurationChange(cb);
    // simulate event
    audioElem._listeners.loadedmetadata();
    expect(cb).toHaveBeenCalledWith(audioElem.duration);
    unsub();
    expect(audioElem._listeners.loadedmetadata).toBeUndefined();
  });

  it("onVolumeChange() subscribes and unsubscribes correctly", () => {
    const cb = jest.fn();
    const unsub = engine.onVolumeChange(cb);
    audioElem._listeners.volumechange();
    expect(cb).toHaveBeenCalledWith(audioElem.volume);
    unsub();
    expect(audioElem._listeners.volumechange).toBeUndefined();
  });

  it("onEnded() subscribes and unsubscribes correctly", () => {
    const cb = jest.fn();
    const unsub = engine.onEnded(cb);
    audioElem._listeners.ended();
    expect(cb).toHaveBeenCalled();
    unsub();
    expect(audioElem._listeners.ended).toBeUndefined();
  });

  it("constructor throws when no audio element provided", () => {
    expect(() => new LegacyAudioEngine()).toThrow();
  });
});
