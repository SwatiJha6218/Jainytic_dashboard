
/* ══════════ CONNECTION ══════════ */
const username="mk2",password="Pbtpl@135",encoded=btoa(username+":"+password);
const BASE="/bc/Jainytic/ODataV4/Company('Jainytic Packaging Pvt. Ltd.')";
const CLE_API=BASE+"/customer_Ledger_Entry_API",CUSTOMER_API=BASE+"/customerAPI";


/* ══════════ STATE ══════════ */
let custMap={},allCLE=[],filtCLE=[],openRows=[],custSum=[],CH={};
let modalInvs=[],modalFilteredInvs=[],newCustList=[],repeatCustList=[],nrModalRows=[],nrFilteredRows=[];
let t5Page=1,t5PS=25,agePage=1,agePS=25,ageDrillRows=[];
let mktPage=1,mktPS=25,mktDrillRows=[],locPage=1,locPS=25,locDrillRows=[];
let mPage=1,mPS=25,nrPage=1,nrPS=25;
let ageOvPage=1,ageOvPageSize=25,ageOvDrillRows=[],_ageDrillBk="b30";
let donutDrillAllRows=[],donutDrillFilteredRows=[],donutDrillPage=1,donutDrillPageSize=25;
let salesYoYChartInst=null,salesPopupOpen=false,salesYoYData={};
let _fyLocked=false;

/* ══════════ AUTO-REFRESH ══════════ */
const AUTO_REFRESH_SECS=3600;let countdownSecs=AUTO_REFRESH_SECS,isPaused=false;
function togglePause(){isPaused=!isPaused;const btn=getEl("pauseBtn"),box=getEl("countdownBox");if(isPaused){if(btn){btn.textContent="▶ Resume";btn.classList.add("active");}if(box)box.classList.add("paused");const l=getEl("countdownLabel");if(l)l.textContent="⏸ Paused at ";}else{if(btn){btn.textContent="⏸ Pause";btn.classList.remove("active");}if(box)box.classList.remove("paused");const l=getEl("countdownLabel");if(l)l.textContent="⏱ Auto-refresh in ";updateCountdownUI();}}
function startCountdown(){countdownSecs=AUTO_REFRESH_SECS;updateCountdownUI();setInterval(()=>{if(isPaused)return;countdownSecs--;if(countdownSecs<=0){location.reload();return;}updateCountdownUI();},1000);}
function updateCountdownUI(){const m=Math.floor(countdownSecs/60),s=countdownSecs%60,txt=m+":"+String(s).padStart(2,"0");const box=getEl("countdownBox"),span=getEl("countdownTxt");if(span)span.textContent=txt;if(box&&!isPaused){if(countdownSecs<=300){box.className="countdown-box urgent";}else{box.className="countdown-box";box.style.color="";}}}
startCountdown();

function setText(id,val){const el=document.getElementById(id);if(el)el.textContent=val;}
function setHTML(id,val){const el=document.getElementById(id);if(el)el.innerHTML=val;}
function getEl(id){return document.getElementById(id);}
function openDrillPage(id){document.getElementById(id).classList.add("open");document.body.style.overflow="hidden";document.getElementById(id).scrollTop=0;}
function closeDrillPage(id){document.getElementById(id).classList.remove("open");document.body.style.overflow="";}

function tick(){const n=new Date();setText("ct",String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0")+":"+String(n.getSeconds()).padStart(2,"0"));setText("cd",n.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"}));}
setInterval(tick,1000);tick();

