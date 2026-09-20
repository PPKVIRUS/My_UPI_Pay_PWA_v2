const KEY="my_upi_pay_pwa_v1";
const state=JSON.parse(localStorage.getItem(KEY)||'{"shopName":"","upi":"","merchantName":"","history":[],"showQuickAmounts":false,"quickAmounts":[50,100,500,1000],"showQuickActions":false}');
let currentQr=null, scanner=null, tempDestination=null;

const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(state)); refresh();}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function openModal(id){$(id).classList.remove("hidden")}
function closeModal(id){$(id).classList.add("hidden")}
function renderHomeOptions(){
  const box=$("optionalHome"); box.innerHTML="";
  if(state.showQuickAmounts){
    const wrap=document.createElement("div"); wrap.className="quick-amounts";
    (state.quickAmounts||[]).filter(x=>Number(x)>0).slice(0,6).forEach(x=>{const b=document.createElement("button");b.textContent="₹"+Number(x).toLocaleString("en-IN");b.onclick=()=>{$("amount").value=Number(x).toFixed(2);generate()};wrap.appendChild(b)});
    box.appendChild(wrap);box.classList.remove("hidden");
  }else box.classList.add("hidden");
  $("quickActions").classList.toggle("hidden",!state.showQuickActions);
}
function refresh(){
  $("upiDisplay").textContent=state.upi||"Not set";
  $("currentDestText").textContent=state.upi||"Not set";
  $("shopSubtitle").textContent=state.shopName||"Fast exact-amount QR";
  renderHomeOptions();
}
function validUpi(v){return /^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$/.test(v.trim())}
function amountValue(){
  const n=Number($("amount").value);
  if(!Number.isFinite(n)||n<=0)return null;
  return Math.round(n*100)/100;
}
function ref(){return "MYUPI"+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,7).toUpperCase()}
function buildUpiUri(upi, merchant, amount, tr){
  const p=new URLSearchParams();
  p.set("pa",upi); p.set("pn",merchant||"Merchant"); p.set("am",amount.toFixed(2)); p.set("cu","INR"); p.set("tr",tr);
  return "upi://pay?"+p.toString();
}
function addHistory(item){
  state.history.unshift(item); state.history=state.history.slice(0,500); save();
}
function generate(upiOverride=null, merchantOverride=null){
  const amount=amountValue();
  if(!amount){toast("Enter a valid amount");$("amount").focus();return}
  const upi=(upiOverride||state.upi||"").trim();
  if(!validUpi(upi)){toast("Set a valid UPI ID first");openDestination();return}
  const merchant=(merchantOverride||state.merchantName||state.shopName||"Merchant").trim();
  const transactionRef=ref();
  const uri=buildUpiUri(upi,merchant,amount,transactionRef);
  currentQr={amount,upi,merchant,transactionRef,uri,temp:!!upiOverride};
  $("qrAmount").textContent=amount.toFixed(2);
  $("qrDestination").textContent=upi;
  $("qrRef").textContent=transactionRef;
  $("qrcode").innerHTML="";
  if(typeof QRCode==="undefined"){toast("QR library not loaded. Connect to internet once and reopen.");return}
  new QRCode($("qrcode"),{text:uri,width:280,height:280,colorDark:"#000000",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.H});
  addHistory({time:new Date().toISOString(),amount,upi,ref:transactionRef,status:"QR GENERATED"});
  openModal("qrModal");
  if(upiOverride) tempDestination=null;
}
function markPaid(){
  if(!currentQr)return;
  const item=state.history.find(x=>x.ref===currentQr.transactionRef);
  if(item){item.status="PAYMENT RECEIVED";item.receivedAt=new Date().toISOString();save();}
  toast("Marked as payment received");
  closeModal("qrModal");
  $("amount").value="";
}
function downloadQr(){
  const img=$("qrcode").querySelector("img"), canvas=$("qrcode").querySelector("canvas");
  const src=img?.src || canvas?.toDataURL("image/png");
  if(!src){toast("QR image not ready");return}
  const a=document.createElement("a");a.href=src;a.download=`UPI_QR_${currentQr?.amount||""}.png`;a.click();
}
function openDestination(){openModal("destModal")}
function parseScanned(text){
  try{
    const u=new URL(text);
    const upi=u.searchParams.get("pa");
    const pn=u.searchParams.get("pn")||"";
    if(!upi)return null;
    return {upi,merchant:pn};
  }catch(e){return null}
}
function saveScanned(text){
  const data=parseScanned(text);
  if(!data||!validUpi(data.upi)){toast("This QR does not contain a usable UPI payment ID");return false}
  const ok=confirm(`Save this payment destination?\\n\\nUPI ID: ${data.upi}${data.merchant?"\\nName: "+data.merchant:""}`);
  if(!ok)return false;
  state.upi=data.upi.trim();
  if(data.merchant)state.merchantName=data.merchant.trim();
  save();toast("Payment destination saved");return true;
}
async function startScanner(){
  closeModal("destModal");openModal("scannerModal");$("scanResult").textContent="";
  if(typeof Html5Qrcode==="undefined"){toast("Scanner library not loaded. Connect to internet once.");return}
  try{
    scanner=new Html5Qrcode("reader",{formatsToSupport:[Html5QrcodeSupportedFormats.QR_CODE]});
    await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:250,height:250}},async text=>{
      const parsed=parseScanned(text);
      if(parsed){
        $("scanResult").textContent="QR found: "+parsed.upi;
        await stopScanner();
        saveScanned(text);
      }else $("scanResult").textContent="QR found, but it is not a standard UPI payment QR.";
    });
  }catch(e){
    $("scanResult").textContent="Camera could not start. Use CHOOSE QR IMAGE below.";
  }
}
async function stopScanner(){
  if(scanner){
    try{if(scanner.isScanning)await scanner.stop()}catch(e){}
    try{scanner.clear()}catch(e){}
    scanner=null;
  }
  closeModal("scannerModal");
}
function manualDialog(){closeModal("destModal");$("manualUpi").value="";$("manualName").value="";openModal("manualModal")}
function manualValue(){
  const upi=$("manualUpi").value.trim(), name=$("manualName").value.trim();
  if(!validUpi(upi)){toast("Enter a valid UPI ID");return null}
  return {upi,name};
}
$("generateBtn").onclick=()=>generate();
$("changeDestBtn").onclick=openDestination;
$("scanBtn").onclick=startScanner;
$("scanDestBtn").onclick=startScanner;
$("manualBtn").onclick=manualDialog;
$("manualDestBtn").onclick=manualDialog;
$("settingsBtn").onclick=()=>{ $("shopName").value=state.shopName||"";$("settingsUpi").value=state.upi||"";$("settingsMerchant").value=state.merchantName||"";openModal("settingsModal")};
$("settingsBtn2").onclick=()=>{ $("shopName").value=state.shopName||"";$("settingsUpi").value=state.upi||"";$("settingsMerchant").value=state.merchantName||"";openModal("settingsModal")};
$("saveUpiBtn").onclick=()=>{const d=manualValue();if(!d)return;state.upi=d.upi; if(d.name)state.merchantName=d.name;save();closeModal("manualModal");toast("Saved as default")};
$("useOnceBtn").onclick=()=>{const d=manualValue();if(!d)return;closeModal("manualModal");generate(d.upi,d.name||state.merchantName||state.shopName||"Merchant")};
$("saveSettingsBtn").onclick=()=>{
  const upi=$("settingsUpi").value.trim();
  if(upi&&!validUpi(upi)){toast("Enter a valid UPI ID");return}
  state.shopName=$("shopName").value.trim();state.upi=upi;state.merchantName=$("settingsMerchant").value.trim()||state.shopName;state.showQuickAmounts=$("showQuickAmounts").checked;state.showQuickActions=$("showQuickActions").checked;state.quickAmounts=$("quickAmounts").value.split(",").map(x=>Number(x.trim())).filter(x=>Number.isFinite(x)&&x>0).slice(0,6);if(state.showQuickAmounts&&!state.quickAmounts.length){toast("Enter at least one quick amount");return;}
  save();closeModal("settingsModal");toast("Settings saved");
};
$("clearDestinationBtn").onclick=()=>{if(confirm("Clear the saved payment destination?")){state.upi="";save();closeModal("settingsModal");toast("Destination cleared")}};
$("historyBtn").onclick=()=>{
  const list=$("historyList");list.innerHTML="";
  if(!state.history.length)list.innerHTML='<div class="small-note">No records yet.</div>';
  state.history.forEach(x=>{
    const d=new Date(x.time);const div=document.createElement("div");div.className="history-item";
    div.innerHTML=`<div class="history-top"><span class="history-amount">₹${Number(x.amount).toFixed(2)}</span><span class="history-status ${x.status==="PAYMENT RECEIVED"?"received":"generated"}">${x.status}</span></div><div class="history-meta">${d.toLocaleString()}<br>${escapeHtml(x.upi)}<br>Ref: ${escapeHtml(x.ref)}</div>`;
    list.appendChild(div);
  });
  openModal("historyModal");
};
$("clearHistoryBtn").onclick=()=>{if(confirm("Delete all local history?")){state.history=[];save();$("historyList").innerHTML='<div class="small-note">No records yet.</div>';toast("History cleared")}};
$("markPaidBtn").onclick=markPaid;
$("downloadQrBtn").onclick=downloadQr;
$("newPaymentBtn").onclick=()=>{closeModal("qrModal");$("amount").value="";$("amount").focus()};
$("stopScannerBtn").onclick=stopScanner;
$("chooseImageBtn").onclick=()=>$("qrImageInput").click();
$("qrImageInput").onchange=async e=>{
  const file=e.target.files[0]; if(!file||typeof Html5Qrcode==="undefined")return;
  const temp=new Html5Qrcode("reader");
  try{
    const text=await temp.scanFile(file,true); const parsed=parseScanned(text);
    if(parsed){saveScanned(text);closeModal("scannerModal")}else $("scanResult").textContent="The image is not a standard UPI QR.";
  }catch(err){$("scanResult").textContent="Could not read a QR code from that image."}
  finally{try{temp.clear()}catch(err){}}
};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
refresh();
