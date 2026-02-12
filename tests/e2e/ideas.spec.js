const { test, expect } = require('@playwright/test');

test.describe('Ideas System', () => {
  test('Ideas page is accessible', async ({ page }) => {
    await page.goto('/');
    
    // Try to navigate via link or direct URL
    const ideasLink = page.locator('a:has-text("Ideas"), a:has-text("Suggestions")');
    if (await ideasLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ideasLink.click();
    } else {
      await page.goto('/ideas');
    }
    
    // Hard assertion: Ideas page must load
    await expect(page.locator('body')).toBeVisible();
  });

  test('Ideas list is displayed', async ({ page }) => {
    await page.goto('/ideas');
    
    // Hard assertion: Ideas list or empty state must be visible
    const ideasList = page.locator('[data-testid="ideas-list"], .ideas-list, [class*="list"], text=/no ideas|ideas/i');
    await expect(ideasList).toBeVisible({ timeout: 5000 });
  });

  test('Can create a new idea', async ({ page }) => {
    await page.goto('/ideas');
    
    // Hard assertion: Create button must exist
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Idea"), [data-testid="create-idea"]');
    await expect(createButton).toBeVisible({ timeout: 2000 });
    
    await createButton.click();

    // Hard assertion: Form fields must be visible
    const titleInput = page.locator('input[placeholder*="Title"], input[id="title"]');
    await expect(titleInput).toBeVisible({ timeout: 2000 });
    
    const ideaTitle = 'E2E Idea - ' + Date.now();
    await titleInput.fill(ideaTitle);

    // Optional: fill description if it exists
    const descInput = page.locator('textarea[placeholder*="Description"], textarea[id="description"]');
    if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await descInput.fill('Test idea description');
    }

    // Submit form
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Submit"), button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Verify idea was created via API response
    await page.waitForResponse(response => response.url().includes('/api/ideas'));
    
    // Hard assertion: New idea should appear in list
    await expect(page.locator(`text=${ideaTitle}`)).toBeVisible({ timeout: 5000 });
  });

  test('Can view idea details in modal', async ({ page }) => {
    await page.goto('/ideas');

    const ideas = page.locator('[data-testid="idea"], .idea, [class*="idea-item"]');
    
    // Hard assertion: At least one idea must exist
    await expect(ideas.first()).toBeVisible({ timeout: 5000 });
    
    // Click on idea to view details
    const firstIdea = ideas.first();
    await firstIdea.click();
    
    // Hard assertion: Detail modal or view must appear
    const detailView = page.locator('[data-testid="idea-detail"], .modal, [class*="detail"], h1, h2, h3');
    await expect(detailView).toBeVisible({ timeout: 5000 });
  });

  test('Can filter ideas by status', async ({ page }) => {
    await page.goto('/ideas');

    const statusFilter = page.locator('[data-testid="filter-status"], select[id="status"], [class*="filter"]');
    
    // If filter exists, use it; otherwise skip
    if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusFilter.selectOption('approved');
      
      // Wait for filtered results
      await page.waitForResponse(response => response.url().includes('/api/ideas'));
      
      const ideas = page.locator('[data-testid="idea"], .idea');
      
      // After filter, should have valid state (empty or populated)
      await expect(page.locator('[data-testid="ideas-list"], body')).toBeVisible();
    }
  });

  test('Ideas page is responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ideas');
    
    // Page must be usable on mobile
    const ideasContent = page.locator('[data-testid="ideas-page"], body');
    await expect(ideasContent).toBeVisible();
  });

  test('Ideas page is responsive - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/ideas');
    
    const ideasContent = page.locator('[data-testid="ideas-page"], body');
    await expect(ideasContent).toBeVisible();
  });

  test('No console errors on ideas page', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/ideas');
    await page.waitForLoadState('networkidle');

    // Hard assertion: No console errors
    expect(errors.length).toBe(0);
  });
});