/* ══════════ FORMATTERS ══════════ */
function fmt(n){return Math.round(n||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");}
function fL(n){return((n||0)/1e5).toFixed(2);}
function fCrPlain(n){const neg=(n||0)<0,a=Math.abs(n||0);const s=a>=1e7?"₹"+(a/1e7).toFixed(2)+"Cr":a>=1e5?"₹"+(a/1e5).toFixed(2)+"L":a>=1e3?"₹"+(a/1e3).toFixed(1)+"K":"₹"+Math.round(a);return neg?"−"+s:s;}
function fCrStyled(n){const neg=(n||0)<0,a=Math.abs(n||0);const s=a>=1e7?"₹"+(a/1e7).toFixed(2)+"Cr":a>=1e5?"₹"+(a/1e5).toFixed(2)+"L":a>=1e3?"₹"+(a/1e3).toFixed(1)+"K":"₹"+Math.round(a);return neg?`<span style="color:var(--red)">−${s}</span>`:s;}
function pct(a,b){return b?(a/b*100).toFixed(1):"0";}
function setP(p){const el=getEl("pf");if(el)el.style.width=Math.min(p,100)+"%";}
function setSt(msg,ok,err){setText("stxt",msg);const d=getEl("dot");if(d)d.className="dot"+(ok?" ok":err?" err":"");}

/* ══════════ FY HELPERS ══════════ */
function getFY(ds){if(!ds||ds<"1900")return null;const y=+ds.slice(0,4),m=+ds.slice(5,7),s=m>=4?y:y-1;return"FY "+s+"-"+String(s+1).slice(2);}
function getFYRange(lbl){const m=lbl.match(/FY (\d{4})-/);if(!m)return null;const s=+m[1];return{from:s+"-04-01",to:(s+1)+"-03-31"};}
function getCurrentFY(){const n=new Date(),y=n.getFullYear(),m=n.getMonth()+1,s=m>=4?y:y-1;return{label:"FY "+s+"-"+String(s+1).slice(2),from:s+"-04-01",to:(s+1)+"-03-31"};}

/* ══════════ FY DROPDOWN AUTO-FILL DATES ══════════ */
function onFYChange(){
  const fyVal=(getEl("fYear")||{value:""}).value;
  const fFromEl=getEl("fFrom"),fToEl=getEl("fTo");
  const fromHint=getEl("fromDateHint"),toHint=getEl("toDateHint");
  if(fyVal){
    const r=getFYRange(fyVal);
    if(r){
      if(fFromEl){fFromEl.value=r.from;fFromEl.setAttribute("readonly","readonly");}
      if(fToEl){fToEl.value=r.to;fToEl.setAttribute("readonly","readonly");}
      if(fromHint)fromHint.textContent="(auto)";
      if(toHint)toHint.textContent="(auto)";
      _fyLocked=true;
    }
  }else{
    if(fFromEl){fFromEl.value="";fFromEl.removeAttribute("readonly");}
    if(fToEl){fToEl.value="";fToEl.removeAttribute("readonly");}
    if(fromHint)fromHint.textContent="";
    if(toHint)toHint.textContent="";
    _fyLocked=false;
  }
}

function onManualDateChange(){
  const fyEl=getEl("fYear");
  if(fyEl&&fyEl.value){fyEl.value="";_fyLocked=false;const fh=getEl("fromDateHint"),th=getEl("toDateHint");if(fh)fh.textContent="";if(th)th.textContent="";}
  const fFromEl=getEl("fFrom"),fToEl=getEl("fTo");
  if(fFromEl)fFromEl.removeAttribute("readonly");
  if(fToEl)fToEl.removeAttribute("readonly");
}

async function fetchAllPages(url,label,p1,p2){
  setSt("⏳ Loading "+label+"…");let all=[],next=url,page=1;
  while(next){
    setSt("⏳ "+label+" · page "+page+" ("+fmt(all.length)+" rows)…");setP(p1+Math.min(page*3,p2-p1));
    const r=await fetch(next,{headers:{"Authorization":"Basic "+encoded}});
    if(!r.ok){const t=await r.text();throw new Error(label+" → HTTP "+r.status+" → "+t.slice(0,200));}
    const j=await r.json();all=all.concat(j.value||[]);next=j["@odata.nextLink"]||null;page++;
  }
  setP(p2);return all;
}

/* ══════════════════════════════════════════════════════════
   ✅ FIX: rS now reads the normalized SalespersonCode field
   which is set from either SalespersonCode or Salesperson_Code
══════════════════════════════════════════════════════════ */
const rN=cno=>(custMap[cno]||{}).name||cno||"—";
const rS=cno=>(custMap[cno]||{}).salesperson||"—";

/* ══════════════════════════════════════════════════════════
   BUCKET CONFIGURATION — MATCHES BC AGED AR REPORT EXACTLY
══════════════════════════════════════════════════════════ */
const BKEYS  = ["b30","b60","b90","b180","b360","b360p"];
const BLBLS  = ["1–30D","31–60D","61–90D","91–180D","181–360D",">360D"];
const BCOLS  = ["#2ecc71","#3498db","#f4a261","#e63946","#c0392b","#641e16"];
const ADEFS  = [
  {lbl:"1–30 Days",    bk:"b30",   col:"#2ecc71", bi:0, st:"safe"},
  {lbl:"31–60 Days",   bk:"b60",   col:"#3498db", bi:1, st:"safe"},
  {lbl:"61–90 Days",   bk:"b90",   col:"#f4a261", bi:2, st:"watch"},
  {lbl:"91–180 Days",  bk:"b180",  col:"#e63946", bi:3, st:"critical"},
  {lbl:"181–360 Days", bk:"b360",  col:"#c0392b", bi:4, st:"critical"},
  {lbl:">360 Days",    bk:"b360p", col:"#641e16", bi:5, st:"critical"},
];

function getToDate(){
  const fToVal=(getEl("fTo")||{value:""}).value;
  if(fToVal){const d=new Date(fToVal);d.setHours(0,0,0,0);return d;}
  const n=new Date();n.setHours(0,0,0,0);return n;
}
function getTodayDate(){const n=new Date();n.setHours(0,0,0,0);return n;}
function getTodayString(){const n=getTodayDate();return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;}
function parseDateStr(ds){if(!ds||ds==="0001-01-01")return null;const d=new Date(ds);d.setHours(0,0,0,0);return d;}

function bucketIdx(postingDateStr, toDate) {
  if (!toDate) toDate = getToDate();
  const pd = parseDateStr(postingDateStr);
  if (!pd) return 0;
  const days = Math.floor((toDate - pd) / 86400000);
  if (days < 30)  return 0;
  if (days < 60)  return 1;
  if (days < 90)  return 2;
  if (days < 180) return 3;
  if (days < 360) return 4;
  return 5;
}

function daysSincePosting(postingDateStr, toDate){
  if(!toDate) toDate=getToDate();
  const pd=parseDateStr(postingDateStr);
  if(!pd)return 0;
  return Math.floor((toDate-pd)/86400000);
}

function getCustRisk(c){
  const pos=Math.max(0,c.b90)+Math.max(0,c.b180)+Math.max(0,c.b360)+Math.max(0,c.b360p);
  const totAbs=Math.max(0,c.total);
  if(totAbs===0)return 'low';
  const p90=pos/totAbs;
  if(p90>0.3||Math.max(0,c.b180)+Math.max(0,c.b360)+Math.max(0,c.b360p)>0)return 'high';
  if(p90>0.05||c.b90>0)return 'med';
  return 'low';
}
function getRiskTag(c){
  const r=getCustRisk(c);
  if(r==='high')return '<span class="risk-pill risk-red">&gt;90D</span>';
  if(r==='med') return '<span class="risk-pill risk-orange">61–90D</span>';
  return '<span class="risk-pill risk-green">Safe</span>';
}

/* ══════════ PAGINATION ══════════ */
function buildPg(pgId,pgiId,page,tp,totalRows,startRow,endRow,onPageClick){
  const pgEl=getEl(pgId),pgiEl=getEl(pgiId);if(!pgEl)return;pgEl.innerHTML="";
  if(tp<=1){if(pgiEl)pgiEl.textContent=totalRows>0?"Showing all "+fmt(totalRows)+" rows":"";return;}
  const add=(lbl,p,active,disabled)=>{const b=document.createElement("button");b.className="page-btn"+(active?" active":"")+(disabled?" disabled":"");b.textContent=lbl;b.disabled=disabled||active;if(!disabled&&!active)b.onclick=()=>onPageClick(p);pgEl.appendChild(b);};
  add("‹ Prev",page-1,false,page===1);
  if(page>3){add(1,1,false,false);if(page>4){const e=document.createElement("span");e.textContent="…";e.style.cssText="color:var(--text3);padding:0 4px;font-size:11px;";pgEl.appendChild(e);}}
  for(let i=Math.max(1,page-2);i<=Math.min(tp,page+2);i++)add(i,i,i===page,false);
  if(page<tp-2){if(page<tp-3){const e=document.createElement("span");e.textContent="…";e.style.cssText="color:var(--text3);padding:0 4px;font-size:11px;";pgEl.appendChild(e);}add(tp,tp,false,false);}
  add("Next ›",page+1,false,page>=tp);
  if(pgiEl)pgiEl.textContent=`Showing ${fmt(startRow)}–${fmt(endRow)} of ${fmt(totalRows)} rows · Page ${page} of ${tp}`;
}

/* ══════════════════════════════════════════════════════════
   ✅ FIX: populateDropdowns now dynamically reads CustomerType
   values from the actual API data instead of hardcoded options.
   Also reads SalespersonCode (normalized field) for all dropdowns.
══════════════════════════════════════════════════════════ */
function populateDropdowns(data){
  const states=[...new Set(data.map(e=>(e.StateDes||"").trim()).filter(Boolean))].sort();
  const grps=[...new Set(data.map(e=>e.Customer_Posting_Group||"").filter(Boolean))].sort();
  /* ✅ Use normalized SalespersonCode (already set from Salesperson_Code in bootstrap) */
  const sals=[...new Set(data.map(e=>(e.SalespersonCode||"").trim()).filter(Boolean))].sort();
  const fySet=new Set();data.forEach(e=>{const f=getFY(e.PostingDate);if(f)fySet.add(f);});
  const fys=[...fySet].sort((a,b)=>b.localeCompare(a));
  /* ✅ Dynamic CustomerType from API */
  const custTypes=[...new Set(data.map(e=>(e.CustomerType||"").trim()).filter(Boolean))].sort();

  const sel=(id,opts,pfx)=>{const el=getEl(id);if(!el)return;el.innerHTML=pfx+opts.map(v=>`<option value="${v}">${v}</option>`).join("");};
  sel("fState",states,'<option value="">All States</option>');
  sel("fSales",sals,'<option value="">All</option>');
  sel("fGroup",grps,'<option value="">All Groups</option>');
  sel("fYear",[...fys],'<option value="">All Financial Years</option>');
  /* ✅ Populate CustomerType dropdown from real API values */
  sel("fCustType",custTypes,'<option value="">All Types</option>');
  ["t5State","aState","mktState"].forEach(id=>sel(id,states,'<option value="">All States</option>'));
  ["t5Mkt","aMkt","locMkt"].forEach(id=>sel(id,sals,'<option value="">All</option>'));
}

/* ══════════════════════════════════════════════════════════
   ACTIVE FILTER STATE
══════════════════════════════════════════════════════════ */
let _activeFilters = {
  fc:"", fs:"", fg:"", fct:"", fst:"",
  fYear:"", fFrom:"", fTo:"",
  salesFrom:"", salesTo:"",
  hasExplicitDateFilter: false
};

/* ══════════════════════════════════════════════════════════
   APPLY FILTERS
══════════════════════════════════════════════════════════ */
function applyFilters(){
  const fc=(getEl("fCust")||{value:""}).value.trim().toLowerCase();
  const fs=(getEl("fSales")||{value:""}).value;
  const fg=(getEl("fGroup")||{value:""}).value;
  const fct=(getEl("fCustType")||{value:""}).value;
  const fst=(getEl("fState")||{value:""}).value;
  const fYear=(getEl("fYear")||{value:""}).value;
  const fFrom=(getEl("fFrom")||{value:""}).value;
  const fTo=(getEl("fTo")||{value:""}).value;

  let from=fFrom, to=fTo;
  if(fYear&&(!from||!to)){const r=getFYRange(fYear);if(r){from=r.from;to=r.to;}}

  const hasExplicitDateFilter = !!(from || to);

  let salesFrom, salesTo;
  if(hasExplicitDateFilter){
    salesFrom = from;
    salesTo   = to;
  } else {
    const cfy = getCurrentFY();
    salesFrom = cfy.from;
    salesTo   = cfy.to;
  }

  _activeFilters = {fc,fs,fg,fct,fst,fYear,fFrom:from,fTo:to,salesFrom,salesTo,hasExplicitDateFilter};

  /* ✅ FIX: fct filter now matches API's actual CustomerType values (e.g. "Trade") */
  let d = allCLE;
  if(fc)  d=d.filter(e=>(e.CustomerNo||"").toLowerCase().includes(fc)||rN(e.CustomerNo).toLowerCase().includes(fc));
  if(fs)  d=d.filter(e=>(e.SalespersonCode||"").trim()===fs);
  if(fg)  d=d.filter(e=>(e.Customer_Posting_Group||"")===fg);
  if(fct) d=d.filter(e=>(e.CustomerType||"").trim()===fct);
  if(fst) d=d.filter(e=>(e.StateDes||"").trim()===fst);
  if(from)d=d.filter(e=>e.PostingDate>=from);
  if(to)  d=d.filter(e=>e.PostingDate<=to);
  filtCLE = d;

  let openBase = allCLE.filter(e=>e.Open===true);
  if(fc)  openBase=openBase.filter(e=>(e.CustomerNo||"").toLowerCase().includes(fc)||rN(e.CustomerNo).toLowerCase().includes(fc));
  if(fs)  openBase=openBase.filter(e=>(e.SalespersonCode||"").trim()===fs);
  if(fg)  openBase=openBase.filter(e=>(e.Customer_Posting_Group||"")===fg);
  if(fct) openBase=openBase.filter(e=>(e.CustomerType||"").trim()===fct);
  if(fst) openBase=openBase.filter(e=>(e.StateDes||"").trim()===fst);
  if(from)openBase=openBase.filter(e=>e.PostingDate>=from);
  if(to)  openBase=openBase.filter(e=>e.PostingDate<=to);
  openRows = openBase;

  const parts=[];
  if(fc)  parts.push("Cust:"+fc);
  if(fs)  parts.push("Sales:"+fs);
  if(fg)  parts.push("Grp:"+fg);
  if(fct) parts.push("Type:"+fct);
  if(fst) parts.push("State:"+fst);
  if(fYear)       parts.push("FY:"+fYear);
  else{ if(from) parts.push("From:"+from); if(to) parts.push("To:"+to); }

  const dateRangeLabel = from && to ? from+" → "+to : from ? "From "+from : to ? "Up to "+to : "No date filter";
  setText("finfo","Showing "+fmt(filtCLE.length)+" of "+fmt(allCLE.length)+" CLE records · "+fmt(openRows.length)+" open entries · Date Range: "+dateRangeLabel+(parts.length?" | Filters: "+parts.join(" · "):" | No extra filters"));

  buildNewRepeatLists(salesFrom, salesTo, fc, fs, fg, fct, fst);
  buildCustSum();
  t5Page=1;agePage=1;mktPage=1;locPage=1;ageOvPage=1;
  renderAll();
}

/* ══════════════════════════════════════════════════════════
   RESET FILTERS
══════════════════════════════════════════════════════════ */
function resetFilters(){
  ["fCust","fSales","fGroup","fCustType","fYear","fFrom","fTo","fState"].forEach(id=>{
    const el=getEl(id);
    if(el) el.value="";
  });
  const fFromEl=getEl("fFrom"),fToEl=getEl("fTo");
  if(fFromEl)fFromEl.removeAttribute("readonly");
  if(fToEl)fToEl.removeAttribute("readonly");
  const fh=getEl("fromDateHint"),th=getEl("toDateHint");
  if(fh)fh.textContent="";if(th)th.textContent="";
  _fyLocked=false;

  const cfy = getCurrentFY();
  _activeFilters = {
    fc:"", fs:"", fg:"", fct:"", fst:"",
    fYear:"", fFrom:"", fTo:"",
    salesFrom: cfy.from,
    salesTo:   cfy.to,
    hasExplicitDateFilter: false
  };

  filtCLE = allCLE;
  openRows = allCLE.filter(e=>e.Open===true);

  buildNewRepeatLists(cfy.from, cfy.to, "", "", "", "", "");
  buildCustSum();
  t5Page=1; agePage=1; mktPage=1; locPage=1; ageOvPage=1;
  renderAll();

  setText("finfo","No filters active · All open entries shown · Sales / New / Repeat Customers: "+cfy.label);
}

/* ══════════ NEW/REPEAT ══════════ */
function buildNewRepeatLists(fromDate, toDate, fcFilter, fsFilter, fgFilter, fctFilter, fstFilter){
  const hasExplicit = _activeFilters.hasExplicitDateFilter;
  const cfy = getCurrentFY();
  let subLabel;
  if(hasExplicit){
    if(_activeFilters.fYear) subLabel = _activeFilters.fYear;
    else subLabel = (fromDate||"start")+" → "+(toDate||"today");
  } else {
    subLabel = cfy.label;
  }

  const custData={};
  allCLE.forEach(e=>{
    const cno=(e.CustomerNo||"Unknown");
    if(fcFilter&&!(cno.toLowerCase().includes(fcFilter)||rN(cno).toLowerCase().includes(fcFilter)))return;
    if(fsFilter&&(e.SalespersonCode||"").trim()!==fsFilter)return;
    if(fgFilter&&(e.Customer_Posting_Group||"")!==fgFilter)return;
    if(fctFilter&&(e.CustomerType||"").trim()!==fctFilter)return;
    if(fstFilter&&(e.StateDes||"").trim()!==fstFilter)return;
    const dtype=(e.DocumentType||"").trim(),postDt=e.PostingDate?new Date(e.PostingDate):null;
    const sales=Number(e.Sales_LCY||0),profit=Number(e.Profit_LCY||0),rem=e.Open===true?Number(e.Remaining_Amt_LCY||0):0;
    if(!custData[cno])custData[cno]={no:cno,name:rN(cno),invoiceCount:0,years:new Set(),dates:[],sales:0,profit:0,outstanding:0,postingGroup:(custMap[cno]||{}).postingGroup||e.Customer_Posting_Group||"",stateDes:(e.StateDes||"").trim()};
    custData[cno].sales+=sales;custData[cno].profit+=profit;custData[cno].outstanding+=rem;
    if(dtype==="Invoice"&&postDt){
      const pd=e.PostingDate;
      const inRange=(!fromDate||pd>=fromDate)&&(!toDate||pd<=toDate);
      if(inRange){custData[cno].invoiceCount++;custData[cno].years.add(postDt.getFullYear());custData[cno].dates.push(postDt);}
    }
  });
  newCustList=[];repeatCustList=[];
  Object.values(custData).forEach(c=>{
    if(c.invoiceCount===0)return;
    const sd=c.dates.sort((a,b)=>a-b);
    const row={...c,allYears:[...c.years].sort(),firstInvoice:sd[0]?sd[0].toISOString().slice(0,10):"—",lastInvoice:sd[sd.length-1]?sd[sd.length-1].toISOString().slice(0,10):"—",yearsStr:[...c.years].sort().join(", ")};
    if(c.invoiceCount===1)newCustList.push(row);
    if(c.invoiceCount>=2)repeatCustList.push(row);
  });
  newCustList.sort((a,b)=>b.sales-a.sales);repeatCustList.sort((a,b)=>b.sales-a.sales);
  setText("kNewCust",fmt(newCustList.length));
  setText("kRepeatCust",fmt(repeatCustList.length));
  setText("kNewCustSub","1 invoice · "+subLabel);
  setText("kRepeatCustSub","2+ invoices · "+subLabel);
}

function openNewRepeatModal(type){
  const isNew=type==="new";nrModalRows=isNew?newCustList:repeatCustList;nrFilteredRows=nrModalRows;nrPage=1;nrPS=25;
  setText("nrModalTitle",isNew?"🆕 New Customers (Single Invoice)":"🔄 Repeat Customers (2+ Invoices)");
  const ts=nrModalRows.reduce((s,c)=>s+c.sales,0),tp2=nrModalRows.reduce((s,c)=>s+c.profit,0),ta=nrModalRows.reduce((s,c)=>s+c.outstanding,0);
  setHTML("nrModalKpis",`<div class="mk"><div class="mk-label">Customers</div><div class="mk-value" style="color:var(--accent2)">${fmt(nrModalRows.length)}</div></div><div class="mk"><div class="mk-label">Total Sales</div><div class="mk-value" style="color:var(--green)">${fCrPlain(ts)}</div></div><div class="mk"><div class="mk-label">Total Profit</div><div class="mk-value" style="color:var(--teal)">${fCrPlain(tp2)}</div></div><div class="mk"><div class="mk-label">Outstanding</div><div class="mk-value" style="color:var(--amber)">${fCrPlain(ta)}</div></div>`);
  const nrSrch=getEl("nrSearch");if(nrSrch)nrSrch.value="";const nrPSel=getEl("nrPageSize");if(nrPSel)nrPSel.value="25";
  renderNRPaged();const modal=getEl("newRepeatModal");if(modal)modal.classList.add("open");document.body.style.overflow="hidden";
}
function closeNewRepeatModal(){const modal=getEl("newRepeatModal");if(modal)modal.classList.remove("open");document.body.style.overflow="";}
const nrModalEl=getEl("newRepeatModal");if(nrModalEl)nrModalEl.addEventListener("click",function(e){if(e.target===this)closeNewRepeatModal();});
function filterNRTable(){const q=(getEl("nrSearch")||{value:""}).value.trim().toLowerCase();nrFilteredRows=q?nrModalRows.filter(c=>c.name.toLowerCase().includes(q)||c.no.toLowerCase().includes(q)):nrModalRows;nrPage=1;renderNRPaged();}
function renderNRPaged(){
  const rows=nrFilteredRows,tp=Math.max(1,Math.ceil(rows.length/nrPS));if(nrPage>tp)nrPage=1;
  const start=(nrPage-1)*nrPS,end=Math.min(nrPage*nrPS,rows.length);
  const m=r=>r.sales>0?(r.profit/r.sales*100).toFixed(1):"0.0";
  setHTML("nrBody",rows.slice(start,end).length?rows.slice(start,end).map((c,i)=>`<tr>
    <td style="color:var(--text3);font-size:10px;">${start+i+1}</td>
    <td style="font-family:'JetBrains Mono';font-size:10px;color:var(--text3);">${c.no}</td>
    <td>${c.name}</td>
    <td style="color:var(--text3);font-size:10px;">${c.postingGroup||"—"}</td>
    <td style="color:var(--text3);font-size:10px;">${c.stateDes||"—"}</td>
    <td style="color:var(--cyan);">${fCrStyled(c.sales)}</td>
    <td style="color:var(--green);font-weight:600;">${fCrStyled(c.profit)}</td>
    <td style="color:${+m(c)>=20?"var(--green)":+m(c)>=10?"var(--amber)":"var(--orange)"};">${m(c)}%</td>
    <td style="color:var(--amber);">${fCrStyled(c.outstanding)}</td>
    <td style="color:var(--cyan);font-weight:700;">${c.invoiceCount}</td>
    <td style="font-size:10px;color:var(--text2);">${c.yearsStr}</td>
    <td style="font-size:10px;color:var(--text3);">${c.firstInvoice}</td>
    <td style="font-size:10px;color:var(--text3);">${c.lastInvoice}</td>
  </tr>`).join(""):`<tr><td colspan="13" class="empty">No customers found</td></tr>`);
  setText("nrCount",fmt(rows.length)+" customer"+(rows.length!==1?"s":"")+" · page "+nrPage+" of "+tp);
  buildPg("nrPg","nrPgi",nrPage,tp,rows.length,start+1,end,(p)=>{nrPage=p;renderNRPaged();});
}

/* ══════════ BUILD CUSTOMER SUMMARY ══════════ */
function buildCustSum(){
  const toDate=getToDate();
  const m={};
  openRows.forEach(e=>{
    const cno=e.CustomerNo||"?",rem=Number(e.Remaining_Amt_LCY||0),stateDes=(e.StateDes||"").trim()||"—";
    /* ✅ Use normalized SalespersonCode */
    const sp=(e.SalespersonCode||"").trim()||rS(cno)||"—";
    if(!m[cno])m[cno]={no:cno,name:rN(cno),state:stateDes,salesperson:sp,total:0,...Object.fromEntries(BKEYS.map(b=>[b,0])),entryCount:0,maxDays:0};
    const bi=bucketIdx(e.PostingDate,toDate);
    m[cno].total+=rem;
    m[cno][BKEYS[bi]]+=rem;
    m[cno].entryCount++;
    const dd=daysSincePosting(e.PostingDate,toDate);
    if(dd>m[cno].maxDays)m[cno].maxDays=dd;
  });
  custSum=Object.values(m).sort((a,b)=>b.total-a.total);
}

function renderAll(){updKPIs();renderOverview();renderTop50();renderAgeing();renderMkt();renderLoc();syncDropdowns();}

/* ══════════ KPIs ══════════ */
function updKPIs(){
  const toDate=getToDate();
  const today=getTodayDate();

  const tot   = openRows.reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0);
  const a90   = openRows.filter(e=>bucketIdx(e.PostingDate,toDate)>=2).reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0);
  const w6190 = openRows.filter(e=>bucketIdx(e.PostingDate,toDate)===2).reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0);
  const b61   = openRows.filter(e=>bucketIdx(e.PostingDate,toDate)<=1).reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0);
  const a180  = openRows.filter(e=>bucketIdx(e.PostingDate,toDate)>=4).reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0);

  const totalCusts = Object.keys(custMap).length || custSum.length;

  const salesFrom = _activeFilters.salesFrom;
  const salesTo   = _activeFilters.salesTo;
  const hasExplicit = _activeFilters.hasExplicitDateFilter;
  const cfy = getCurrentFY();

  let salesLabel;
  if(hasExplicit){
    if(_activeFilters.fYear) salesLabel = "("+_activeFilters.fYear+")";
    else salesLabel = "(Filtered Range)";
  } else {
    salesLabel = "("+cfy.label+")";
  }
  setText("salesFYLabel", salesLabel);

  const {fc,fs,fg,fct,fst} = _activeFilters;
  let salesRows = allCLE.filter(e=>e.Open===true);
  if(fc)       salesRows = salesRows.filter(e=>(e.CustomerNo||"").toLowerCase().includes(fc)||rN(e.CustomerNo).toLowerCase().includes(fc));
  if(fs)       salesRows = salesRows.filter(e=>(e.SalespersonCode||"").trim()===fs);
  if(fg)       salesRows = salesRows.filter(e=>(e.Customer_Posting_Group||"")===fg);
  if(fct)      salesRows = salesRows.filter(e=>(e.CustomerType||"").trim()===fct);
  if(fst)      salesRows = salesRows.filter(e=>(e.StateDes||"").trim()===fst);
  if(salesFrom)salesRows = salesRows.filter(e=>e.PostingDate && e.PostingDate>=salesFrom);
  if(salesTo)  salesRows = salesRows.filter(e=>e.PostingDate && e.PostingDate<=salesTo);
  const filteredSales = salesRows.reduce((s,e)=>s+Number(e.Sales_LCY||0),0);
  setText("kTotalSales", fCrPlain(filteredSales));

  buildSalesYoYData();
  setText("kTotalCust",fmt(totalCusts));

  let allAR=0,allOverdue=0;
  allCLE.forEach(e=>{
    if(e.Open===true){
      allAR+=Number(e.Remaining_Amt_LCY||0);
      const dueDt=e.DueDate&&e.DueDate!=="0001-01-01"?new Date(e.DueDate):null;
      if(dueDt&&dueDt<today)allOverdue+=Number(e.Remaining_Amt_LCY||0);
    }
  });
  setText("kTotalAR",fCrPlain(Math.abs(allAR)));
  setText("kTotalOverdue",fCrPlain(Math.abs(allOverdue)));

  const dateRangeStr = hasExplicit
    ? (_activeFilters.fYear || ((salesFrom||"")+" → "+(salesTo||"")))
    : "All dates";

  setText("k0",fCrPlain(tot));
  setText("k0s",custSum.length+" customers · "+fmt(openRows.length)+" open · "+dateRangeStr);
  setText("k1",fCrPlain(a90));  setText("k1s",pct(a90,tot)+"% of Total O/S");
  setText("k2",fCrPlain(w6190));setText("k2s",pct(w6190,tot)+"% of Total O/S");
  setText("k3",fCrPlain(b61));  setText("k3s",pct(b61,tot)+"% of Total O/S");
  setText("k4",fCrPlain(a180));

  const adiv=getEl("alertDiv");
  if(adiv){
    if(custSum.length>0){
      adiv.style.display="flex";
      const t2=custSum.slice(0,2).reduce((s,c)=>s+c.total,0);
      setHTML("alertTxt",`<b>Management Alert:</b> Total O/S <b>${fCrPlain(tot)}</b> as on ${toDate.toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}${hasExplicit?" ("+dateRangeStr+")":""}. <b style="color:var(--red)">${fCrPlain(a90)} (${pct(a90,tot)}%)</b> overdue beyond 90 days. Top 2 customers account for <b style="color:var(--orange)">${pct(t2,tot)}%</b> of total outstanding.`);
    }else adiv.style.display="none";
  }

  const ts2=openRows.reduce((s,e)=>s+Number(e.Sales_LCY||0),0);
  const dso=ts2>0?Math.round((tot/ts2)*365):0;
  const top10c=custSum.slice(0,10).reduce((s,c)=>s+c.total,0);
  const stateArr=getStateArr(),mktArr=getMktArr();
  const topM=mktArr[0]||{name:"—",total:0},topL=stateArr[0]||{name:"—",total:0};
  const actC=custSum.filter(c=>c.b180+c.b360+c.b360p>0).length;
  setText("iDSO",dso+" Days");setHTML("iDSOd",`SUM(Remaining)/SUM(Sales)×365. <b>${dso>75?"⚠ Exceeds 75d benchmark":"✓ Within range"}</b>`);
  setText("iConc",pct(top10c,tot)+"%");setHTML("iConcd",`Top 10 customers hold <b>${fCrPlain(top10c)}</b> of <b>${fCrPlain(tot)}</b> total O/S.`);
  setText("iWO",fCrPlain(a180));setHTML("iWOd",`<b>${custSum.filter(c=>c.b360+c.b360p>0).length} customers</b> with &gt;180 days. Recommend legal notice.`);
  setText("iGeo",pct(topL.total,tot)+"% "+topL.name);setHTML("iGeod",`<b>${topL.name}</b> accounts for <b>${pct(topL.total,tot)}%</b> of O/S.`);
  setText("iMkt",topM.name);setHTML("iMktd",`<b>${topM.name}</b> holds <b>${fCrPlain(topM.total)}</b> (${pct(topM.total,tot)}%). Key-man risk.`);
  setText("iAct",actC+" Customers");setHTML("iActd",`<b>${actC} customers</b> with &gt;180d overdue. Send formal demand letters immediately.`);
}

