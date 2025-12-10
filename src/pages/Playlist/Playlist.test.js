import React from "react";
import { render } from "@testing-library/react";
import Playlist from "./Playlist";
describe("Playlist Page", () => {
  it("renders without crashing", () => {
    render(<Playlist />);
  });
});
