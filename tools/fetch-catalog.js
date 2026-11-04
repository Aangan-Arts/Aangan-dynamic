/* Prints the live product catalogue as JSON. Used by build-products.js when CATALOG_URL is set. */
const url = process.argv[2];
(async () => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data.ok || !Array.isArray(data.products)) throw new Error('unexpected reply');
      process.stdout.write(JSON.stringify(data));
      return;
    } catch (e) {
      console.error(`Catalogue fetch attempt ${attempt} failed: ${e.message}`);
      if (attempt === 3) process.exit(1);
      await new Promise(res => setTimeout(res, 3000 * attempt));
    }
  }
})();