/* ══════════ SALES POPUP ══════════ */
function buildSalesYoYData(){
  salesYoYData={};
  allCLE.forEach(e=>{
    if(e.Open!==true)return;
    const fy=getFY(e.PostingDate);if(!fy)return;
    if(!salesYoYData[fy])salesYoYData[fy]=0;
    salesYoYData[fy]+=Number(e.Sales_LCY||0);
  });
}
function toggleSalesPopup(e){e.stopPropagation();if(salesPopupOpen){closeSalesPopup();}else{openSalesPopup();}}
function openSalesPopup(){
  const popup=getEl("salesPopup"),wrap=getEl("salesKpiWrap");if(!popup||!wrap)return;
  const rect=wrap.getBoundingClientRect();
  popup.style.left=Math.max(4,rect.left)+"px";popup.style.top=(rect.bottom+6)+"px";popup.style.display="block";
  const pw=popup.offsetWidth,maxLeft=window.innerWidth-pw-8;if(rect.left>maxLeft)popup.style.left=maxLeft+"px";
  if(salesYoYChartInst){salesYoYChartInst.destroy();salesYoYChartInst=null;}
  const labels=Object.keys(salesYoYData).sort(),values=labels.map(fy=>salesYoYData[fy]),cfy=getCurrentFY().label;
  const ctx=getEl("salesYoYChart");
  if(ctx&&labels.length>0){
    salesYoYChartInst=new Chart(ctx,{type:"bar",data:{labels,datasets:[{data:values.map(v=>(v/1e5).toFixed(2)),backgroundColor:labels.map(l=>l===cfy?"rgba(0,212,232,0.85)":"rgba(45,125,210,0.55)"),borderColor:labels.map(l=>l===cfy?"#00d4e8":"rgba(61,155,233,0.8)"),borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:ctx=>ctx[0].label,label:ctx=>`Sales: ₹${Number(ctx.parsed.y).toFixed(2)}L`},titleColor:'#e8f0fc',bodyColor:'#00d4e8',backgroundColor:'rgba(10,22,40,0.97)',borderColor:'#1f3554',borderWidth:1,padding:10}},scales:{x:{ticks:{color:"#8fa9cc",font:{size:8}},grid:{display:false}},y:{ticks:{color:"#8fa9cc",font:{size:8},callback:v=>"₹"+v+"L"},grid:{color:"rgba(31,53,84,.6)"}}}}});
  }
  if(labels.length>=2){
    const cfyVal=salesYoYData[cfy]||0,prevFY=labels[labels.indexOf(cfy)-1],prevVal=prevFY?salesYoYData[prevFY]:0;
    const chg=prevVal?((cfyVal-prevVal)/Math.abs(prevVal)*100).toFixed(1):null;
    const arrow=chg!==null?(+chg>=0?"▲":"▼"):"",color=chg!==null?(+chg>=0?"var(--green)":"var(--red)"):"var(--text3)";
    setHTML("salesYoYRow",`<span style="color:var(--text3);">${cfy}: <b style="color:var(--cyan);">${fCrPlain(cfyVal)}</b></span>${chg!==null?`<span style="color:${color};font-weight:700;">${arrow} ${Math.abs(+chg)}% vs ${prevFY}</span>`:""}`);
  }else{setHTML("salesYoYRow",`<span style="color:var(--text3);">Only 1 FY of data available</span>`);}
  popup.classList.add("visible");wrap.classList.add("popup-open");salesPopupOpen=true;
}
function closeSalesPopup(){
  const popup=getEl("salesPopup"),wrap=getEl("salesKpiWrap");
  if(popup){popup.classList.remove("visible");popup.style.display="none";}
  if(wrap)wrap.classList.remove("popup-open");salesPopupOpen=false;
}
document.addEventListener("click",function(e){
  if(salesPopupOpen){const popup=getEl("salesPopup"),wrap=getEl("salesKpiWrap");if(popup&&!popup.contains(e.target)&&wrap&&!wrap.contains(e.target)){closeSalesPopup();}}
});

