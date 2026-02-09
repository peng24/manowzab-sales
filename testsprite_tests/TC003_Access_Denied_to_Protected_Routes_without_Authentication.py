import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173/manowzab-sales/", wait_until="commit", timeout=10000)

        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass

        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:5173/manowzab-sales/
        await page.goto("http://localhost:5173/manowzab-sales/", wait_until="commit", timeout=10000)
        
        # -> Navigate to protected route /manowzab-sales/dashboard to verify whether unauthenticated users are redirected to the login page.
        await page.goto("http://localhost:5173/manowzab-sales/dashboard", wait_until="commit", timeout=10000)
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        # -> Assert that unauthenticated navigation to a protected route redirected to the login page
        await page.wait_for_selector("text=Sign in to SalesPilot", timeout=5000)
        assert await page.locator("text=Sign in to SalesPilot").is_visible()
        # -> Verify common login form fields are present
        assert await page.locator("text=Email address").is_visible()
        assert await page.locator("text=Password").is_visible()
        assert await page.locator("text=Sign in").is_visible()
        # -> Ensure the URL does not contain the protected route segment (redirect occurred)
        assert "dashboard" not in page.url.lower()
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    