import { test, expect } from "@playwright/test";

test.describe("FlowersPET E2E Test Suite", () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the local server home page
    await page.goto("/");
    
    // Wait for the dynamic catalog to load (indicating hydration is complete)
    // This resolves the "uncanny valley" of SSR where buttons are clicked before React onClick handlers are bound.
    await expect(page.locator("#catalog article").first()).toBeVisible();
  });

  test("1. Landing Page scroll and navigation works", async ({ page }) => {
    // Verify Page title is correct
    await expect(page).toHaveTitle(/FlowersPET/);

    // Verify main header brand text
    const brand = page.locator("header").getByText("Планета цветов");
    await expect(brand).toBeVisible();

    // Verify clicking "Индивидуальный заказ" in Hero scrolls to custom order section
    const customOrderBtn = page.locator("a:has-text('Индивидуальный заказ')").first();
    await expect(customOrderBtn).toBeVisible();
    await customOrderBtn.click();
    
    // Check that url hash changed to #custom-order or section is in view
    await expect(page).toHaveURL(/.*#custom-order/);
    const customOrderSection = page.locator("#custom-order");
    await expect(customOrderSection).toBeInViewport();
  });

  test("2. Catalog filtering and sorting works", async ({ page }) => {
    // Select category button "Комнатные растения"
    const roomPlantsBtn = page.locator("button:has-text('Комнатные растения')");
    await expect(roomPlantsBtn).toBeVisible();
    await roomPlantsBtn.click();

    // Verify that active category button is styled as active
    await expect(roomPlantsBtn).toHaveClass(/bg-\[#1E3F20\]/);

    // Verify only room plants (e.g., Monstera, Ficus) are rendered
    const monstera = page.locator("#catalog article:has-text('Монстера Делициоза')");
    await expect(monstera).toBeVisible();
    
    const rose = page.locator("#catalog article:has-text('Роза Эквадор')");
    await expect(rose).not.toBeVisible();

    // Click sorting dropdown and choose "Сначала дешевле"
    const sortDropdown = page.locator("select[aria-label='Сортировка товаров']");
    await expect(sortDropdown).toBeVisible();
    await sortDropdown.selectOption("price-asc");

    // Wait a brief moment to let sorting state update
    await page.waitForTimeout(200);

    // Verify Ficus (1800) is shown before Monstera (2400) in sorted DOM
    const productCards = page.locator("#catalog article");
    const firstProduct = await productCards.nth(0).innerText();
    const secondProduct = await productCards.nth(1).innerText();
    
    expect(firstProduct).toContain("Фикус Бенджамина");
    expect(secondProduct).toContain("Монстера Делициоза");
  });

  test("3. Favorites sheet workflow operates correctly", async ({ page }) => {
    // Verify favorites badge in header starts empty/invisible
    const favHeaderBtn = page.locator("button[aria-label^='Избранное']");
    await expect(favHeaderBtn).toBeVisible();
    
    const badge = favHeaderBtn.locator("span");
    await expect(badge).toHaveClass(/scale-0/);

    // Find the first product card ("Букет \"Нежность Иваново\"") in catalog and add to favorites
    const targetProductCard = page.locator("#catalog article").filter({ hasText: "Нежность Иваново" }).first();
    const heartBtn = targetProductCard.locator("button[aria-label='Добавить в избранное']");
    await expect(heartBtn).toBeVisible();
    await heartBtn.click();

    // Verify header favorites badge now displays '1'
    await expect(badge).toHaveClass(/scale-100/);
    await expect(badge).toHaveText("1");

    // Open favorites sliding drawer
    await favHeaderBtn.click();

    // Verify drawer is open and contains the favorited product
    const favDrawer = page.locator("aside[aria-label='Избранные товары']");
    await expect(favDrawer).toBeVisible();
    await expect(favDrawer.locator("h4")).toHaveText("Букет \"Нежность Иваново\"");

    // Toggle favorite off inside the drawer (using correct Cyrillic 'д' character)
    const drawerTrashBtn = favDrawer.locator("button[aria-label^='Удалить']");
    await expect(drawerTrashBtn).toBeVisible();
    await drawerTrashBtn.click();

    // Verify drawer displays empty state
    await expect(favDrawer.getByText("Список пуст")).toBeVisible();
    
    // Close the drawer
    await favDrawer.locator("button[aria-label='Закрыть избранное']").click();
    
    // Drawer is animated off-screen using translate-x-full class
    await expect(favDrawer).toHaveClass(/translate-x-full/);
  });

  test("4. Shopping cart item addition and quantities operate correctly", async ({ page }) => {
    // Verify cart badge in header is scale-0 initially
    const cartHeaderBtn = page.locator("button[aria-label^='Корзина']");
    const cartBadge = cartHeaderBtn.locator("span");
    await expect(cartBadge).toHaveClass(/scale-0/);

    // Find product "Нежность Иваново" and click "В корзину"
    const productCard = page.locator("#catalog article").filter({ hasText: "Нежность Иваново" }).first();
    const buyBtn = productCard.locator("button[aria-label^='Купить']");
    await expect(buyBtn).toBeVisible();
    await buyBtn.click();

    // Verify cart badge in header displays '1'
    await expect(cartBadge).toHaveClass(/scale-100/);
    await expect(cartBadge).toHaveText("1");

    // Open Cart Drawer
    await cartHeaderBtn.click();
    const cartDrawer = page.locator("aside[aria-label='Корзина покупок']");
    await expect(cartDrawer).toBeVisible();

    // Verify product exists inside drawer with quantity 1
    const cartItem = cartDrawer.locator("div[class*='border-[#E8F0EA]']");
    await expect(cartItem.locator("h4")).toHaveText("Букет \"Нежность Иваново\"");
    
    const quantitySpan = cartItem.locator("span.font-black");
    await expect(quantitySpan).toHaveText("1");

    // Click '+' to increment quantity to 2
    const plusBtn = cartItem.locator("button[aria-label='Увеличить количество на 1']");
    await plusBtn.click();
    await expect(quantitySpan).toHaveText("2");

    // Click '-' to decrement quantity back to 1
    const minusBtn = cartItem.locator("button[aria-label='Уменьшить количество на 1']");
    await minusBtn.click();
    await expect(quantitySpan).toHaveText("1");

    // Click "Очистить корзину"
    const clearCartBtn = cartDrawer.locator("button:has-text('Очистить корзину')");
    await expect(clearCartBtn).toBeVisible();
    await clearCartBtn.click();

    // Verify cart is now empty
    await expect(cartDrawer.getByText("Ваша корзина пуста")).toBeVisible();
  });

  test("5. Order checkout form validation and mocked successful checkout works", async ({ page }) => {
    // Add "Нежность Иваново" to cart
    const productCard = page.locator("#catalog article").filter({ hasText: "Нежность Иваново" }).first();
    await productCard.locator("button[aria-label^='Купить']").click();

    // Open Cart Drawer & Click "Оформить заказ"
    await page.locator("button[aria-label^='Корзина']").click();
    const cartDrawer = page.locator("aside[aria-label='Корзина покупок']");
    await cartDrawer.locator("button:has-text('Оформить заказ')").click();

    // Check Checkout Form is visible
    const orderForm = page.locator("form[aria-label='Форма оформления заказа']");
    await expect(orderForm).toBeVisible();

    // Click "Подтвердить заказ" without filling fields to trigger validation
    await orderForm.locator("button[type='submit']").click();

    // Verify error messages appear
    await expect(page.locator("#customerName-error")).toHaveText(/Имя должно содержать/);
    await expect(page.locator("#phone-error")).toHaveText(/Введите телефон/);
    await expect(page.locator("#address-error")).toHaveText(/Введите подробный адрес/);

    // Fill FIO
    await page.locator("input#customerName").fill("Тестовый Покупатель");
    
    // Fill Phone with incomplete numbers -> check validation error remains
    await page.locator("input#phone").fill("999123");
    await expect(page.locator("input#phone")).toHaveValue("+7 (999) 123");
    await orderForm.locator("button[type='submit']").click();
    await expect(page.locator("#phone-error")).toHaveText(/Введите телефон/);

    // Complete the Phone number -> verify mask format
    await page.locator("input#phone").fill("9991234567");
    await expect(page.locator("input#phone")).toHaveValue("+7 (999) 123-45-67");

    // Fill Address
    await page.locator("textarea#address").fill("г. Иваново, ул. Ленина, д. 5, кв. 10");

    // Intercept/Mock POST /api/v1/orders/ to return success response
    await page.route("**/api/v1/orders/", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          order_id: 9999,
          total_amount: 3200.0,
          message: "Заказ успешно оформлен"
        })
      });
    });

    // Submit form
    await orderForm.locator("button[type='submit']").click();

    // Verify redirected to thanks page
    await expect(page).toHaveURL(/.*\/thanks/);
    await expect(page.locator("h1")).toHaveText("Спасибо за заказ!");
  });

  test("6. Real API E2E Checkout Integration Test", async ({ page }) => {
    // This test submits a real order directly to the database and tests background Telegram notifications!
    // Add "Монстера Делициоза" to cart
    const productCard = page.locator("#catalog article").filter({ hasText: "Монстера Делициоза" }).first();
    await productCard.locator("button[aria-label^='Купить']").click();

    // Open Cart & Go to Checkout
    await page.locator("button[aria-label^='Корзина']").click();
    const cartDrawer = page.locator("aside[aria-label='Корзина покупок']");
    await cartDrawer.locator("button:has-text('Оформить заказ')").click();

    // Fill form details for real submission
    await page.locator("input#customerName").fill("Автотест Playwright");
    await page.locator("input#phone").fill("9000000000");
    await page.locator("input#email").fill("playwright@flowerspet.ru");
    await page.locator("textarea#address").fill("Адрес тестирования E2E Playwright");

    // Submit form (without mocking, hitting real FastAPI backend database transaction!)
    await page.locator("form[aria-label='Форма оформления заказа']").locator("button[type='submit']").click();

    // Verify successful redirection to thanks page
    await expect(page).toHaveURL(/.*\/thanks/);
    await expect(page.locator("h1")).toHaveText("Спасибо за заказ!");
  });

  test("7. Product details modal, photo carousel, specifications and additions work correctly", async ({ page }) => {
    // Find the product card "Нежность Иваново"
    const productCard = page.locator("#catalog article").filter({ hasText: "Нежность Иваново" }).first();
    await expect(productCard).toBeVisible();

    // Click the product card body (not the cart or favorite buttons) to open details modal
    await productCard.click();

    // Verify modal is open and has dialog role
    const modal = page.locator("div[role='dialog']");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Нежность Иваново");

    // Verify rating and reviews exist
    await expect(modal.locator("span.font-black")).toBeVisible();
    await expect(modal.locator("text=/отзывов/")).toBeVisible();

    // Verify specifications table is shown
    await expect(modal.locator("h4:has-text('Характеристики')")).toBeVisible();

    // Test carousel photo slider if multiple photos are present
    const nextPhotoBtn = modal.locator("button[aria-label='Следующее фото']");
    if (await nextPhotoBtn.isVisible()) {
      await nextPhotoBtn.click();
      await page.waitForTimeout(200);
      const prevPhotoBtn = modal.locator("button[aria-label='Предыдущее фото']");
      await expect(prevPhotoBtn).toBeVisible();
    }

    // Toggle favorite inside modal
    const favBtn = modal.locator("button[aria-label='Добавить в избранное']");
    await expect(favBtn).toBeVisible();
    await favBtn.click();

    // Verify header favorites badge updates to '1'
    const favHeaderBtn = page.locator("button[aria-label^='Избранное']");
    await expect(favHeaderBtn.locator("span")).toHaveText("1");

    // Click "Добавить в корзину" inside modal
    const cartBtn = modal.locator("button:has-text('Добавить в корзину')");
    await expect(cartBtn).toBeVisible();
    await cartBtn.click();

    // Verify header cart badge updates to '1'
    const cartHeaderBtn = page.locator("button[aria-label^='Корзина']");
    await expect(cartHeaderBtn.locator("span")).toHaveText("1");

    // Close the details modal using the close button
    const closeBtn = modal.locator("button[aria-label='Закрыть детали товара']");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test("8. Custom order form workflow operates successfully", async ({ page }) => {
    // Navigate specifically to the custom order page
    await page.goto("/custom-order");

    // Verify that custom order page has successfully rendered
    const title = page.locator("h1");
    await expect(title).toHaveText("Создайте свой идеальный букет");

    // Click submit empty form to trigger validation errors
    const submitBtn = page.locator("button[type='submit']");
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify validation errors appear
    await expect(page.locator("text=Выберите повод для букета")).toBeVisible();
    await expect(page.locator("text=Выберите планируемый бюджет")).toBeVisible();
    await expect(page.locator("text=Имя должно содержать")).toBeVisible();
    await expect(page.locator("text=Введите корректный номер")).toBeVisible();

    // Fill occasion and budget
    await page.locator("select#occasion").selectOption("День рождения / Юбилей");
    await page.locator("select#budget").selectOption("3 000 ₽ – 5 000 ₽");

    // Select color swatch "Пастельный розовый"
    const colorBtn = page.locator("button:has-text('Пастельный розовый')");
    await expect(colorBtn).toBeVisible();
    await colorBtn.click();

    // Fill Name and Phone
    await page.locator("input#customerName").fill("Анна");
    await page.locator("input#phone").fill("9991112233");
    await expect(page.locator("input#phone")).toHaveValue("+7 (999) 111-22-33");

    // Mock API POST /api/v1/orders/custom
    await page.route("**/api/v1/orders/custom", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          order_id: 100,
          message: "Заявка принята"
        })
      });
    });

    // Submit form
    await submitBtn.click();

    // Verify success confirmation card is shown
    await expect(page.locator("h1")).toHaveText("Заявка успешно отправлена!");
    await expect(page.locator("text=Анна")).not.toBeVisible(); // Form is hidden
  });

  test("9. Catalog product search works correctly", async ({ page }) => {
    // Locate the search input
    const searchInput = page.locator("input[aria-label='Поиск по ассортименту']").first();
    await expect(searchInput).toBeVisible();

    // Type 'Монстера' into search query
    await searchInput.fill("Монстера");
    await page.waitForTimeout(200);

    // Verify 'Монстера Делициоза' is visible, and 'Фикус Бенджамина' is hidden
    await expect(page.locator("#catalog article:has-text('Монстера Делициоза')")).toBeVisible();
    await expect(page.locator("#catalog article:has-text('Фикус Бенджамина')")).not.toBeVisible();

    // Clear search using clear button
    const clearBtn = page.locator("button[aria-label='Очистить поиск']").first();
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await page.waitForTimeout(200);

    // Verify 'Фикус Бенджамина' is visible again
    await expect(page.locator("#catalog article:has-text('Фикус Бенджамина')")).toBeVisible();

    // Search for a non-existent item
    await searchInput.fill("НесуществующийЦветок");
    await page.waitForTimeout(200);

    // Verify Empty State is visible
    await expect(page.locator("text=Ничего не найдено")).toBeVisible();
    await expect(page.locator("text=Попробуйте изменить формулировку")).toBeVisible();

    // Reset search using the button inside empty state
    const resetBtn = page.locator("button:has-text('Сбросить поиск')");
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await page.waitForTimeout(200);

    // Verify 'Монстера Делициоза' and others are visible again
    await expect(page.locator("#catalog article:has-text('Монстера Делициоза')")).toBeVisible();
  });

  test("10. Search autocomplete suggestions dropdown works correctly", async ({ page }) => {
    // Locate the desktop search input in header
    const searchInput = page.locator("input[aria-label='Поиск по ассортименту']").first();
    await expect(searchInput).toBeVisible();

    // Type 'Монстера'
    await searchInput.fill("Монстера");
    await page.waitForTimeout(200);

    // Verify autocomplete popover appears
    const popover = page.locator("text=Подходящие товары");
    await expect(popover).toBeVisible();

    // Verify popover contains suggestion card for 'Монстера Делициоза'
    const suggestionBtn = page.locator("button:has-text('Монстера Делициоза')").first();
    await expect(suggestionBtn).toBeVisible();

    // Click suggestion card inside popover
    await suggestionBtn.click();

    // Verify detailed Product Modal opens up instantly
    const modal = page.locator("div[role='dialog']");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Монстера Делициоза");

    // Close the details modal
    const closeBtn = modal.locator("button[aria-label='Закрыть детали товара']");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

});