/* ══════════ DONUT DRILL ══════════ */
function openDonutDrill(bucketIndex){
  const def=ADEFS[bucketIndex];
  const toDate=getToDate();
  donutDrillAllRows=openRows.filter(e=>bucketIdx(e.PostingDate,toDate)===bucketIndex).sort((a,b)=>new Date(a.PostingDate||"1900")-new Date(b.PostingDate||"1900"));
  donutDrillFilteredRows=donutDrillAllRows;donutDrillPage=1;donutDrillPageSize=25;
  const totalRem=donutDrillAllRows.reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0);
  const totalAmt=donutDrillAllRows.reduce((s,e)=>s+Number(e.Amount_LCY||0),0);
  const custSet=new Set(donutDrillAllRows.map(e=>e.CustomerNo));
  const grandTotal=openRows.reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0);
  const head=getEl("donutDrillHead");if(head)head.style.borderLeftColor=def.col;
  setText("donutDrillTitle",`${def.lbl} — Ageing Bucket Detail`);
  setText("donutDrillSubtitle",`${fmt(donutDrillAllRows.length)} open entries · ${fmt(custSet.size)} customers · Net remaining: ${fCrPlain(totalRem)}`);
  setHTML("donutDrillKpis",`
    <div class="mk"><div class="mk-label">Bucket</div><div class="mk-value" style="color:${def.col};font-size:12px;">${def.lbl}</div></div>
    <div class="mk"><div class="mk-label">Net Remaining</div><div class="mk-value" style="${totalRem<0?"color:var(--red)":"color:var(--orange)"};">${fCrPlain(totalRem)}</div></div>
    <div class="mk"><div class="mk-label">Total Invoiced</div><div class="mk-value" style="color:var(--cyan);">${fCrPlain(totalAmt)}</div></div>
    <div class="mk"><div class="mk-label">Open Entries</div><div class="mk-value" style="color:var(--accent2);">${fmt(donutDrillAllRows.length)}</div></div>
    <div class="mk"><div class="mk-label">Customers</div><div class="mk-value" style="color:var(--lime);">${fmt(custSet.size)}</div></div>
    <div class="mk"><div class="mk-label">% of Total O/S</div><div class="mk-value" style="color:var(--gold);">${pct(totalRem,grandTotal)}%</div></div>
  `);
  const srch=getEl("donutDrillSrch");if(srch)srch.value="";const ps=getEl("donutDrillPS");if(ps)ps.value="25";
  renderDonutDrillPaged();const modal=getEl("donutDrillModal");if(modal)modal.classList.add("open");document.body.style.overflow="hidden";
}
function closeDonutDrill(){const modal=getEl("donutDrillModal");if(modal)modal.classList.remove("open");document.body.style.overflow="";}
function filterDonutDrill(){
  const q=(getEl("donutDrillSrch")||{value:""}).value.trim().toLowerCase();
  donutDrillFilteredRows=q?donutDrillAllRows.filter(e=>rN(e.CustomerNo).toLowerCase().includes(q)||(e.CustomerNo||"").toLowerCase().includes(q)||(e.DocumentNo||"").toLowerCase().includes(q)):donutDrillAllRows;
  donutDrillPage=1;renderDonutDrillPaged();
}
function renderDonutDrillPaged(){
  const rows=donutDrillFilteredRows,tp=Math.max(1,Math.ceil(rows.length/donutDrillPageSize));
  if(donutDrillPage>tp)donutDrillPage=1;
  const start=(donutDrillPage-1)*donutDrillPageSize,end=Math.min(donutDrillPage*donutDrillPageSize,rows.length);
  const toDate=getToDate();
  setText("donutDrillCnt",fmt(rows.length)+" entries · page "+donutDrillPage+" of "+tp);
  setHTML("donutDrillBody",rows.slice(start,end).map((e,i)=>{
    const dd=daysSincePosting(e.PostingDate,toDate),bi=bucketIdx(e.PostingDate,toDate),rem=Number(e.Remaining_Amt_LCY||0),amt=Number(e.Amount_LCY||0);
    const sp=(e.SalespersonCode||"").trim()||rS(e.CustomerNo)||"—";
    return `<tr onclick="closeDonutDrill();openModal('${(e.CustomerNo||'').replace(/'/g,"\\'")}');" style="cursor:pointer;">
      <td style="font-family:'JetBrains Mono';font-size:10px;color:var(--text3);">${start+i+1}</td>
      <td style="font-family:'JetBrains Mono';font-size:10px;color:var(--text3);">${e.CustomerNo||"—"}</td>
      <td style="font-size:11px;">${rN(e.CustomerNo)}</td>
      <td style="font-size:10px;color:var(--text3);">${(e.StateDes||"").trim()||"—"}</td>
      <td style="font-size:10px;color:var(--text3);">${sp}</td>
      <td style="font-size:10px;">${e.PostingDate||"—"}</td>
      <td style="font-size:10px;">${e.DueDate||"—"}</td>
      <td style="font-family:'JetBrains Mono';font-size:10px;">${e.DocumentNo||""}</td>
      <td style="font-size:10px;color:var(--text3);">${(e.DocumentType||"").trim()||"—"}</td>
      <td style="font-family:'JetBrains Mono';${amt<0?"color:var(--red);":""}">${fCrPlain(amt)}</td>
      <td style="font-family:'JetBrains Mono';font-weight:700;${rem<0?"color:var(--red);":"color:var(--orange);"}">${fCrPlain(rem)}</td>
      <td style="${dd>360?"color:var(--red);font-weight:700;":dd>180?"color:var(--orange);":""};font-family:'JetBrains Mono';">${dd}d</td>
      <td><button class="drill-btn" onclick="event.stopPropagation();closeDonutDrill();openModal('${(e.CustomerNo||'').replace(/'/g,"\\'")}');">Detail</button></td>
    </tr>`;
  }).join("")||'<tr><td colspan="13" class="empty">No entries found</td></tr>');
  buildPg("donutDrillPg","donutDrillPgi",donutDrillPage,tp,rows.length,start+1,end,(p)=>{donutDrillPage=p;renderDonutDrillPaged();});
}
const donutModalEl=getEl("donutDrillModal");if(donutModalEl)donutModalEl.addEventListener("click",function(e){if(e.target===this)closeDonutDrill();});

