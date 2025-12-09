import React from "react";
import { render } from "@testing-library/react";
describe("Search Page", () => {
  it("renders without crashing", () => {
    render(<Search />);
  });
});
