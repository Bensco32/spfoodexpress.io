document.addEventListener("DOMContentLoaded",()=>{
 const s=getSession(); if(!s||s.role!=="customer"){location.href="login.html";return}
 const db=getDB(),c=db.customers.find(x=>x.id===s.id); if(!c){logout();return}
 document.getElementById("welcomeName").textContent=`Welcome, ${c.name.split(" ")[0]} 👋`;
 document.getElementById("welcomeMini").innerHTML=`<b>${escapeHTML(c.name)}</b><div class="muted" style="font-size:12px;margin-top:4px">${escapeHTML(c.email)}</div>`;
 document.getElementById("logoutBtn").onclick=logout;
 document.querySelectorAll("[data-tab]").forEach(a=>a.addEventListener("click",()=>renderTab(a.dataset.tab)));
 renderTab(location.hash.slice(1)||"orders");
});
function customer(){return getDB().customers.find(c=>c.id===getSession().id)}
function renderTab(tab){
 const box=document.getElementById("dashboardContent"),c=customer(),db=getDB();
 document.querySelectorAll("[data-tab]").forEach(a=>a.classList.toggle("active",a.dataset.tab===tab));
 if(tab==="profile")box.innerHTML=`<div class="card" style="padding:25px"><h2>My Profile</h2><form id="profileForm" class="form-grid"><div class="form-group"><label>Full Name</label><input class="input" id="pname" value="${escapeHTML(c.name)}"></div><div class="form-group"><label>Phone</label><input class="input" id="pphone" value="${escapeHTML(c.phone)}"></div><div class="form-group full"><label>Email</label><input class="input" value="${escapeHTML(c.email)}" disabled></div><button class="btn btn-primary">Save Profile</button></form></div>`;
 else if(tab==="address")box.innerHTML=`<div class="card" style="padding:25px"><h2>Saved Address</h2><form id="addressForm"><textarea class="textarea" id="address">${escapeHTML(c.address)}</textarea><button class="btn btn-primary" style="margin-top:12px">Save Address</button></form></div>`;
 else if(tab==="password")box.innerHTML=`<div class="card" style="padding:25px"><h2>Change Password</h2><form id="passwordForm"><div class="form-grid"><div class="form-group"><label>Current Password</label><input class="input" type="password" id="oldPass"></div><div class="form-group"><label>New Password</label><input class="input" type="password" id="newPass" minlength="6"></div></div><button class="btn btn-primary" style="margin-top:15px">Change Password</button></form></div>`;
 else if(tab==="favorites"){
   const favs=db.favorites.filter(x=>x.customerId===c.id).map(x=>db.foods.find(f=>f.id===x.foodId)).filter(Boolean);
   box.innerHTML=`<h2>My Favorites ❤️</h2><p class="muted">Your saved meals are kept here so you can order them without searching again.</p><div class="grid">${favs.map(f=>`<article class="card food-card"><button class="heart active" onclick="toggleFavorite('${f.id}');renderTab('favorites')">♥</button><div class="food-image">${f.emoji}</div><div class="food-body"><h3>${escapeHTML(f.name)}</h3><p>${escapeHTML(f.description)}</p><div class="food-meta"><b class="price">${money(f.price)}</b><button class="btn btn-primary" onclick="addCart('${f.id}')">Order</button></div></div></article>`).join("")||`<div class="empty" style="grid-column:1/-1">You have no favourite meals yet. Go to the menu and tap ♡.</div>`}</div>`;
 } else if(tab==="reviews"){
   const reviews=db.reviews.filter(r=>r.customerId===c.id);
   box.innerHTML=`<h2>My Reviews ⭐</h2><p class="muted">Your comments are private. Only SP FoodExpress staff can see them.</p>${reviews.map(r=>`<div class="card review-box"><b>${escapeHTML(r.foodName)}</b><div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div><p>“${escapeHTML(r.comment)}”</p><small class="muted">${new Date(r.createdAt).toLocaleString()}</small></div>`).join("")||`<div class="empty">You have not submitted a review yet. After ordering, you can review eligible meals.</div>`}`;
 } else if(tab==="orders"){
   const orders=db.orders.filter(o=>o.customerId===c.id);
   box.innerHTML=`<h2>My Orders 📦</h2><p class="muted">Order status is controlled manually by SP FoodExpress staff.</p>${orders.map(o=>orderCustomerCard(o)).join("")||`<div class="empty">No orders yet. <a href="index.html#menu" style="color:var(--blue);font-weight:800">Order your first meal.</a></div>`}`;
 }
 if(document.getElementById("profileForm"))document.getElementById("profileForm").onsubmit=e=>{e.preventDefault();c.name=document.getElementById("pname").value.trim();c.phone=document.getElementById("pphone").value.trim();saveDB(db);document.getElementById("welcomeName").textContent=`Welcome, ${c.name.split(" ")[0]} 👋`;toast("Profile updated")};
 if(document.getElementById("addressForm"))document.getElementById("addressForm").onsubmit=e=>{e.preventDefault();c.address=document.getElementById("address").value.trim();saveDB(db);toast("Address saved")};
 if(document.getElementById("passwordForm"))document.getElementById("passwordForm").onsubmit=e=>{e.preventDefault();if(document.getElementById("oldPass").value!==c.password){toast("Current password is incorrect","error");return}c.password=document.getElementById("newPass").value;saveDB(db);toast("Password changed")};
}
function orderCustomerCard(o){
 const statusClass=o.status.toLowerCase();
 const steps=["Received","Preparing","Ready","Completed"],idx=steps.indexOf(o.status);
 const db=getDB(),eligible=o.items.map(i=>db.reviews.some(r=>r.customerId===o.customerId&&r.orderId===o.id&&r.foodId===i.foodId)?null:i).filter(Boolean);
 return `<div class="card order-card"><div class="order-head"><div><h3 style="margin:0">${o.orderNumber}</h3><small class="muted">${new Date(o.createdAt).toLocaleString()} · ${escapeHTML(o.orderType)}</small></div><span class="status-pill ${statusClass}">${escapeHTML(o.status)}</span></div>
 <div class="tracker">${steps.map((x,i)=>`<div class="track-step ${i<=idx?"done":""} ${i===idx?"current":""}"><div class="track-dot">${i<idx?"✓":i+1}</div><small>${x}</small></div>`).join("")}</div>
 <ul class="items-list">${o.items.map(i=>`<li>${escapeHTML(i.name)} × ${i.qty} — ${money(i.price*i.qty)}</li>`).join("")}</ul><p><b>Total: ${money(o.total)}</b></p>
 ${eligible.length&&["Ready","Completed"].includes(o.status)?`<div class="review-box"><b>Rate your meal privately</b><form onsubmit="submitReviews(event,'${o.id}')">${eligible.map(i=>`<div style="margin-top:12px"><label>${escapeHTML(i.name)}</label><select class="select review-rating" data-food="${i.foodId}"><option value="5">⭐⭐⭐⭐⭐ 5</option><option value="4">⭐⭐⭐⭐ 4</option><option value="3">⭐⭐⭐ 3</option><option value="2">⭐⭐ 2</option><option value="1">⭐ 1</option></select><input class="input review-comment" data-food="${i.foodId}" style="margin-top:7px" placeholder="Tell us what you liked or what we can improve"></div>`).join("")}<button class="btn btn-primary" style="margin-top:12px">Send Private Review</button></form></div>`:""}</div>`;
}
function submitReviews(e,orderId){
 e.preventDefault();const db=getDB(),o=db.orders.find(x=>x.id===orderId),s=getSession();document.querySelectorAll(".review-rating").forEach(sel=>{const foodId=sel.dataset.food,comment=document.querySelector(`.review-comment[data-food="${foodId}"]`).value.trim();if(!comment)return;const food=db.foods.find(f=>f.id===foodId);db.reviews.push({id:uid("REV"),customerId:s.id,orderId,foodId,foodName:food.name,rating:Number(sel.value),comment,createdAt:new Date().toISOString()});});saveDB(db);toast("Private review sent to SP FoodExpress");renderTab("orders");
}