/* ══════════ AGEING OV DRILL ══════════ */
function drillAgeOv(bk,lbl){
  const toDate=getToDate();
  const bkIdx=BKEYS.indexOf(bk);
  ageOvDrillRows=openRows.filter(e=>bucketIdx(e.PostingDate,toDate)===bkIdx).sort((a,b)=>new Date(a.PostingDate||"1900")-new Date(b.PostingDate||"1900"));
  ageOvPage=1;
  const tot=ageOvDrillRows.reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0);
  setText("ageOvDrillPageTitle",`${lbl} — All Open Entries`);
  setText("ageOvDrillPageSub",`${fmt(ageOvDrillRows.length)} entries · Net Remaining: ${fCrPlain(tot)}`);
  renderAgeOvDrill();openDrillPage("ageOvDrillPage");
}
function renderAgeOvDrill(){
  const rows=ageOvDrillRows,tp=Math.max(1,Math.ceil(rows.length/ageOvPageSize));
  if(ageOvPage>tp)ageOvPage=1;
  const start=(ageOvPage-1)*ageOvPageSize,end=Math.min(ageOvPage*ageOvPageSize,rows.length);
  const toDate=getToDate();
  setHTML("ageOvDrillBody",rows.slice(start,end).map((e,i)=>{
    const dd=daysSincePosting(e.PostingDate,toDate),bi=bucketIdx(e.PostingDate,toDate),rem=Number(e.Remaining_Amt_LCY||0),amt=Number(e.Amount_LCY||0);
    const sp=(e.SalespersonCode||"").trim()||rS(e.CustomerNo)||"—";
    return `<tr onclick="closeDrillPage('ageOvDrillPage');openModal('${(e.CustomerNo||'').replace(/'/g,"\\'")}');" style="cursor:pointer;">
      <td style="font-family:'JetBrains Mono';font-size:10px;color:var(--text3);">${start+i+1}</td>
      <td style="font-family:'JetBrains Mono';font-size:10px;color:var(--text3);">${e.CustomerNo||"—"}</td>
      <td style="font-size:11px;">${rN(e.CustomerNo)}</td>
      <td style="font-size:10px;color:var(--text3);">${(e.StateDes||"").trim()||"—"}</td>
      <td style="font-size:10px;color:var(--text3);">${sp}</td>
      <td style="font-size:10px;">${e.PostingDate||"—"}</td>
      <td style="font-size:10px;">${e.DueDate||"—"}</td>
      <td style="font-family:'JetBrains Mono';font-size:10px;">${e.DocumentNo||""}</td>
      <td style="font-size:10px;color:var(--text3);">${(e.DocumentType||"").trim()||"—"}</td>
      <td style="font-family:'JetBrains Mono';${amt<0?"color:var(--red);":""}">${fCrPlain(amt)}</td>
      <td style="font-family:'JetBrains Mono';font-weight:700;${rem<0?"color:var(--red);":"color:var(--orange);"}">${fCrPlain(rem)}</td>
      <td style="${dd>360?"color:var(--red);font-weight:700;":dd>180?"color:var(--orange);":""};font-family:'JetBrains Mono';">${dd}d</td>
      <td><span style="color:${BCOLS[bi]};font-size:10px;font-weight:700;">${BLBLS[bi]}</span></td>
    </tr>`;
  }).join("")||'<tr><td colspan="13" class="empty">No entries</td></tr>');
  buildPg("ageOvDrillPg","ageOvDrillPgi",ageOvPage,tp,rows.length,start+1,end,(p)=>{ageOvPage=p;renderAgeOvDrill();});
}

/* ══════════ CHARTS ══════════ */
Chart.defaults.color='#8fa9cc';
function dc(id){if(CH[id]){CH[id].destroy();delete CH[id];}}

