/** Integration checks against a RUNNING DEVELOPMENT server. Uses only sample/test data.
 * Run: node tests/api-smoke.mjs http://127.0.0.1:5080
 */
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:5080';
let count = 0;
function check(name, fn) { fn(); count++; console.log(`PASS ${name}`); }
async function request(path, {method='GET', body, token, cookie, headers={}}={}) {
  const response = await fetch(base+'/api'+path, {method, headers:{'Content-Type':'application/json','X-MarketHub':'web',...(token?{Authorization:`Bearer ${token}`} : {}),...(cookie?{Cookie:cookie}:{}),...headers}, body: body ? JSON.stringify(body) : undefined});
  const text = await response.text(); let data; try {data=JSON.parse(text);} catch{data=text;}
  return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
const config=await request('/config');assert.equal(config.data.demo,true,'Run only against Development');
const catalog=await request('/products');
check('catalog has bilingual sample products',()=>{assert.equal(catalog.status,200);assert.ok(catalog.data.items.length>=12);assert.ok(catalog.data.items[0].nameAr);});
const unauthorized=await request('/orders');check('orders require authentication',()=>assert.equal(unauthorized.status,401));
const crossOrigin=await request('/auth/login',{method:'POST',body:{email:'customer@markethub.demo',password:'MarketHub!2026'},headers:{Origin:'https://attacker.example'}});check('cross-origin cookie endpoint rejected',()=>assert.equal(crossOrigin.status,403));
const customer=await request('/auth/login',{method:'POST',body:{email:'customer@markethub.demo',password:'MarketHub!2026'}});check('customer login',()=>assert.equal(customer.status,200));
const token=customer.data.accessToken;
const forbidden=await request('/admin/overview',{token});check('customer cannot enter admin API',()=>assert.equal(forbidden.status,403));
const sellerForbidden=await request('/vendor/products',{token});check('customer cannot enter seller API',()=>assert.equal(sellerForbidden.status,403));
const vendor=await request('/auth/login',{method:'POST',body:{email:'vendor@markethub.demo',password:'MarketHub!2026'}});
const vendorProducts=await request('/vendor/products',{token:vendor.data.accessToken});
check('seller sees only own inventory',()=>assert.ok(vendorProducts.data.every(p=>p.vendorId===vendor.data.user.vendorId)));
const foreign=catalog.data.items.find(p=>p.vendorId!==vendor.data.user.vendorId);
const tamper=await request('/vendor/products/'+foreign.id,{method:'PUT',token:vendor.data.accessToken,body:foreign});check('seller cannot update another seller product',()=>assert.equal(tamper.status,404));
const p=catalog.data.items.find(p=>p.stock>3&&p.stock<1000);
const key=crypto.randomUUID();const payload={recipient:'Integration Test',phone:'+966500000000',address:'Test Street Building 24',city:'Riyadh',items:[{productId:p.id,quantity:2}],total:1};
const order=await request('/orders',{method:'POST',token,body:payload,headers:{'Idempotency-Key':key}});
check('checkout recalculates prices instead of trusting client totals',()=>{assert.equal(order.status,201);assert.equal(order.data.subtotal,p.price*2);assert.notEqual(order.data.total,1);});
const repeat=await request('/orders',{method:'POST',token,body:payload,headers:{'Idempotency-Key':key}});check('duplicate checkout returns same order',()=>assert.equal(repeat.data.id,order.data.id));
const stock=await request('/products/'+p.id);check('stock reserved once',()=>assert.equal(stock.data.stock,p.stock-2));
const conflict=await request('/orders',{method:'POST',token,body:{...payload,city:'Jeddah'},headers:{'Idempotency-Key':key}});check('idempotency key payload conflict rejected',()=>assert.equal(conflict.status,409));
const invalid=await request('/orders',{method:'POST',token,body:{...payload,items:[{productId:p.id,quantity:0}]},headers:{'Idempotency-Key':crypto.randomUUID()}});check('nested quantity validation',()=>assert.equal(invalid.status,400));
const outsider=await request('/orders/'+order.data.id,{token:vendor.data.accessToken});check('order ownership enforced',()=>assert.equal(outsider.status,404));
const decline=await request('/orders/'+order.data.id+'/demo-payment?success=false',{method:'POST',token});check('declined demo payment cancels order',()=>assert.equal(decline.data.paymentStatus,'Cancelled'));
await request('/orders/'+order.data.id+'/demo-payment?success=false',{method:'POST',token});
const restored=await request('/products/'+p.id);check('decline restores inventory exactly once',()=>assert.equal(restored.data.stock,p.stock));
const empty=await request('/products?search=does-not-exist-938476');check('search empty state',()=>assert.equal(empty.data.total,0));
const ar=await request('/products?search='+encodeURIComponent('مصباح'));check('Arabic catalog search',()=>assert.ok(ar.data.total>=1));
const refresh=await request('/auth/refresh',{method:'POST',cookie:customer.cookie});check('refresh session rotates',()=>{assert.equal(refresh.status,200);assert.notEqual(refresh.cookie,customer.cookie);});
const replay=await request('/auth/refresh',{method:'POST',cookie:customer.cookie});check('old refresh token rejected',()=>assert.equal(replay.status,401));
await request('/auth/logout',{method:'POST',cookie:refresh.cookie});
const loggedOut=await request('/auth/refresh',{method:'POST',cookie:refresh.cookie});check('logout revokes refresh session',()=>assert.equal(loggedOut.status,401));
const admin=await request('/auth/login',{method:'POST',body:{email:'admin@markethub.demo',password:'MarketHub!2026'}});
const overview=await request('/admin/overview',{token:admin.data.accessToken});check('admin overview includes audit trail',()=>{assert.equal(overview.status,200);assert.ok(overview.data.audit.some(a=>a.action==='Reservation released'));});
console.log(`\n${count} API integration checks passed.`);
