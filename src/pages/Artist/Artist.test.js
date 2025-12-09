import React from "react";
import { render } from "@testing-library/react";
import Artist from "./Artist";
describe("Artist Page", () => {
  it("renders without crashing", () => {
    render(<Artist />);
  });
});