function renderOverview(){
  const toDate=getToDate();
  const bTots=BKEYS.map((_,i)=>openRows.filter(e=>bucketIdx(e.PostingDate,toDate)===i).reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0));
  const netTot=bTots.reduce((s,v)=>s+v,0);
  dc("cDonut");
  const donutEl=getEl("cDonut");
  if(donutEl){
    CH.cDonut=new Chart(donutEl,{type:"doughnut",
      data:{labels:BLBLS,datasets:[{data:bTots.map(v=>Math.max(0,v)/1e5),backgroundColor:BCOLS,borderWidth:2,borderColor:'#0a1628',hoverOffset:6}]},
      options:{cutout:"65%",responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:ctx=>{const sv=bTots[ctx.dataIndex];const pp=netTot?(sv/netTot*100).toFixed(1):0;return` ₹${(sv/1e5).toFixed(2)}L (${pp}%)`;}},titleColor:'#e8f0fc',bodyColor:'#e8f0fc',backgroundColor:'rgba(10,22,40,0.95)',borderColor:'#1f3554',borderWidth:1}
        },
        onClick:(evt,elements)=>{if(elements&&elements.length>0)openDonutDrill(elements[0].index);}
      }
    });
  }
  setHTML("donutLeg",BLBLS.map((l,i)=>{
    const sv=bTots[i],pp=netTot?(sv/netTot*100).toFixed(1):0,isNeg=sv<0;
    return `<div onclick="drillAgeOv('${BKEYS[i]}','${ADEFS[i].lbl}')" style="display:flex;align-items:center;gap:7px;margin-bottom:6px;cursor:pointer;padding:3px 5px;border-radius:4px;transition:background 0.15s;" onmouseover="this.style.background='rgba(45,125,210,0.1)'" onmouseout="this.style.background=''">
      <div style="width:10px;height:10px;border-radius:2px;background:${BCOLS[i]};flex-shrink:0;"></div>
      <span style="flex:1;font-size:10px;color:var(--text2);">${l}</span>
      <span style="font-family:'JetBrains Mono';font-size:10px;color:${isNeg?"var(--red)":"var(--text)"};">${isNeg?"−":""}₹${(Math.abs(sv)/1e5).toFixed(2)}L</span>
      <span style="font-size:9px;color:var(--text3);width:36px;text-align:right;">${pp}%</span>
      <span style="font-size:9px;color:var(--accent2);">↗</span></div>`;
  }).join(""));
  const mkt=getMktArr().slice(0,10);
  dc("cMkt");const cMktEl=getEl("cMkt");
  if(cMktEl)CH.cMkt=new Chart(cMktEl,{type:"bar",data:{labels:mkt.map(m=>m.name),datasets:[{data:mkt.map(m=>Math.max(0,m.total)/1e5),backgroundColor:mkt.map((_,i)=>`hsl(${195+i*12},68%,${55-i*2}%)`),borderWidth:0,borderRadius:4}]},options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ₹${(mkt[ctx.dataIndex].total/1e5).toFixed(2)}L`},titleColor:'#e8f0fc',bodyColor:'#e8f0fc',backgroundColor:'rgba(10,22,40,0.95)',borderColor:'#1f3554',borderWidth:1}},scales:{x:{ticks:{color:"#8fa9cc",font:{size:9}},grid:{color:"rgba(31,53,84,.7)"}},y:{ticks:{color:"#e8f0fc",font:{size:10}},grid:{display:false}}}}});
  const states=getStateArr().slice(0,10);
  dc("cLoc");const cLocEl=getEl("cLoc");
  if(cLocEl)CH.cLoc=new Chart(cLocEl,{type:"bar",data:{labels:states.map(l=>l.name),datasets:[{data:states.map(l=>Math.max(0,l.total)/1e5),backgroundColor:states.map((_,i)=>`hsl(${270+i*15},65%,${60-i*2}%)`),borderWidth:0,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ₹${(states[ctx.dataIndex].total/1e5).toFixed(2)}L`},titleColor:'#e8f0fc',bodyColor:'#e8f0fc',backgroundColor:'rgba(10,22,40,0.95)',borderColor:'#1f3554',borderWidth:1}},scales:{x:{ticks:{color:"#e8f0fc",font:{size:9}},grid:{display:false}},y:{ticks:{color:"#8fa9cc",font:{size:9},callback:v=>"₹"+v+"L"},grid:{color:"rgba(31,53,84,.7)"},min:0}}}});
  const top10=custSum.slice(0,10);
  dc("cCust");const cCustEl=getEl("cCust");
  if(cCustEl)CH.cCust=new Chart(cCustEl,{type:"bar",data:{labels:top10.map(c=>c.name.slice(0,22)),datasets:[{data:top10.map(c=>Math.max(0,c.total)/1e5),backgroundColor:top10.map(c=>{if(c.total<=0)return"rgba(90,138,176,.5)";const p90=(Math.max(0,c.b90)+Math.max(0,c.b180)+Math.max(0,c.b360)+Math.max(0,c.b360p))/Math.max(1,c.total);return p90>0.3?"rgba(230,57,70,.8)":p90>0.1?"rgba(244,162,97,.8)":"rgba(46,204,113,.8)";}),borderWidth:0,borderRadius:4}]},options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ₹${(top10[ctx.dataIndex].total/1e5).toFixed(2)}L`},titleColor:'#e8f0fc',bodyColor:'#e8f0fc',backgroundColor:'rgba(10,22,40,0.95)',borderColor:'#1f3554',borderWidth:1}},scales:{x:{ticks:{color:"#8fa9cc",font:{size:9},callback:v=>"₹"+v+"L"},grid:{color:"rgba(31,53,84,.7)"}},y:{ticks:{color:"#e8f0fc",font:{size:10}},grid:{display:false}}}}});
}

/* ══════════ AGGREGATION ══════════ */
function getMktArr(stateFilter,riskFilter){
  const toDate=getToDate();
  const m={};let rows=openRows;
  if(stateFilter)rows=rows.filter(e=>(e.StateDes||"").trim()===stateFilter);
  rows.forEach(e=>{
    const rem=Number(e.Remaining_Amt_LCY||0);
    /* ✅ Use normalized SalespersonCode */
    const k=(e.SalespersonCode||"").trim()||rS(e.CustomerNo)||"—";
    if(!m[k])m[k]={name:k,total:0,...Object.fromEntries(BKEYS.map(b=>[b,0]))};
    m[k].total+=rem;m[k][BKEYS[bucketIdx(e.PostingDate,toDate)]]+=rem;
  });
  let arr=Object.values(m).sort((a,b)=>b.total-a.total);
  if(riskFilter){arr=arr.filter(m=>{
    const pos=Math.max(0,m.b90)+Math.max(0,m.b180)+Math.max(0,m.b360)+Math.max(0,m.b360p);
    const t=Math.max(1,m.total);const p90=pos/t;
    if(riskFilter==='high')return p90>0.3||Math.max(0,m.b180)+Math.max(0,m.b360)+Math.max(0,m.b360p)>0;
    if(riskFilter==='med')return p90>0.05&&!(p90>0.3);
    if(riskFilter==='low')return!(p90>0.05||m.b90>0);
    return true;
  });}
  return arr;
}
function getStateArr(mktFilter,riskFilter){
  const toDate=getToDate();
  const m={};let rows=openRows;
  if(mktFilter)rows=rows.filter(e=>(e.SalespersonCode||"").trim()===mktFilter);
  rows.forEach(e=>{
    const rem=Number(e.Remaining_Amt_LCY||0),k=(e.StateDes||"").trim()||"—";
    if(!m[k])m[k]={name:k,total:0,custSet:new Set(),...Object.fromEntries(BKEYS.map(b=>[b,0]))};
    m[k].total+=rem;m[k][BKEYS[bucketIdx(e.PostingDate,toDate)]]+=rem;m[k].custSet.add(e.CustomerNo||"?");
  });
  let arr=Object.values(m).map(l=>({...l,count:l.custSet.size})).sort((a,b)=>b.total-a.total);
  if(riskFilter){arr=arr.filter(l=>{
    const pos=Math.max(0,l.b90)+Math.max(0,l.b180)+Math.max(0,l.b360)+Math.max(0,l.b360p);
    const t=Math.max(1,l.total);const p90=pos/t;
    if(riskFilter==='high')return p90>0.3||Math.max(0,l.b180)+Math.max(0,l.b360)+Math.max(0,l.b360p)>0;
    if(riskFilter==='med')return p90>0.05&&!(p90>0.3);
    if(riskFilter==='low')return!(p90>0.05||l.b90>0);
    return true;
  });}
  return arr;
}

/* ══════════ TOP CUSTOMERS ══════════ */
function getTop50Filtered(){
  const state=(getEl("t5State")||{value:""}).value,mkt=(getEl("t5Mkt")||{value:""}).value;
  const risk=(getEl("t5Risk")||{value:""}).value,srch=(getEl("t5Srch")||{value:""}).value.toLowerCase().trim();
  let d=custSum;
  if(state)d=d.filter(c=>c.state===state);if(mkt)d=d.filter(c=>c.salesperson===mkt);
  if(risk==="high")d=d.filter(c=>c.total>0&&(Math.max(0,c.b90)+Math.max(0,c.b180)+Math.max(0,c.b360)+Math.max(0,c.b360p))/c.total>0.3);
  if(risk==="med")d=d.filter(c=>c.b90>0);
  if(risk==="low")d=d.filter(c=>c.b90+c.b180+c.b360+c.b360p<=0);
  if(srch)d=d.filter(c=>c.name.toLowerCase().includes(srch)||c.no.toLowerCase().includes(srch));
  return d;
}
function renderTop50(){
  const d=getTop50Filtered(),tp=Math.max(1,Math.ceil(d.length/t5PS));if(t5Page>tp)t5Page=1;
  const start=(t5Page-1)*t5PS,end=Math.min(t5Page*t5PS,d.length);
  const fTot=d.reduce((s,c)=>s+c.total,0),gTot=custSum.reduce((s,c)=>s+c.total,0);
  setText("t5Sub","Showing "+d.length+" customers (page "+t5Page+"/"+tp+")");
  setText("t5Tot","Filtered: "+fCrPlain(fTot));setText("t5FT",fCrPlain(fTot));setText("t5GT",fCrPlain(gTot));
  const tb=getEl("t5Body");if(!tb)return;
  if(!d.length){tb.innerHTML='<tr><td colspan="13" class="empty">No customers match filters.</td></tr>';return;}
  tb.innerHTML=d.slice(start,end).map((c,i)=>{
    const rank=start+i+1,rb=rank===1?'rank-1':rank===2?'rank-2':rank===3?'rank-3':'rank-n';
    const bStyle=(v,isGreen)=>v<0?'color:var(--red);':v>0?(isGreen?'color:var(--green);':'color:var(--orange);'):'';
    return `<tr onclick="openModal('${c.no.replace(/'/g,"\\'")}');" style="cursor:pointer;">
      <td><span class="rank-badge ${rb}">${rank}</span></td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;">${c.name}</td>
      <td style="color:var(--text3);">${c.state}</td>
      <td style="color:var(--text3);">${c.salesperson}</td>
      <td style="${c.total<0?"color:var(--red);":""}font-weight:700;">${fL(c.total)}</td>
      <td style="${bStyle(c.b30||0,true)}">${fL(c.b30||0)}</td>
      <td style="${bStyle(c.b60||0,false)}">${fL(c.b60||0)}</td>
      <td style="${bStyle(c.b90||0,false)}">${fL(c.b90||0)}</td>
      <td style="${(c.b180||0)<0?"color:var(--red);":(c.b180||0)>0?"color:var(--red);":""}">${fL(c.b180||0)}</td>
      <td style="${(c.b360||0)<0?"color:var(--red);":(c.b360||0)>0?"color:var(--red);":""}">${fL(c.b360||0)}</td>
      <td style="${(c.b360p||0)<0?"color:var(--red);":(c.b360p||0)>0?"color:var(--red);font-weight:700;":""}">${fL(c.b360p||0)}</td>
      <td>${getRiskTag(c)}</td>
      <td><button onclick="event.stopPropagation();openModal('${c.no.replace(/'/g,"\\'")}');" class="drill-btn">Detail</button></td>
    </tr>`;
  }).join("");
  buildPg("t5Pg","t5Pgi",t5Page,tp,d.length,start+1,end,(p)=>{t5Page=p;renderTop50();});
}
["t5State","t5Mkt","t5Risk"].forEach(id=>{const el=getEl(id);if(el)el.addEventListener("change",()=>{t5Page=1;renderTop50();});});
const t5SrchEl=getEl("t5Srch");if(t5SrchEl)t5SrchEl.addEventListener("input",()=>{t5Page=1;renderTop50();});
function rst50(){["t5State","t5Mkt","t5Risk"].forEach(id=>{const el=getEl(id);if(el)el.value="";});const s=getEl("t5Srch");if(s)s.value="";t5Page=1;renderTop50();}

/* ══════════ AGEING TABLE ══════════ */
function renderAgeing(){
  const sf=(getEl("aState")||{value:""}).value,mf=(getEl("aMkt")||{value:""}).value;
  const toDate=getToDate();
  let d=custSum;if(sf)d=d.filter(c=>c.state===sf);if(mf)d=d.filter(c=>c.salesperson===mf);
  const tot=d.reduce((s,c)=>s+c.total,0);
  setText("aTot","O/S: "+fCrPlain(tot));setText("ageGT","Grand Total: "+fCrPlain(custSum.reduce((s,c)=>s+c.total,0)));
  let tAmt=0;
  setHTML("ageBody",ADEFS.map((def)=>{
    const amt=d.reduce((s,c)=>s+(c[def.bk]||0),0);
    const custs=d.filter(c=>(c[def.bk]||0)!==0).length;
    let oRows=openRows;if(sf)oRows=oRows.filter(e=>(e.StateDes||"").trim()===sf);if(mf)oRows=oRows.filter(e=>(e.SalespersonCode||"").trim()===mf);
    const invs=oRows.filter(e=>bucketIdx(e.PostingDate,toDate)===def.bi).length;
    const pp=tot?(amt/tot*100).toFixed(1):"0";
    const sh=def.st==="safe"?'<span class="risk-pill risk-green">SAFE</span>':def.st==="watch"?'<span class="risk-pill risk-orange">WATCH</span>':'<span class="risk-pill risk-red">CRITICAL</span>';
    tAmt+=amt;
    return `<tr onclick="drillAge('${def.bk}','${def.lbl}','${sf}','${mf}')" style="cursor:pointer;">
      <td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${def.col};margin-right:8px;"></span>${def.lbl}</td>
      <td>${custs}</td><td>${invs}</td>
      <td style="${amt<0?"color:var(--red);":""}font-weight:700;">₹${fL(amt)}L</td>
      <td>${pp}%</td><td>${sh}</td>
      <td><button class="drill-btn" onclick="event.stopPropagation();drillAge('${def.bk}','${def.lbl}','${sf}','${mf}')">↗ Drill</button></td>
    </tr>`;
  }).join(""));
  setHTML("ageFoot",`<tr class="tfoot"><td><b>TOTAL</b></td><td><b>${d.length}</b></td><td><b>${fmt(openRows.length)}</b></td><td><b>₹${fL(tAmt)}L</b></td><td><b>100%</b></td><td></td><td></td></tr>`);
}
["aState","aMkt"].forEach(id=>{const el=getEl(id);if(el)el.addEventListener("change",renderAgeing);});
function rstAge(){const s=getEl("aState"),m=getEl("aMkt");if(s)s.value="";if(m)m.value="";renderAgeing();}
function drillAge(bk,lbl,sf,mf){
  let d=custSum;if(sf)d=d.filter(c=>c.state===sf);if(mf)d=d.filter(c=>c.salesperson===mf);
  ageDrillRows=d.filter(c=>(c[bk]||0)!==0).sort((a,b)=>b[bk]-a[bk]);agePage=1;_ageDrillBk=bk;
  setText("ageDrillPageTitle",`${lbl} — ${ageDrillRows.length} customers`);
  setText("ageDrillPageSub",`Total: ${fCrPlain(ageDrillRows.reduce((s,c)=>s+(c[bk]||0),0))} · Bucket: ${lbl}${sf?" · State: "+sf:""}${mf?" · Mkt: "+mf:""}`);
  renderAgeDrill(bk);openDrillPage("ageDrillPage");
}
function renderAgeDrill(bk){
  if(bk)_ageDrillBk=bk;
  const rows=ageDrillRows,tp=Math.max(1,Math.ceil(rows.length/agePS));if(agePage>tp)agePage=1;
  const start=(agePage-1)*agePS,end=Math.min(agePage*agePS,rows.length);
  setHTML("ageDrillBody",rows.slice(start,end).map((c,i)=>`<tr style="cursor:pointer;" onclick="closeDrillPage('ageDrillPage');openModal('${c.no.replace(/'/g,"\\'")}');">
    <td style="font-family:'JetBrains Mono';font-size:10px;color:var(--text3);">${start+i+1}</td>
    <td style="font-family:'JetBrains Mono';font-size:10px;color:var(--text3);">${c.no}</td>
    <td>${c.name}</td><td style="color:var(--text3);">${c.state}</td><td style="color:var(--text3);">${c.salesperson}</td>
    <td style="${c.maxDays>360?"color:var(--red);font-weight:700;":c.maxDays>180?"color:var(--orange);":""};font-family:'JetBrains Mono';">${c.maxDays}d</td>
    <td style="${(c[_ageDrillBk]||0)<0?"color:var(--red);":"color:var(--orange);"}font-weight:700;">₹${fL(c[_ageDrillBk]||0)}L</td>
  </tr>`).join("")||'<tr><td colspan="7" class="empty">No data</td></tr>');
  buildPg("ageDrillPg","ageDrillPgi",agePage,tp,rows.length,start+1,end,(p)=>{agePage=p;renderAgeDrill();});
}

/* ══════════ MARKETING TAB ══════════ */
function renderMkt(){
  const stateF=(getEl("mktState")||{value:""}).value,riskF=(getEl("mktRisk")||{value:""}).value;
  const arr=getMktArr(stateF,riskF),tot=custSum.reduce((s,c)=>s+c.total,0);
  setText("mktTot","Filtered: "+fCrPlain(arr.reduce((s,m)=>s+m.total,0)));
  const t15=arr.slice(0,15);
  dc("cMktD");const cMktDEl=getEl("cMktD");
  if(cMktDEl)CH.cMktD=new Chart(cMktDEl,{type:"bar",data:{labels:t15.map(m=>m.name),datasets:BKEYS.map((bk,i)=>({label:BLBLS[i],data:t15.map(m=>Math.max(0,(m[bk]||0))/1e5),backgroundColor:BCOLS[i],borderWidth:0}))},options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:"#8fa9cc",font:{size:9}},position:"bottom"},tooltip:{mode:"index",titleColor:'#e8f0fc',bodyColor:'#e8f0fc',backgroundColor:'rgba(10,22,40,0.95)',borderColor:'#1f3554',borderWidth:1}},scales:{x:{stacked:true,ticks:{color:"#8fa9cc",font:{size:8},callback:v=>"₹"+v+"L"},grid:{color:"rgba(31,53,84,.7)"}},y:{stacked:true,ticks:{color:"#e8f0fc",font:{size:9}},grid:{display:false}}}}});
  setHTML("mktBody",arr.length?arr.map((m,i)=>{
    const pp=pct(m.total,tot);
    const rt=m.b180+m.b360+m.b360p>0?'<span class="risk-pill risk-red">&gt;90D</span>':m.b90>0?'<span class="risk-pill risk-orange">61–90D</span>':'<span class="risk-pill risk-green">Safe</span>';
    const bCell=(v,isG)=>`<td style="${v<0?"color:var(--red);":v>0?(isG?"color:var(--green);":"color:var(--orange);"):""}">${fL(v)}</td>`;
    return `<tr style="cursor:pointer;" onclick="drillMkt('${m.name.replace(/'/g,"\\'")}')">
      <td><span class="rank-badge ${i<3?'rank-'+(i+1):'rank-n'}">${i+1}</span></td>
      <td style="font-weight:600;color:var(--accent2);">${m.name}</td>
      <td style="${m.total<0?"color:var(--red);":""}font-weight:700;">₹${fL(m.total)}L</td>
      ${bCell(m.b30||0,true)}${bCell(m.b60||0,false)}${bCell(m.b90||0,false)}${bCell(m.b180||0,false)}${bCell(m.b360||0,false)}${bCell(m.b360p||0,false)}
      <td>${pp}%</td><td>${rt}</td>
      <td><button onclick="event.stopPropagation();drillMkt('${m.name.replace(/'/g,"\\'")}');" class="drill-btn">↗ All Entries</button></td>
    </tr>`;
  }).join(""):'<tr><td colspan="12" class="empty">No data matching filters.</td></tr>');
}
function rstMkt(){const s=getEl("mktState"),r=getEl("mktRisk");if(s)s.value="";if(r)r.value="";renderMkt();}
function drillMkt(sp){
  const toDate=getToDate();
  /* ✅ Match on normalized SalespersonCode */
  mktDrillRows=openRows.filter(e=>(e.SalespersonCode||"").trim()===sp).sort((a,b)=>new Date(a.PostingDate||"1900")-new Date(b.PostingDate||"1900"));
  mktPage=1;
  const totalRem=mktDrillRows.reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0);
  const custSet=new Set(mktDrillRows.map(e=>e.CustomerNo));
  const bTots=BKEYS.map((_,i)=>mktDrillRows.filter(e=>bucketIdx(e.PostingDate,toDate)===i).reduce((s,e)=>s+Number(e.Remaining_Amt_LCY||0),0));
  setText("mktDrillPageTitle",`${sp} — All Open Ledger Entries`);
  setText("mktDrillPageSub",`${fmt(mktDrillRows.length)} open entries · Net Remaining: ${fCrPlain(totalRem)}`);
  setHTML("mktDrillKpis",`
    <div class="drill-kpi"><div class="drill-kpi-label">Salesperson</div><div class="drill-kpi-value" style="color:var(--accent2);font-size:12px;">${sp}</div></div>
    <div class="drill-kpi"><div class="drill-kpi-label">Net Remaining</div><div class="drill-kpi-value" style="color:${totalRem<0?"var(--red)":"var(--orange)"};">${fCrPlain(totalRem)}</div></div>
    <div class="drill-kpi"><div class="drill-kpi-label">Open Entries</div><div class="drill-kpi-value" style="color:var(--cyan);">${fmt(mktDrillRows.length)}</div></div>
    <div class="drill-kpi"><div class="drill-kpi-label">Customers</div><div class="drill-kpi-value" style="color:var(--lime);">${fmt(custSet.size)}</div></div>
    <div class="drill-kpi"><div class="drill-kpi-label">Critical (&gt;90D)</div><div class="drill-kpi-value" style="color:var(--red);">${fCrPlain(bTots[2]+bTots[3]+bTots[4]+bTots[5])}</div></div>
    <div class="drill-kpi"><div class="drill-kpi-label">Safe (1–30D)</div><div class="drill-kpi-value" style="color:var(--green);">${fCrPlain(bTots[0])}</div></div>
  `);
  renderMktDrill();openDrillPage("mktDrillPage");
}
function renderMktDrill(){
  const rows=mktDrillRows,tp=Math.max(1,Math.ceil(rows.length/mktPS));if(mktPage>tp)mktPage=1;
  const start=(mktPage-1)*mktPS,end=Math.min(mktPage*mktPS,rows.length);
  const toDate=getToDate();
  setHTML("mktDrillBody",rows.slice(start,end).length?rows.slice(start,end).map((e,i)=>{
    const dd=daysSincePosting(e.PostingDate,toDate),bi=bucketIdx(e.PostingDate,toDate),rem=Number(e.Remaining_Amt_LCY||0),amt=Number(e.Amount_LCY||0);
    const sp=(e.SalespersonCode||"").trim()||rS(e.CustomerNo)||"—";
    return `<tr onclick="closeDrillPage('mktDrillPage');openModal('${(e.CustomerNo||'').replace(/'/g,"\\'")}');" style="cursor:pointer;">
      <td style="font-family:'JetBrains Mono';font-size:10px;color:var(--text3);">${start+i+1}</td>
      <td style="font-family:'JetBrains Mono';font-size:10px;color:var(--text3);">${e.CustomerNo||"—"}</td>
      <td style="font-size:11px;">${rN(e.CustomerNo)}</td>
      <td style="font-size:10px;color:var(--text3);">${(e.StateDes||"").trim()||"—"}</td>
      <td style="font-size:10px;">${e.PostingDate||"—"}</td><td style="font-size:10px;">${e.DueDate||"—"}</td>
      <td style="font-family:'JetBrains Mono';font-size:10px;">${e.DocumentNo||""}</td>
      <td style="font-size:10px;color:var(--text3);">${(e.DocumentType||"").trim()||"—"}</td>
      <td style="font-family:'JetBrains Mono';${amt<0?"color:var(--red);":""}">${fCrPlain(amt)}</td>
      <td style="font-family:'JetBrains Mono';font-weight:700;${rem<0?"color:var(--red);":"color:var(--orange);"}">${fCrPlain(rem)}</td>
      <td style="${dd>360?"color:var(--red);font-weight:700;":dd>180?"color:var(--orange);":""};font-family:'JetBrains Mono';">${dd}d</td>
      <td><span style="color:${BCOLS[bi]};font-size:10px;font-weight:700;">${BLBLS[bi]}</span></td>
      <td><button class="drill-btn" onclick="event.stopPropagation();closeDrillPage('mktDrillPage');openModal('${(e.CustomerNo||'').replace(/'/g,"\\'")}');">Detail</button></td>
    </tr>`;
  }).join(""):'<tr><td colspan="13" class="empty">No data</td></tr>');
  buildPg("mktDrillPg","mktDrillPgi",mktPage,tp,rows.length,start+1,end,(p)=>{mktPage=p;renderMktDrill();});
}

/* ══════════ STATE TAB ══════════ */
function renderLoc(){
  const mktF=(getEl("locMkt")||{value:""}).value,riskF=(getEl("locRisk")||{value:""}).value;
  const arr=getStateArr(mktF,riskF),tot=custSum.reduce((s,c)=>s+c.total,0);
  setText("locTot","Filtered: "+fCrPlain(arr.reduce((s,l)=>s+l.total,0)));
  const t12=arr.slice(0,12);
  dc("cLocD");const cLocDEl=getEl("cLocD");
  if(cLocDEl)CH.cLocD=new Chart(cLocDEl,{type:"bar",data:{labels:t12.map(l=>l.name),datasets:[{data:t12.map(l=>Math.max(0,l.total)/1e5),backgroundColor:t12.map((_,i)=>`hsl(${270+i*12},65%,${60-i*2}%)`),borderWidth:0,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ₹${(t12[ctx.dataIndex].total/1e5).toFixed(2)}L`},titleColor:'#e8f0fc',bodyColor:'#e8f0fc',backgroundColor:'rgba(10,22,40,0.95)',borderColor:'#1f3554',borderWidth:1}},scales:{x:{ticks:{color:"#e8f0fc",font:{size:9}},grid:{display:false}},y:{ticks:{color:"#8fa9cc",font:{size:9},callback:v=>"₹"+v+"L"},grid:{color:"rgba(31,53,84,.7)"}}}}});
  setHTML("locBody",arr.length?arr.map((l,i)=>{
    const pp=pct(l.total,tot);
    const rt=l.b180+l.b360+l.b360p>0?'<span class="risk-pill risk-red">&gt;90D</span>':l.b90>0?'<span class="risk-pill risk-orange">61–90D</span>':'<span class="risk-pill risk-green">Safe</span>';
    const bCell=(v,isG)=>`<td style="${v<0?"color:var(--red);":v>0?(isG?"color:var(--green);":"color:var(--orange);"):""}">${fL(v)}</td>`;
    return `<tr>
      <td><span class="rank-badge ${i<3?'rank-'+(i+1):'rank-n'}">${i+1}</span></td>
      <td style="font-weight:600;">${l.name}</td>
      <td style="${l.total<0?"color:var(--red);":""}font-weight:700;">₹${fL(l.total)}L</td>
      ${bCell(l.b30||0,true)}${bCell(l.b60||0,false)}${bCell(l.b90||0,false)}${bCell(l.b180||0,false)}${bCell(l.b360||0,false)}${bCell(l.b360p||0,false)}
      <td>${l.count}</td><td>${pp}%</td>
      <td><button class="drill-btn" onclick="drillState('${l.name.replace(/'/g,"\\'")}')">↗ Drill</button></td>
    </tr>`;
  }).join(""):'<tr><td colspan="12" class="empty">No data matching filters.</td></tr>');
}
function rstLoc(){const m=getEl("locMkt"),r=getEl("locRisk");if(m)m.value="";if(r)r.value="";renderLoc();}
function drillState(stateName){
  locDrillRows=custSum.filter(c=>c.state===stateName).sort((a,b)=>b.total-a.total);locPage=1;
  setText("locDrillPageTitle",`${stateName} — ${locDrillRows.length} Customers`);
  setText("locDrillPageSub",`Total Outstanding: ${fCrPlain(locDrillRows.reduce((s,c)=>s+c.total,0))}`);
  renderLocDrill();openDrillPage("locDrillPage");
}
function renderLocDrill(){
  const rows=locDrillRows,tp=Math.max(1,Math.ceil(rows.length/locPS));if(locPage>tp)locPage=1;
  const start=(locPage-1)*locPS,end=Math.min(locPage*locPS,rows.length);
  const bStyle=(v,isG)=>v<0?'color:var(--red);':v>0?(isG?'color:var(--green);':'color:var(--orange);'):'';
  setHTML("locDrillBody",rows.slice(start,end).length?rows.slice(start,end).map((c,i)=>`<tr onclick="closeDrillPage('locDrillPage');openModal('${c.no.replace(/'/g,"\\'")}');" style="cursor:pointer;">
    <td><span class="rank-badge ${(start+i)<3?'rank-'+(start+i+1):'rank-n'}">${start+i+1}</span></td>
    <td>${c.name}</td><td style="color:var(--text3);">${c.salesperson}</td>
    <td style="${c.total<0?"color:var(--red);":""}font-weight:700;">₹${fL(c.total)}L</td>
    <td style="${bStyle(c.b30||0,true)}">${fL(c.b30||0)}</td>
    <td style="${bStyle(c.b60||0,false)}">${fL(c.b60||0)}</td>
    <td style="${bStyle(c.b90||0,false)}">${fL(c.b90||0)}</td>
    <td style="${bStyle(c.b180||0,false)}">${fL(c.b180||0)}</td>
    <td style="${bStyle(c.b360||0,false)}">${fL(c.b360||0)}</td>
    <td style="${bStyle(c.b360p||0,false)}">${fL(c.b360p||0)}</td>
    <td>${getRiskTag(c)}</td>
    <td><button class="drill-btn" onclick="event.stopPropagation();closeDrillPage('locDrillPage');openModal('${c.no.replace(/'/g,"\\'")}');">Detail</button></td>
  </tr>`).join(""):'<tr><td colspan="12" class="empty">No data</td></tr>');
  buildPg("locDrillPg","locDrillPgi",locPage,tp,rows.length,start+1,end,(p)=>{locPage=p;renderLocDrill();});
}

