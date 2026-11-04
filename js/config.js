/* AANGAN settings — change these values, no other code needs editing. */
window.AANGAN_CONFIG = {
  whatsappNumber: '918849814657',        // orders are sent here: country code + number, digits only, e.g. '919876543210'
  instagramUrl: 'https://www.instagram.com/aangan.co.in?utm_source=ig_web_button_share_sheet&srtk=ZDNlZDc0MzIxNw==',
  siteUrl: 'https://aangan.co.in/',               // your live site address, e.g. 'https://aangan.in/' (adds product links to the WhatsApp order)
  /* Analytics — paste your IDs to switch tracking on; leave blank to keep it off */
  ga4Id: 'G-5LM732SKW7',                 // Google Analytics 4 Measurement ID, e.g. 'G-AB12CD34EF'
  clarityId: 'z13o1a74rl',             // Microsoft Clarity project ID, e.g. 'abcd1234ef'
  analyticsDebug: false,     // true = also print each tracked event in the browser console (for testing)

  showViewingNow: false,     // true = show "people viewing" badges AND "Recently chosen" pop-ups, false = hide both

  /* Sale banner — shown when products have an mrp (actual price) above their price */
  saleLabel: 'Diwali offer',                    // small heading on the banner
  salePercent: 20,                              // flat % shown on the banner and on every offer badge
  saleHeadline: 'Light up your home this Diwali', // big line under the percentage

  /* Order-by date — shows "Order by … for delivery before Diwali" at the top of every page and on each
     product page, and hides itself automatically the day after this date. '' = off */
  deliveryCutoff: '2026-11-03',                 // last day to order (YYYY-MM-DD) so it still arrives in time
  deliveryFestival: 'Diwali',                   // the occasion named in the message

  /* Free shipping — the bag shows "Add ₹… more for free shipping" with a progress bar. 0 = off */
  freeShippingAbove: 1999,                      // keep the same number in wrangler.toml (FREE_SHIPPING_ABOVE)

  /* Orders are saved to your admin (aangan.co.in/admin) when a shopper is sent to WhatsApp. '' = don't save */
  orderApi: '/api/orders',

  /* Where the website build reads products from: 'files' (the .json files in Products/) or
     'database' (what you manage at aangan.co.in/admin). Switch to 'database' in SETUP.md step 7. */
  productSource: 'files'
};
