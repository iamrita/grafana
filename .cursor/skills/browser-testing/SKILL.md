---
name: browser-testing
description: Test frontend component changes using browser automation. Takes screenshots, clicks CTAs, fills forms, and verifies visual appearance and interactions. Use after making React component changes, when testing UI, or when the user asks to verify frontend behavior.
---

# Browser Testing

Test frontend components by navigating to the dev server, capturing screenshots, and interacting with UI elements.

## Prerequisites

Ensure the dev server is running on `http://localhost:3000` before testing. If not running, start it:

```bash
yarn dev
```

## Testing Workflow

### Step 1: Navigate to the Component

```
browser_navigate → url: "http://localhost:3000/path/to/component"
```

Use `take_screenshot_afterwards: true` to capture initial state.

### Step 2: Lock Browser for Testing

After navigation, lock the browser to prevent interference:

```
browser_lock
```

### Step 3: Capture Page Structure

Get the accessibility snapshot to identify interactive elements:

```
browser_snapshot → take_screenshot_afterwards: true
```

The snapshot returns element refs (e.g., `ref="button[0]"`) needed for interactions.

### Step 4: Interact with Elements

**Click buttons/CTAs:**
```
browser_click → element: "Submit button", ref: "button[0]"
```

**Fill form fields:**
```
browser_fill → element: "Email input", ref: "input[0]", value: "test@example.com"
```

**Hover for tooltips/dropdowns:**
```
browser_hover → element: "Menu trigger", ref: "button[1]"
```

### Step 5: Verify Results

After interactions, capture the new state:

```
browser_snapshot → take_screenshot_afterwards: true
```

Compare screenshots and verify:
- Visual changes occurred as expected
- Error states display correctly
- Loading states transition properly

### Step 6: Test Responsive Design

Resize viewport to test breakpoints:

```
browser_resize → width: 375, height: 667   # Mobile
browser_resize → width: 768, height: 1024  # Tablet
browser_resize → width: 1440, height: 900  # Desktop
```

Take screenshots at each size.

### Step 7: Unlock Browser

When testing is complete:

```
browser_unlock
```

## Common Viewport Sizes

| Device | Width | Height |
|--------|-------|--------|
| Mobile (iPhone SE) | 375 | 667 |
| Mobile (iPhone 14) | 390 | 844 |
| Tablet (iPad) | 768 | 1024 |
| Desktop (small) | 1280 | 720 |
| Desktop (large) | 1440 | 900 |
| Desktop (wide) | 1920 | 1080 |

## Waiting for Content

If content loads asynchronously:

```
browser_wait_for → text: "Data loaded"      # Wait for text to appear
browser_wait_for → textGone: "Loading..."   # Wait for loading to finish
browser_wait_for → time: 2                  # Wait 2 seconds (fixed delay)
```

Prefer short incremental waits (1-2 seconds) with snapshots between rather than long fixed delays.

## Example: Testing a Button Component

```
Task Progress:
- [ ] Navigate to component page
- [ ] Capture initial screenshot
- [ ] Click the primary CTA
- [ ] Verify state change
- [ ] Test hover state
- [ ] Test disabled state
- [ ] Test responsive behavior
- [ ] Unlock browser
```

1. Navigate and lock:
   - `browser_navigate` to component URL with screenshot
   - `browser_lock`

2. Get element refs:
   - `browser_snapshot` to capture page structure

3. Test primary CTA:
   - `browser_click` on the button
   - `browser_snapshot` with screenshot to verify result

4. Test hover:
   - `browser_hover` on the button
   - `browser_take_screenshot` to capture hover state

5. Test responsive:
   - `browser_resize` to mobile
   - `browser_take_screenshot`

6. Complete:
   - `browser_unlock`

## Tool Reference

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Open URL, optionally screenshot |
| `browser_lock` | Prevent user interference during tests |
| `browser_unlock` | Release browser when done |
| `browser_snapshot` | Get page structure and element refs |
| `browser_take_screenshot` | Capture visual state |
| `browser_click` | Click buttons, links, CTAs |
| `browser_fill` | Enter text in inputs (clears first) |
| `browser_type` | Append text to inputs |
| `browser_hover` | Trigger hover states |
| `browser_scroll` | Scroll page or elements into view |
| `browser_resize` | Change viewport dimensions |
| `browser_wait_for` | Wait for text/conditions |

## Critical Rules

1. **Always snapshot before clicking** - You need element refs from the snapshot
2. **Lock before interactions** - Prevents race conditions with user input
3. **Unlock when done** - Always release browser control
4. **Use short waits** - Prefer 1-2 second incremental waits over long delays
5. **Screenshot after changes** - Capture state after each significant interaction
