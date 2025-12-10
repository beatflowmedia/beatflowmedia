import React from "react";
import { render } from "@testing-library/react";
import CampaignWizard from "./CampaignWizard";
describe("CampaignWizard Page", () => {
  it("renders without crashing", () => {
    render(<CampaignWizard />);
  });
});