/* ══════════ CUSTOMER MODAL ══════════ */
function openModal(cno){
  const c=custSum.find(x=>x.no===cno);if(!c)return;
  const invs=openRows.filter(e=>(e.CustomerNo||"")===cno).sort((a,b)=>new Date(a.PostingDate||"1900")-new Date(b.PostingDate||"1900"));
  modalInvs=invs;modalFilteredInvs=invs;mPage=1;mPS=25;
  setText("mTit",c.name+" — Outstanding Detail");
  setHTML("mKpis",`
    <div class="mk"><div class="mk-label">Total O/S</div><div class="mk-value" style="color:${c.total<0?"var(--red)":"var(--cyan)"};">${fCrPlain(c.total)}</div></div>
    <div class="mk"><div class="mk-label">Overdue &gt;90D</div><div class="mk-value" style="color:var(--red);">${fCrPlain(c.b90+c.b180+c.b360+c.b360p)}</div></div>
    <div class="mk"><div class="mk-label">Open Entries</div><div class="mk-value" style="color:var(--accent2);">${invs.length}</div></div>
    <div class="mk"><div class="mk-label">Max Days</div><div class="mk-value" style="color:var(--orange);">${c.maxDays}d</div></div>
    <div class="mk"><div class="mk-label">State</div><div class="mk-value" style="font-size:12px;color:var(--text2);">${c.state}</div></div>
    <div class="mk"><div class="mk-label">Marketing</div><div class="mk-value" style="font-size:12px;color:var(--text2);">${c.salesperson}</div></div>
  `);
  const mSrchEl=getEl("mSrch");if(mSrchEl)mSrchEl.value="";const mPSEl=getEl("mPageSize");if(mPSEl)mPSEl.value="25";
  renderModalPagedRows();const modal=getEl("custModal");if(modal)modal.classList.add("open");document.body.style.overflow="hidden";
}
function closeModal(){const modal=getEl("custModal");if(modal)modal.classList.remove("open");document.body.style.overflow="";}
const custModalEl=getEl("custModal");if(custModalEl)custModalEl.addEventListener("click",e=>{if(e.target===e.currentTarget)closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeNewRepeatModal();closeDonutDrill();}});
function fltModal(){const q=(getEl("mSrch")||{value:""}).value.toLowerCase();modalFilteredInvs=q?modalInvs.filter(e=>(e.DocumentNo||"").toLowerCase().includes(q)):modalInvs;mPage=1;renderModalPagedRows();}
function renderModalPagedRows(){
  const toDate=getToDate();
  const rows=modalFilteredInvs,tp=Math.max(1,Math.ceil(rows.length/mPS));if(mPage>tp)mPage=1;
  const start=(mPage-1)*mPS,end=Math.min(mPage*mPS,rows.length);
  setText("mCnt",rows.length+" open entr"+(rows.length!==1?"ies":"y")+" · page "+mPage+" of "+tp);
  setHTML("mBody",rows.slice(start,end).map((e,i)=>{
    const bi=bucketIdx(e.PostingDate,toDate),dd=daysSincePosting(e.PostingDate,toDate);
    const amt=Number(e.Amount_LCY||0),rem=Number(e.Remaining_Amt_LCY||0);
    return `<tr>
      <td style="color:var(--text3);font-family:'JetBrains Mono';font-size:10px;">${start+i+1}</td>
      <td style="font-family:'JetBrains Mono';font-size:10px;color:var(--text3);">${e.EntryNo||""}</td>
      <td style="font-size:10px;">${e.PostingDate||"—"}</td>
      <td style="font-size:10px;">${e.DueDate||"—"}</td>
      <td style="font-family:'JetBrains Mono';font-size:10px;">${e.DocumentNo||""}</td>
      <td style="font-size:10px;color:var(--text3);">${(e.DocumentType||"").trim()||"—"}</td>
      <td style="font-family:'JetBrains Mono';${amt<0?"color:var(--red);":""}">${fCrPlain(amt)}</td>
      <td style="font-family:'JetBrains Mono';font-weight:700;${rem<0?"color:var(--red);":"color:var(--orange);"}">${fCrPlain(rem)}</td>
      <td style="${dd>360?"color:var(--red);font-weight:700;":dd>180?"color:var(--orange);":""};font-family:'JetBrains Mono';">${dd}d</td>
      <td><span style="color:${BCOLS[bi]};font-size:10px;font-weight:700;">${BLBLS[bi]}</span></td>
    </tr>`;
  }).join("")||'<tr><td colspan="10" class="empty">No open entries.</td></tr>');
  buildPg("mPg","mPgi",mPage,tp,rows.length,start+1,end,(p)=>{mPage=p;renderModalPagedRows();});
}

