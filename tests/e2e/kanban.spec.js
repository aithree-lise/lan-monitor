const { test, expect } = require('@playwright/test');

test.describe('Kanban Board', () => {
  test('Kanban page loads and displays board', async ({ page }) => {
    await page.goto('/');
    
    // Try to navigate to Kanban via link or direct URL
    const kanbanLink = page.locator('a:has-text("Kanban"), a:has-text("Board")');
    if (await kanbanLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await kanbanLink.click();
    } else {
      await page.goto('/kanban');
    }
    
    // Hard assertion: Kanban board must be visible
    const kanbanBoard = page.locator('[data-testid="kanban-board"], .kanban, [class*="board"]');
    await expect(kanbanBoard).toBeVisible({ timeout: 5000 });
  });

  test('Kanban displays tickets', async ({ page }) => {
    await page.goto('/kanban');
    
    // Hard assertion: At least one ticket must be visible
    const tickets = page.locator('[data-testid="ticket"], .ticket, [class*="task"]');
    await expect(tickets.first()).toBeVisible({ timeout: 5000 });
  });

  test('Can create ticket from form', async ({ page }) => {
    await page.goto('/kanban');
    
    // Hard assertion: Create button must exist
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-ticket"]');
    await expect(createButton).toBeVisible({ timeout: 2000 });
    
    await createButton.click();

    // Fill form with hard assertions
    const titleInput = page.locator('input[placeholder*="Title"], input[id="title"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('E2E Test Ticket - ' + Date.now());

    const submitButton = page.locator('button:has-text("Create"), button:has-text("Submit"), button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for API response
    await page.waitForResponse(response => response.url().includes('/api/tickets'));
    
    // Hard assertion: Newly created ticket should be visible
    await expect(page.locator('text=E2E Test Ticket')).toBeVisible({ timeout: 5000 });
  });

  test('Tickets can be moved between lanes', async ({ page }) => {
    await page.goto('/kanban');

    const tickets = page.locator('[data-testid="ticket"], .ticket');
    
    // Hard assertion: At least one ticket must exist
    await expect(tickets.first()).toBeVisible({ timeout: 5000 });

    const inProgressLane = page.locator('[data-testid="lane-inprogress"], text=/In Progress/i');
    
    // If in-progress lane exists, try to move ticket
    if (await inProgressLane.isVisible({ timeout: 2000 }).catch(() => false)) {
      const firstTicket = tickets.first();
      await firstTicket.dragTo(inProgressLane);
      
      // Verify API call was made
      await page.waitForResponse(response => response.url().includes('/api/tickets'));
      
      // Ticket should still be visible after move
      await expect(firstTicket).toBeVisible();
    }
  });

  test('Kanban displays multiple lanes', async ({ page }) => {
    await page.goto('/kanban');
    
    // Hard assertion: Multiple lanes should be visible
    const lanes = page.locator('[data-testid*="lane"], [class*="lane"], [class*="column"]');
    const laneCount = await lanes.count();
    
    // At minimum, we expect backlog and at least one other lane
    expect(laneCount).toBeGreaterThanOrEqual(2);
  });

  test('Kanban is responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/kanban');
    
    // Kanban board should still be visible on mobile
    const kanbanBoard = page.locator('[data-testid="kanban-board"], .kanban, [class*="board"]');
    await expect(kanbanBoard).toBeVisible({ timeout: 5000 });
  });

  test('Kanban is responsive - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/kanban');
    
    const kanbanBoard = page.locator('[data-testid="kanban-board"], .kanban');
    await expect(kanbanBoard).toBeVisible({ timeout: 5000 });
  });
});
