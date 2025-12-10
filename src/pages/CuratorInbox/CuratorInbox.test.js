import React from "react";
import { render } from "@testing-library/react";
import CuratorInbox from "./CuratorInbox";
describe("CuratorInbox Page", () => {
  it("renders without crashing", () => {
    render(<CuratorInbox />);
  });
});
