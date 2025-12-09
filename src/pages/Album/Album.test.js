import React from "react";
import { render } from "@testing-library/react";
import Album from "./Album";
describe("Album Page", () => {
  it("renders without crashing", () => {
    render(<Album />);
  });
});
