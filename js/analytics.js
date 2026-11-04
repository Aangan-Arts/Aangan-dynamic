/* AANGAN analytics — Google Analytics 4 (numbers and funnel) + Microsoft Clarity (heatmaps and session replays).
   Turn on by adding your IDs in js/config.js (ga4Id, clarityId). Nothing loads while they are blank.
   Privacy: names, phone numbers and addresses are never sent; form fields are hidden in Clarity replays. */
(function(){
const CFG=window.AANGAN_CONFIG||{},P=window.AANGAN_PRODUCTS||[];
const q=[];let ready=false;
/* load the tools */
if(CFG.ga4Id){const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(CFG.ga4Id);document.head.appendChild(s);
 window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',CFG.ga4Id,{currency:'INR'})}
if(CFG.clarityId){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script',CFG.clarityId)}

/* one call sends an event to both tools */
const item=p=>p?{item_id:p.id,item_name:p.name,price:p.price==null?undefined:p.price,quantity:1}:null;
function track(name,params){params=params||{};
 if(window.gtag&&CFG.ga4Id)gtag('event',name,params);
 if(window.clarity&&CFG.clarityId){clarity('event',name);if(params.item_name)clarity('set','last_item',String(params.item_name).slice(0,60))}
 if(CFG.analyticsDebug)console.log('[AANGAN track]',name,params)}
window.AANGAN_TRACK=track;
const byId=id=>P.find(p=>p.id==id);
/* works for both p/<slug>/ and product.html?id= links */
const idFromHref=h=>{try{const u=new URL(h,document.baseURI),q=u.searchParams.get('id');if(q)return q;const p=P.find(x=>x.url&&u.pathname.endsWith('/'+x.url));return p&&p.id}catch(_){return null}};

/* product page view */
const pid=window.AANGAN_PID||new URLSearchParams(location.search).get('id');
if(pid){const p=byId(pid);if(p)track('view_item',{currency:'INR',value:p.price||0,items:[item(p)]})}

/* clicks */
const bagIds=()=>{try{return JSON.parse(localStorage.getItem('ab'))||[]}catch(_){return[]}};
const bagValue=ids=>ids.map(byId).filter(Boolean).reduce((a,p)=>a+(p.price||0),0);
/* where an add-to-bag button sits: shop grid, "Complete the look", the free-shipping suggestions in the bag, or the product page */
const addSource=t=>t.closest('.ship-add')?'free_shipping_suggestion':t.closest('.look')?'complete_the_look':t.closest('.pc')?'listing':'product_page';
document.addEventListener('click',e=>{const t=e.target.closest('a,button');if(!t)return;
 if(t.dataset.add){const p=byId(t.dataset.add);track('add_to_cart',{currency:'INR',value:p&&p.price||0,items:[item(p)],source:addSource(t)})}
 else if(t.dataset.inc){const p=byId(t.dataset.inc);track('add_to_cart',{currency:'INR',value:p&&p.price||0,items:[item(p)],source:'bag_quantity'})}
 else if(t.dataset.dec||t.dataset.rm){const id=t.dataset.dec||t.dataset.rm,p=byId(id),q=t.dataset.rm?bagIds().filter(x=>x==id).length:1;
  track('remove_from_cart',{currency:'INR',value:(p&&p.price||0)*q,items:[Object.assign(item(p)||{},{quantity:q})]})}
 else if(t.dataset.buy){const p=byId(t.dataset.buy);track('buy_now',{currency:'INR',value:p&&p.price||0,items:[item(p)]})}
 else if(t.id=='coWa'||t.id=='coForm'){const ids=bagIds(),items=ids.map(byId).filter(Boolean);
  track('begin_checkout',{currency:'INR',value:bagValue(ids),items:items.map(item),checkout_method:t.id=='coWa'?'whatsapp_direct':'details_form'})}
 else if(t.dataset.open=='custom')track('custom_request_open');
 else if(t.dataset.open=='bag')track('view_cart');
 else if(t.classList.contains('stile')){const p=byId(idFromHref(t.href));track('select_promotion',{promotion_name:CFG.saleLabel||'Sale',items:[item(p)]})}
 else if(t.closest('.soc'))track('contact_click',{platform:/instagram/.test(t.href)?'instagram':'whatsapp'});
 else if(t.tagName=='A'&&idFromHref(t.href)&&(t.closest('#shopgrid')||t.closest('.look'))){const p=byId(idFromHref(t.href));
  track('select_item',{items:[item(p)],item_list_name:t.closest('.look')?'complete_the_look':'shop'})}
},true);

/* free shipping reached: sent once per visit, the first time the bag passes the amount in js/config.js */
document.addEventListener('aangan:render',()=>{const T=Number(CFG.freeShippingAbove)||0;if(!T)return;
 let sent=false;try{sent=sessionStorage.getItem('aangan_fs')=='1'}catch(_){}if(sent)return;
 const v=bagValue(bagIds());if(v>=T){track('free_shipping_unlocked',{currency:'INR',value:v,threshold:T});try{sessionStorage.setItem('aangan_fs','1')}catch(_){}}});

/* shop filters and sorting */
document.addEventListener('change',e=>{if(e.target.id=='pf')track('filter_price',{max_price:e.target.value||'all'});if(e.target.id=='so')track('sort_products',{sort:e.target.value})},true);

/* hide every form field in Clarity replays (bag/checkout and custom request) */
const mask=()=>['#p-bag','#p-custom'].forEach(s=>{const el=document.querySelector(s);if(el)el.setAttribute('data-clarity-mask','true')});
document.readyState=='loading'?document.addEventListener('DOMContentLoaded',mask):mask();
})();
