@MyWorkspace @DomainWorkspace @JobContext
Feature: Job context
  Job context limits workspace content to the selected job.

  Background:
    Given I sign in freshly for the job context scenario

  @Regression
  Scenario: Job context launch, forward, and restore the workspace
    When I select my job in Jobs
    Then Files opens automatically for that job
    And the blue job context banner is visible
    And Jobs does not display the job context banner
    And only files and folders inside the selected job are visible
    When I launch a file from that job
    And I choose the workflow "smoke test my workspace"
    And I submit the job workflow
    Then the new To-Do is owned by the signed-in user
    When I open the new To-Do forward action
    And I forward the To-Do to "lap_admin"
    Then the owner of that To-Do changes to "lap_admin"
    When I open Products in the job context
    Then only the selected job products are visible
    When I close the job context
    Then the job context banner disappears
    And the unfiltered products and files are available again
    When I open the multipart product details call-out
    And I reduce the browser width to 320 pixels
    Then I can browse all multipart product previews