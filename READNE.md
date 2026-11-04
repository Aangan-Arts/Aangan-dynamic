NEW: this site can now run on Cloudflare with an admin at aangan.co.in/admin for products and orders.
Follow SETUP.md once. After that, add and edit products in the admin and press Publish; the steps
below are only needed while productSource in js/config.js is still 'files'.

ONE-TIME SETUP (only the first time on a computer): install Node.js from nodejs.org, then in Terminal:

cd Projects/Aangan
npm install

ADDING OR UPDATING PRODUCTS
Add the new product with the name "Date_number(e.g. 20261022_1000)" and add the photo in the Products/web folder and add the .json file with same name in the Products folder.
For existing products replace with the same name.
Any photo size or format is fine (JPG, PNG, WebP, straight from the phone): the build makes small, fast copies automatically
in Products/cards and Products/detail. Never edit those two folders by hand.

for price and MRP -> Price should be our decided price to sell and calculate the MRP by this formula = price / 0.8

once added all products, open terminal and execute:

cd Projects/Aangan
node tools/build-products.js
git add .
git commit -m "Updated Products"
git push
