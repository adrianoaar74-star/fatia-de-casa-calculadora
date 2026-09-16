const $ = (s) => document.querySelector(s);
const ingredientsEl = $('#ingredients');
const recipeListEl = $('#recipeList');
const storageKey = 'fatiaCasaRecipesV1';
let recipes = [];
let currentId = null;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2));
const money = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number.isFinite(n)?n:0);
const units = ['g','kg','ml','l','un'];
const cat = u => ['g','kg'].includes(u)?'peso':['ml','l'].includes(u)?'volume':'un';
const base = (q,u) => Number(q||0) * (u==='kg'||u==='l'?1000:1);
function costOf(i){ if(cat(i.buyUnit)!==cat(i.useUnit)) return 0; const b=base(i.buyQty,i.buyUnit); return b>0?Number(i.price||0)*(base(i.useQty,i.useUnit)/b):0; }
function starter(){return {id:uid(),name:'Bolo de cenoura',yieldQty:1,margin:70,ingredients:[
  {id:uid(),name:'Farinha de trigo',buyQty:1,buyUnit:'kg',price:6.50,useQty:300,useUnit:'g'},
  {id:uid(),name:'Ovos',buyQty:12,buyUnit:'un',price:12,useQty:4,useUnit:'un'},
  {id:uid(),name:'Açúcar',buyQty:1,buyUnit:'kg',price:5,useQty:250,useUnit:'g'},
  {id:uid(),name:'Cenoura',buyQty:1,buyUnit:'kg',price:6.90,useQty:300,useUnit:'g'}]};}
function load(){try{recipes=JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{recipes=[]} if(!recipes.length){const r=starter();recipes=[r];saveAll();} currentId=recipes[0].id; renderAll();}
function saveAll(){localStorage.setItem(storageKey,JSON.stringify(recipes));}
function current(){return recipes.find(r=>r.id===currentId);}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),1800)}
function renderRecipes(){recipeListEl.innerHTML=recipes.map(r=>`<button class="recipe-item ${r.id===currentId?'active':''}" data-id="${r.id}"><strong>${escapeHtml(r.name||'Sem nome')}</strong><small>${r.ingredients.length} ingrediente${r.ingredients.length===1?'':'s'} • ${money(r.ingredients.reduce((a,i)=>a+costOf(i),0))}</small></button>`).join('');$('#recipeCount').textContent=recipes.length;recipeListEl.querySelectorAll('.recipe-item').forEach(b=>b.onclick=()=>{syncHeader();saveAll();currentId=b.dataset.id;renderAll();});}
function renderIngredients(){const r=current(); if(!r.ingredients.length){ingredientsEl.innerHTML='<div class="empty">Nenhum ingrediente ainda. Toque em “Adicionar”.</div>';return;} ingredientsEl.innerHTML=r.ingredients.map(i=>`<div class="ingredient-row" data-id="${i.id}">
<input class="name" data-k="name" value="${escapeAttr(i.name)}" placeholder="Ingrediente">
<input class="buyqty" data-k="buyQty" type="number" min="0" step="0.01" value="${i.buyQty}">
<select data-k="buyUnit">${units.map(u=>`<option ${u===i.buyUnit?'selected':''}>${u}</option>`).join('')}</select>
<input data-k="price" type="number" min="0" step="0.01" value="${i.price}">
<input data-k="useQty" type="number" min="0" step="0.01" value="${i.useQty}">
<select data-k="useUnit">${units.map(u=>`<option ${u===i.useUnit?'selected':''}>${u}</option>`).join('')}</select>
<div class="row-cost">${money(costOf(i))}</div><button class="delete-row" title="Excluir ingrediente" aria-label="Excluir ingrediente">×</button></div>`).join('');
 ingredientsEl.querySelectorAll('.ingredient-row').forEach(row=>{const i=current().ingredients.find(x=>x.id===row.dataset.id); row.querySelectorAll('[data-k]').forEach(el=>el.addEventListener('input',()=>{const k=el.dataset.k;i[k]=['name','buyUnit','useUnit'].includes(k)?el.value:Number(el.value||0);row.querySelector('.row-cost').textContent=money(costOf(i));calc();saveAll();renderRecipes();}));row.querySelector('.delete-row').onclick=()=>{current().ingredients=current().ingredients.filter(x=>x.id!==i.id);saveAll();renderIngredients();calc();renderRecipes();};});}
function syncHeader(){const r=current();if(!r)return;r.name=$('#recipeName').value.trim()||'Sem nome';r.yieldQty=Math.max(1,Number($('#yieldQty').value||1));r.margin=Number($('#marginSlider').value||0);}
function renderAll(){const r=current();$('#recipeName').value=r.name;$('#yieldQty').value=r.yieldQty;$('#marginSlider').value=r.margin;$('#marginLabel').textContent=r.margin+'%';renderRecipes();renderIngredients();calc();}
function calc(){const r=current();const total=r.ingredients.reduce((a,i)=>a+costOf(i),0);const y=Math.max(1,Number($('#yieldQty').value||1));const margin=Number($('#marginSlider').value||0);const sale=total*(1+margin/100);const profit=sale-total;$('#totalCost').textContent=money(total);$('#unitCost').textContent=money(total/y);$('#salePrice').textContent=money(sale);$('#profitValue').textContent=money(profit);$('#profitPerUnit').textContent=money(profit/y);$('#marginLabel').textContent=margin+'%';$('#formulaText').textContent=`${money(total)} + ${margin}% = ${money(sale)} • rendimento: ${y} un.`;}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}function escapeAttr(s=''){return escapeHtml(s);}
$('#addIngredientBtn').onclick=()=>{current().ingredients.push({id:uid(),name:'Novo ingrediente',buyQty:1,buyUnit:'kg',price:0,useQty:0,useUnit:'g'});saveAll();renderIngredients();renderRecipes();calc();};
$('#yieldQty').addEventListener('input',()=>{current().yieldQty=Math.max(1,Number($('#yieldQty').value||1));calc();saveAll();});
$('#marginSlider').addEventListener('input',()=>{current().margin=Number($('#marginSlider').value);calc();saveAll();});
$('#recipeName').addEventListener('input',()=>{current().name=$('#recipeName').value;saveAll();renderRecipes();});
$('#saveBtn').onclick=()=>{syncHeader();saveAll();renderRecipes();showToast('Receita salva neste aparelho');};
$('#newRecipeBtn').onclick=()=>{syncHeader();const r={id:uid(),name:'Nova receita',yieldQty:1,margin:70,ingredients:[]};recipes.unshift(r);currentId=r.id;saveAll();renderAll();showToast('Nova receita criada');};
$('#duplicateBtn').onclick=()=>{syncHeader();const src=current();const clone={...JSON.parse(JSON.stringify(src)),id:uid(),name:src.name+' — cópia',ingredients:src.ingredients.map(i=>({...i,id:uid()}))};recipes.unshift(clone);currentId=clone.id;saveAll();renderAll();showToast('Receita duplicada');};
$('#deleteRecipeBtn').onclick=()=>{if(recipes.length===1){showToast('Crie outra receita antes de excluir esta');return;}if(confirm('Excluir esta receita?')){recipes=recipes.filter(r=>r.id!==currentId);currentId=recipes[0].id;saveAll();renderAll();showToast('Receita excluída');}};
window.addEventListener('beforeunload',()=>{syncHeader();saveAll();});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(()=>{}));}
load();