/* ══════════ SYNC DROPDOWNS ══════════ */
function syncDropdowns(){
  const states=[...new Set(custSum.map(c=>c.state).filter(Boolean))].sort();
  const sals=[...new Set(custSum.map(c=>c.salesperson).filter(Boolean))].sort();
  const sel=(id,opts,pfx)=>{const el=getEl(id);if(!el)return;const cur=el.value;el.innerHTML=pfx+opts.map(v=>`<option value="${v}">${v}</option>`).join("");if(opts.includes(cur))el.value=cur;};
  ["t5State","aState","mktState"].forEach(id=>sel(id,states,'<option value="">All States</option>'));
  ["t5Mkt","aMkt","locMkt"].forEach(id=>sel(id,sals,'<option value="">All</option>'));
}

/* ══════════ TAB SWITCH ══════════ */
const TABS=["overview","top50","ageing","marketing","location"];
function swTab(name){
  TABS.forEach((t,i)=>{document.querySelectorAll(".tab")[i].classList.toggle("active",t===name);const el=getEl("tab-"+t);if(el)el.style.display=t===name?"block":"none";});
  if(name==="marketing")renderMkt();if(name==="location")renderLoc();if(name==="ageing")renderAgeing();if(name==="top50")renderTop50();
}

/* ══════════════════════════════════════════════════════════
   BOOTSTRAP — KEY FIXES:
   1. Normalize Salesperson_Code → SalespersonCode on every CLE row
   2. CustomerType options populated from real API data
══════════════════════════════════════════════════════════ */
async function loadDashboard(){
  try{
    setP(5);
    const customers=await fetchAllPages(CUSTOMER_API,"Customer Master",5,30);
    customers.forEach(c=>{
      /* ✅ Normalize salesperson on customer master too */
      const sp=((c.SalespersonCode||c.Salesperson_Code||"").trim())||"—";
      custMap[c.No]={name:c.Name||c.No,salesperson:sp,locationCode:(c.Location_Code||"").trim(),postingGroup:c.Customer_Posting_Group||""};
    });
    setText("hConn",fmt(customers.length)+" customers loaded");

    const cle=await fetchAllPages(CLE_API,"Customer Ledger Entries",30,90);
    allCLE=cle;
    allCLE.forEach(e=>{
      if(e.Location_Code)e.Location_Code=e.Location_Code.trim();
      if(e.StateDes)e.StateDes=e.StateDes.trim();
      /* ✅ FIX: Normalize Salesperson_Code → SalespersonCode so all filter/group logic uses one field */
      if(!e.SalespersonCode && e.Salesperson_Code) e.SalespersonCode = e.Salesperson_Code;
      if(e.SalespersonCode) e.SalespersonCode = e.SalespersonCode.trim();
      /* ✅ FIX: Normalize CustomerType trim */
      if(e.CustomerType) e.CustomerType = e.CustomerType.trim();
    });

    /* ✅ populateDropdowns now reads actual CustomerType values from API */
    populateDropdowns(allCLE);

    const cfy = getCurrentFY();
    _activeFilters = {
      fc:"", fs:"", fg:"", fct:"", fst:"",
      fYear:"", fFrom:"", fTo:"",
      salesFrom: cfy.from,
      salesTo:   cfy.to,
      hasExplicitDateFilter: false
    };

    filtCLE  = allCLE;
    openRows = allCLE.filter(e=>e.Open===true);
    buildNewRepeatLists(cfy.from, cfy.to, "", "", "", "", "");
    buildCustSum();
    renderAll();

    const ts=new Date().toLocaleTimeString("en-IN");
    setSt("✅ Connected · "+fmt(customers.length)+" customers · "+fmt(allCLE.length)+" CLE rows · "+fmt(openRows.length)+" open · Synced: "+ts,true);
    setText("hConn",fmt(customers.length)+" customers · "+fmt(allCLE.length)+" entries · "+fmt(openRows.length)+" open");
    setText("finfo","No filters active · All open entries shown · Sales / New / Repeat Customers: "+cfy.label);
    setP(100);

    const closeBtn=getEl("salesPopupCloseBtn");
    if(closeBtn){closeBtn.onclick=function(e){e.stopPropagation();e.preventDefault();closeSalesPopup();};}
    const popup=getEl("salesPopup");
    if(popup){popup.onclick=function(e){e.stopPropagation();};}
  }catch(err){
    console.error(err);setSt("❌ Error: "+err.message,false,true);
    const adiv=getEl("alertDiv");
    if(adiv){adiv.style.display="flex";setHTML("alertTxt",`⛔ <b>Connection Error:</b> ${err.message}<br><br><b>Checklist:</b> (1) Reach iteklogics.in:14658 (2) BC Web Services → CLE and CustomerApi published (3) Company name exact match`);}
    setP(100);
  }
}
loadDashboard();
