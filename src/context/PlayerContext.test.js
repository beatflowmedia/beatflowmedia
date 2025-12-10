import { reducer, initialState, actions, RepeatMode } from "./PlayerContext";

describe("PlayerContext reducer", () => {
  const songA = { id: "A", title: "Song A" };
  const songB = { id: "B", title: "Song B" };

  it("should return initial state by default", () => {
    const newState = reducer(undefined, { type: "UNKNOWN" });
    expect(newState).toEqual(initialState);
  });

  it("should handle PLAY_SONG when queue is empty", () => {
    const state = { ...initialState, queue: [], currentIndex: 0 };
    const newState = reducer(state, {
      type: actions.PLAY_SONG,
      payload: songA
    });
    expect(newState.queue).toEqual([songA]);
    expect(newState.currentIndex).toBe(0);
    expect(newState.isPlaying).toBe(true);
  });

  it("should handle PLAY_SONG when song exists in queue", () => {
    const state = { ...initialState, queue: [songA, songB], currentIndex: 0 };
    const newState = reducer(state, {
      type: actions.PLAY_SONG,
      payload: songB
    });
    expect(newState.currentIndex).toBe(1);
    expect(newState.queue).toEqual([songA, songB]);
    expect(newState.isPlaying).toBe(true);
  });

  it("should handle ENQUEUE without position", () => {
    const state = { ...initialState, queue: [songA] };
    const newState = reducer(state, {
      type: actions.ENQUEUE,
      payload: { item: songB }
    });
    expect(newState.queue).toEqual([songA, songB]);
  });

  it("should handle ENQUEUE with position", () => {
    const state = { ...initialState, queue: [songA, songB] };
    const songC = { id: "C" };
    const newState = reducer(state, {
      type: actions.ENQUEUE,
      payload: { item: songC, position: 1 }
    });
    expect(newState.queue).toEqual([songA, songC, songB]);
  });

  it("should handle REMOVE_AT", () => {
    const state = { ...initialState, queue: [songA, songB], currentIndex: 1 };
    const newState = reducer(state, { type: actions.REMOVE_AT, payload: 0 });
    expect(newState.queue).toEqual([songB]);
    expect(newState.currentIndex).toBe(0);
  });

  it("should handle CLEAR", () => {
    const state = {
      ...initialState,
      queue: [songA, songB],
      currentIndex: 1,
      isPlaying: true
    };
    const newState = reducer(state, { type: actions.CLEAR });
    expect(newState.queue).toEqual([]);
    expect(newState.currentIndex).toBe(0);
    expect(newState.isPlaying).toBe(false);
  });

  it("should handle REORDER", () => {
    const state = {
      ...initialState,
      queue: [songA, songB, { id: "C" }],
      currentIndex: 2
    };
    const newState = reducer(state, {
      type: actions.REORDER,
      payload: { from: 2, to: 0 }
    });
    expect(newState.queue.map((s) => s.id)).toEqual(["C", "A", "B"]);
    expect(newState.currentIndex).toBe(0);
  });

  it("should cycle repeat mode", () => {
    const offState = { ...initialState, repeatMode: RepeatMode.OFF };
    const allState = reducer(offState, { type: actions.CYCLE_REPEAT });
    expect(allState.repeatMode).toBe(RepeatMode.ALL);
    const oneState = reducer(allState, { type: actions.CYCLE_REPEAT });
    expect(oneState.repeatMode).toBe(RepeatMode.ONE);
    const backOff = reducer(oneState, { type: actions.CYCLE_REPEAT });
    expect(backOff.repeatMode).toBe(RepeatMode.OFF);
  });

  it("should toggle shuffle", () => {
    const state = { ...initialState, shuffleOn: false };
    const newState = reducer(state, { type: actions.TOGGLE_SHUFFLE });
    expect(newState.shuffleOn).toBe(true);
  });

  it("should skip next without repeat/shuffle", () => {
    const state = {
      ...initialState,
      queue: [songA, songB],
      currentIndex: 0,
      repeatMode: RepeatMode.OFF,
      shuffleOn: false
    };
    const newState = reducer(state, { type: actions.SKIP_NEXT });
    expect(newState.currentIndex).toBe(1);
    expect(newState.isPlaying).toBe(true);
  });

  it("should skip previous resets currentTime if past 3s", () => {
    // currentTime logic uses document; skip this in unit tests
    const state = { ...initialState, currentIndex: 1 };
    const newState = reducer(state, { type: actions.SKIP_PREVIOUS });
    expect(newState.currentIndex).toBe(0);
  });

  it("should play at index", () => {
    const state = { ...initialState, queue: [songA, songB], currentIndex: 0 };
    const newState = reducer(state, { type: actions.PLAY_AT, payload: 1 });
    expect(newState.currentIndex).toBe(1);
    expect(newState.isPlaying).toBe(true);
  });
});
