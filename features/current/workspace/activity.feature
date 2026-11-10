@MyWorkspace @DomainWorkspace @FreshLogin
Feature: Workspace activity
  Users can inspect the activity view without changing workflow data.

  @Smoke @Regression
  Scenario: Authenticated user can open Activity
    Given I have opened my authenticated My Workspace
    When I open Activity
    Then the Activity page is ready to search
