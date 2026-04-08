import { expect, test } from "@playwright/test";

test("captures a research idea and experiment from the workspace", async ({ page }) => {
  const runId = Date.now();
  const ideaTitle = `E2E idea ${runId}`;
  const experimentTitle = `E2E experiment ${runId}`;

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Resume the thread of your research." })).toBeVisible();

  await page.getByRole("button", { name: "Ideas" }).click();
  await page.getByLabel("Title").fill(ideaTitle);
  await page.getByLabel("Summary").fill("E2E summary for the core research capture flow.");
  await page.getByLabel("Motivation").fill("Keep the browser smoke test close to the real workflow.");
  await page.getByLabel("Hypothesis").fill("A new idea can be captured and shown without a refresh.");
  await page.getByLabel("Novelty").fill("Uses the full Next.js UI and API boundary.");
  await page.getByLabel("Tags").fill("e2e, quality");
  await page.getByRole("button", { name: "Save idea" }).click();

  await expect(page.getByText("Idea saved.")).toBeVisible();
  await expect(page.getByRole("heading", { name: ideaTitle })).toBeVisible();

  await page.getByRole("button", { name: "Experiments" }).click();
  await page.getByLabel("Idea").selectOption({ label: ideaTitle });
  await page.getByLabel("Title").fill(experimentTitle);
  await page.getByLabel("Objective").fill("Verify the main experiment capture path.");
  await page.getByLabel("Type").fill("E2E smoke");
  await page.getByLabel("Model").fill("local-test-model");
  await page.getByRole("textbox", { exact: true, name: "Dataset" }).fill("synthetic-e2e");
  await page.getByLabel("Result summary").fill("Pending browser verification.");
  await page.getByRole("button", { name: "Save experiment" }).click();

  await expect(page.getByText("Experiment saved.")).toBeVisible();
  await expect(page.getByRole("heading", { name: experimentTitle })).toBeVisible();

  await page.getByRole("link", { name: "Page" }).first().click();
  await expect(page.getByRole("heading", { name: experimentTitle })).toBeVisible();
  await expect(page.getByLabel("Experiment metadata").getByText("synthetic-e2e")).toBeVisible();
});
