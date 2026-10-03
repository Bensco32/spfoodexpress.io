const SP_SEED = {
  admin: {
    id: "admin-001",
    name: "SP FoodExpress Admin",
    username: "admin",
    password: "admin12345"
  },
  foods: [
    {id:"jollof",name:"Smoky Party Jollof Rice",category:"Rice & Sides",price:4500,prep:20,badge:"Best Seller",description:"Smoky Nigerian party jollof served with tender chicken.",emoji:"🍛",rating:4.8},
    {id:"asun",name:"Spicy Goat Meat Asun",category:"Grills",price:6500,prep:25,badge:"Chef Pick",description:"Peppered grilled goat meat with onions and fresh herbs.",emoji:"🥩",rating:4.7},
    {id:"pounded",name:"Pounded Yam & Egusi",category:"Swallow",price:6000,prep:25,badge:"Popular",description:"Smooth pounded yam with rich, locally seasoned egusi soup.",emoji:"🥣",rating:4.8},
    {id:"amala",name:"Amala, Ewedu & Gbegiri",category:"Swallow",price:5500,prep:25,badge:"Popular",description:"Classic amala served with ewedu and gbegiri.",emoji:"🍲",rating:4.6},
    {id:"okra",name:"Seafood Okra",category:"Swallow",price:7000,prep:30,badge:"Premium",description:"Okra soup packed with prawns, fish and rich seafood flavour.",emoji:"🍤",rating:4.9},
    {id:"fried",name:"Special Fried Rice",category:"Rice & Sides",price:5000,prep:20,badge:"Popular",description:"Colourful fried rice with vegetables and succulent chicken.",emoji:"🍚",rating:4.6},
    {id:"suya",name:"SP Special Suya",category:"Grills",price:4500,prep:18,badge:"Hot",description:"Char-grilled spicy beef suya with onions and pepper.",emoji:"🍢",rating:4.8},
    {id:"catfish",name:"Grilled Catfish",category:"Grills",price:8500,prep:35,badge:"Premium",description:"Whole grilled catfish finished with our signature pepper sauce.",emoji:"🐟",rating:4.9},
    {id:"pepper",name:"Assorted Pepper Soup",category:"Soups",price:4500,prep:20,badge:"Chef Pick",description:"Aromatic hot pepper soup with assorted meat.",emoji:"🍵",rating:4.7},
    {id:"zobo",name:"Fresh Zobo",category:"Drinks",price:1000,prep:5,badge:"",description:"Chilled hibiscus drink infused with fruit and spices.",emoji:"🥤",rating:4.6},
    {id:"palmwine",name:"Palm Wine",category:"Drinks",price:1800,prep:5,badge:"",description:"Freshly served traditional palm wine.",emoji:"🍹",rating:4.5}
  ]
};

function initDatabase(){
  if(!localStorage.getItem("spfe_db")){
    const db = {
      customers: [],
      foods: SP_SEED.foods,
      favorites: [],
      orders: [],
      reviews: [],
      reservations: []
    };
    localStorage.setItem("spfe_db", JSON.stringify(db));
  } else {
    const db = getDB();
    db.foods = db.foods && db.foods.length ? db.foods : SP_SEED.foods;
    db.customers = db.customers || [];
    db.favorites = db.favorites || [];
    db.orders = db.orders || [];
    db.reviews = db.reviews || [];
    db.reservations = db.reservations || [];
    saveDB(db);
  }
}
function getDB(){ return JSON.parse(localStorage.getItem("spfe_db") || '{"customers":[],"foods":[],"favorites":[],"orders":[],"reviews":[],"reservations":[]}'); }
function saveDB(db){ localStorage.setItem("spfe_db", JSON.stringify(db)); }
function getSession(){ return JSON.parse(localStorage.getItem("spfe_session") || "null"); }
function setSession(session){ localStorage.setItem("spfe_session", JSON.stringify(session)); }
function clearSession(){ localStorage.removeItem("spfe_session"); }
function money(n){ return "₦" + Number(n||0).toLocaleString("en-NG"); }
function uid(prefix="SP"){ return prefix + "-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase(); }
function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function toast(message,type="success"){
  let el=document.querySelector(".toast");
  if(!el){ el=document.createElement("div"); el.className="toast"; document.body.appendChild(el); }
  el.textContent=message; el.dataset.type=type; el.classList.add("show");
  clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>el.classList.remove("show"),2600);
}
initDatabase();
