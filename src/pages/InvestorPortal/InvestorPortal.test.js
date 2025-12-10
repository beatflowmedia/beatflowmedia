import React from "react";
import { render } from "@testing-library/react";
import InvestorPortal from "./InvestorPortal";
describe("InvestorPortal Page", () => {
  it("renders without crashing", () => {
    render(<InvestorPortal />);
  });
});
