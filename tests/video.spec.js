// Видео от Епизод 1: бутон върху картата и в hero отварят прозорец; YouTube не се зарежда преди клик.
const { test, expect } = require('@playwright/test');

const ID = 'IQavpKMwNb0'; // видеото в hero и в голямия плейър (Епизод 2)

for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  test.describe(name, () => {
    test.use({ viewport });

    test('no YouTube request before click; card and hero buttons open and close the dialog', async ({ page }) => {
      const yt = [];
      page.on('request', (r) => { if (/youtube|ytimg|googlevideo/.test(r.url())) yt.push(r.url()); });
      await page.goto('/');
      await expect(page.locator('#ep-list .ep-play')).toHaveCount(2);
      expect(yt).toEqual([]);

      // карта на епизода
      await page.locator('#ep-list .ep-play').nth(1).scrollIntoViewIfNeeded();
      await page.locator('#ep-list .ep-play').nth(1).click();
      const dlg = page.locator('#vdlg');
      await expect(dlg).toBeVisible();
      await expect(dlg.locator('iframe')).toHaveAttribute('src', new RegExp('youtube-nocookie[.]com/embed/' + ID + '[?]autoplay=1'));
      const box = await dlg.locator('#vframe').boundingBox();
      expect(box.width).toBeLessThanOrEqual(viewport.width);
      expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.05);
      await page.keyboard.press('Escape');
      await expect(dlg).toBeHidden();
      await expect(dlg.locator('iframe')).toHaveCount(0);

      // плейър в страницата
      await page.locator('#player').scrollIntoViewIfNeeded();
      await page.locator('#player .player-play').click();
      await expect(page.locator('#player iframe')).toHaveAttribute('src', new RegExp('youtube-nocookie[.]com/embed/' + ID));
      await expect(page.getByText('Минал', { exact: true })).toHaveCount(0);

      // hero бутон
      await page.locator('.btn-watch').scrollIntoViewIfNeeded();
      await page.locator('.btn-watch').click();
      await expect(dlg.locator('iframe')).toHaveCount(1);
      await page.locator('#vclose').click();
      await expect(dlg).toBeHidden();
      await expect(dlg.locator('iframe')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  });
}
