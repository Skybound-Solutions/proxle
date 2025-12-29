# Monetization Strategy for Proxle

## Recommended Approach: Hybrid "Tasteful" Model

For a new project with low initial traffic, traditional ad networks are often not viable or pay very little. The best strategy is a hybrid approach.

### 1. Primary: Community Support (Active Default)
**Network:** [Ko-fi](https://ko-fi.com/) or [Buy Me A Coffee](https://www.buymeacoffee.com/)
*   **Why:** Highest revenue potential for small, loyal user bases. Zero intrusiveness.
*   **Setup:**
    1.  Create a Ko-fi account.
    2.  Update the `href` in `src/components/AdSpace.tsx` with your profile link.

### 2. Secondary: Google AdSense (Manual Display)
**Network:** [Google AdSense](https://adsense.google.com/)
*   **Why:** Reliable, no minimum traffic to *start*, global fill rate.
*   **Tasteful Config:**
    *   **Disable Auto-Ads:** Settings > Ads > Auto Ads > OFF. (Prevents popups).
    *   **Create Fixed Unit:** By Ads > By Ad Unit > Display Ads > Fixed > 320x50 or 320x100.
    *   **Implement:** Replace the "AdSense Unit Wrapper" div in `src/components/AdSpace.tsx` with the `<ins>` code provided by Google.

### 3. Future Goal: Developer-Focused Networks
Once you hit **50,000 pageviews/month**, apply to:
*   [EthicalAds](https://www.ethicalads.io/): Privacy-focused, very clean.
*   [Carbon Ads](https://carbonads.net/): The gold standard for dev tool aesthetics, but hard to get into.

## Implementation Details

### Current Component: `AdSpace.tsx`
The component currently defaults to `type="coffee"`.
To switch to ads, update `src/App.tsx`:
```tsx
<AdSpace type="banner" />
```

### AdSense React Implementation
If using AdSense, don't just paste the script tag. The script usually needs to load once in `index.html`.
Then, in `AdSpace.tsx`:

```tsx
useEffect(() => {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    console.error(e);
  }
}, []);

return (
  <ins className="adsbygoogle"
       style={{ display: 'block', width: '320px', height: '50px' }}
       data-ad-client="ca-pub-XXXXXXXXX"
       data-ad-slot="YYYYYYYYY"
       data-full-width-responsive="false"></ins>
);
```
