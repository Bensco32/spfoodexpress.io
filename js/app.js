document.addEventListener("DOMContentLoaded",()=>{
  if(document.getElementById("menuGrid")) initHome();
  if(document.getElementById("loginForm")) initLogin();
  if(document.getElementById("registerForm")) initRegister();
});

function initHome(){
  const db=getDB(), grid=document.getElementById("menuGrid"), search=document.getElementById("menuSearch"), filter=document.getElementById("categoryFilter");
  [...new Set(db.foods.map(f=>f.category))].forEach(c=>filter.insertAdjacentHTML("beforeend",`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`));
  function render(){
    const q=(search.value||"").toLowerCase(), cat=filter.value;
    const session=getSession(), favs=session?.role==="customer"?getDB().favorites.filter(x=>x.customerId===session.id).map(x=>x.foodId):[];
    const foods=getDB().foods.filter(f=>(cat==="all"||f.category===cat)&&(!q||`${f.name} ${f.description} ${f.category}`.toLowerCase().includes(q)));
    grid.innerHTML=foods.map(f=>`
      <article class="card food-card">
        ${f.badge?`<span class="badge">${escapeHTML(f.badge)}</span>`:""}
        <button class="heart ${favs.includes(f.id)?"active":""}" onclick="toggleFavorite('${f.id}')" title="Add to favourite">${favs.includes(f.id)?"♥":"♡"}</button>
        <div class="food-image">${f.emoji||"🍽️"}</div>
        <div class="food-body"><h3>${escapeHTML(f.name)}</h3><p>${escapeHTML(f.description)}</p>
        <div class="food-meta"><span><b class="price">${money(f.price)}</b><br><small class="muted">⭐ ${Number(f.rating||0).toFixed(1)} · ${f.prep} min</small></span>
        <button class="btn btn-primary" onclick="addCart('${f.id}')">Add</button></div></div>
      </article>`).join("") || `<div class="empty" style="grid-column:1/-1">No meals matched your search.</div>`;
  }
  search.addEventListener("input",render); filter.addEventListener("change",render); render();
}
function toggleFavorite(foodId){
  const s=getSession(); if(!s||s.role!=="customer"){ location.href="login.html"; return; }
  const db=getDB(), i=db.favorites.findIndex(x=>x.customerId===s.id&&x.foodId===foodId);
  if(i>=0){db.favorites.splice(i,1);toast("Removed from favourites");}
  else {db.favorites.push({id:uid("FAV"),customerId:s.id,foodId,createdAt:new Date().toISOString()});toast("Added to your favourites ❤️");}
  saveDB(db); if(document.getElementById("menuGrid")) initHome();
}
function getCart(){return JSON.parse(localStorage.getItem("spfe_cart")||"[]")}
function saveCart(c){localStorage.setItem("spfe_cart",JSON.stringify(c))}
function addCart(foodId){
  const s=getSession(); if(!s){location.href="login.html";return}
  const cart=getCart(), found=cart.find(x=>x.foodId===foodId); if(found)found.qty++; else cart.push({foodId,qty:1}); saveCart(cart); toast("Added to cart 🛒");
  const cc=document.getElementById("cartCount"); if(cc)cc.textContent=cart.reduce((a,x)=>a+x.qty,0);
  showCheckout();
}
function showCheckout(){
  let existing=document.getElementById("checkoutModal"); if(existing)existing.remove();
  const db=getDB(),cart=getCart(); if(!cart.length)return;
  const subtotal=cart.reduce((sum,x)=>sum+(db.foods.find(f=>f.id===x.foodId)?.price||0)*x.qty,0);
  const rows=cart.map(x=>{const f=db.foods.find(f=>f.id===x.foodId);return `<div style="display:flex;justify-content:space-between;padding:8px 0"><span>${escapeHTML(f.name)} × ${x.qty}</span><b>${money(f.price*x.qty)}</b></div>`}).join("");
  const modal=document.createElement("div");modal.id="checkoutModal";modal.className="modal-backdrop open";modal.innerHTML=`<div class="modal"><div class="modal-head"><h2>Your Order</h2><button class="close" onclick="document.getElementById('checkoutModal').remove()">×</button></div>${rows}<hr><p><b>Subtotal: ${money(subtotal)}</b></p><form id="checkoutForm"><div class="form-grid"><div class="form-group"><label>Order Type</label><select class="select" id="orderType"><option>Delivery</option><option>Takeaway</option><option>Dine-in</option></select></div><div class="form-group"><label>Payment</label><select class="select" id="payment"><option>Cash</option><option>Bank Transfer</option><option>Card (Demo)</option></select></div><div class="form-group full" id="addressGroup"><label>Delivery Address</label><textarea class="textarea" id="orderAddress">${escapeHTML(getDB().customers.find(c=>c.id===getSession().id)?.address||"")}</textarea></div><div class="form-group full"><label>Order Note</label><textarea class="textarea" id="note" placeholder="Special instructions..."></textarea></div></div><button class="btn btn-primary" style="width:100%;margin-top:15px">Place Order · ${money(subtotal+(subtotal<20000?1500:0))}</button></form></div>`;
  document.body.appendChild(modal);
  document.getElementById("orderType").addEventListener("change",e=>document.getElementById("addressGroup").style.display=e.target.value==="Delivery"?"flex":"none");
  document.getElementById("checkoutForm").addEventListener("submit",e=>{e.preventDefault();placeOrder(subtotal)});
}
function placeOrder(subtotal){
  const s=getSession(),db=getDB(),cart=getCart(),type=document.getElementById("orderType").value;
  const order={id:uid("ORD"),orderNumber:"SP-"+Math.floor(100000+Math.random()*900000),customerId:s.id,items:cart.map(x=>{const f=db.foods.find(f=>f.id===x.foodId);return {foodId:f.id,name:f.name,qty:x.qty,price:f.price}}),orderType:type,address:type==="Delivery"?document.getElementById("orderAddress").value:"",payment:document.getElementById("payment").value,note:document.getElementById("note").value,subtotal,deliveryFee:type==="Delivery"&&subtotal<20000?1500:0,total:subtotal+(type==="Delivery"&&subtotal<20000?1500:0),status:"Received",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  db.orders.unshift(order);saveDB(db);saveCart([]);document.getElementById("checkoutModal").remove();toast(`Order ${order.orderNumber} received`);setTimeout(()=>location.href="dashboard.html#orders",500);
}
function initLogin(){
 document.getElementById("loginForm").addEventListener("submit",e=>{e.preventDefault();const email=document.getElementById("email").value.trim().toLowerCase(),pass=document.getElementById("password").value,db=getDB(),c=db.customers.find(x=>x.email===email&&x.password===pass);if(!c){toast("Invalid email or password","error");return}setSession({role:"customer",id:c.id});location.href="dashboard.html";});
}
function initRegister(){
 document.getElementById("registerForm").addEventListener("submit",e=>{e.preventDefault();const db=getDB(),email=document.getElementById("email").value.trim().toLowerCase();if(db.customers.some(c=>c.email===email)){toast("An account with this email already exists","error");return}const c={id:uid("CUS"),name:document.getElementById("name").value.trim(),phone:document.getElementById("phone").value.trim(),email,password:document.getElementById("password").value,address:document.getElementById("address").value.trim(),createdAt:new Date().toISOString()};db.customers.push(c);saveDB(db);setSession({role:"customer",id:c.id});toast("Account created");setTimeout(()=>location.href="dashboard.html",500);});
}
function logout(){clearSession();localStorage.removeItem("spfe_cart");location.href="index.html"}
