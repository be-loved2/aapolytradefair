const RATE = 20000;
const naira = n => '₦' + Number(n).toLocaleString('en-NG');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sb = (typeof supabase !== 'undefined' && !SUPABASE_URL.startsWith('YOUR_')) ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Shared by vendor page and admin: official A4 registration document
function docHTML(v) {
  const row = (l, val) => `<tr><th>${l}</th><td>${esc(val) || '—'}</td></tr>`;
  const dates = (v.participation_dates || []).join('; ');
  const d = v.created_at ? new Date(v.created_at).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'}) : '';
  return `<div class="doc"><div class="doc-head"><img src="assets/aap-logo.png" alt="">
<div><h1>ABRAHAM ADESANYA POLYTECHNIC</h1><p>IJEBU-IGBO, OGUN STATE</p><p class="b">4TH COMBINED CONVOCATION CEREMONIES &amp; 20TH ANNIVERSARY CELEBRATIONS</p></div></div>
<div class="doc-title"><span>TRADE FAIR</span><em>VENDOR REGISTRATION FORM</em></div>
<table>${row('Registration Number', v.registration_number)}${row('Vendor Name', v.full_name)}${row('Business Name', v.business_name)}${row('Phone', v.phone)}${row('Email', v.email)}${row('Business Address', v.business_address)}${row('Category', v.category)}${row('Product / Service', v.product_service)}${row('Description', v.description)}${row('Number of Stalls', v.number_of_stalls)}${row('Total Amount', naira(v.total_amount))}${row('Selected Dates', dates)}${row('Registered On', d)}</table>
<div class="doc-ev"><div><b>VENUE:</b><br>TETFUND HALL OPEN SPACE</div><div><b>TIME:</b><br>10:00 AM DAILY</div><div><b>DATE:</b><br>13TH – 15TH OCTOBER 2026</div></div>
<div class="sign"><div>Vendor Signature:<br><i></i></div><div>Date:<br><i></i></div></div>
<div class="doc-off"><h4>FOR OFFICIAL USE ONLY</h4><div><section><p>Vendor ID/No.: <u></u></p><p>Stall/Table No.: <u></u></p><p>Amount Paid: ₦ <u></u></p></section><section><p>Payment Status: &#9744; Paid &nbsp; &#9744; Pending</p><p>Assigned By: <u></u></p><p>Remarks: <u></u></p></section></div></div>
<div class="doc-foot"><div><b>REGISTRATION DEADLINE:</b> THURSDAY, 8TH OCTOBER 2026</div><div><b>FOR ENQUIRIES:</b> +234 903 416 2279 · 08105232909</div></div></div>`;
}
function printDoc(v) {
  document.getElementById('printArea').innerHTML = docHTML(v);
  window.print();
}

(function () {
  const f = document.getElementById('vform'); if (!f) return;
  const states = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
  f.state.innerHTML += states.map(s => `<option${''}>${s}</option>`).join('');
  const st = document.getElementById('stalls');
  for (let i = 1; i <= 20; i++) st.innerHTML += `<option>${i}</option>`;
  const calc = () => { const n = parseInt(st.value) || 1; tStalls.textContent = n; tAmt.textContent = naira(n * RATE); };
  st.onchange = calc; calc();
  let last = null;
  f.onsubmit = async e => {
    e.preventDefault(); err.textContent = '';
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const dates = [...f.querySelectorAll('[name=dates]:checked')].map(c => c.value);
    if (!dates.length) { err.textContent = 'Please select at least one participation date.'; return; }
    if (!decl.checked) { err.textContent = 'Please accept the declaration.'; return; }
    if (!sb) { err.textContent = 'System not configured. Please edit config.js.'; return; }
    const g = n => (f.elements[n] ? f.elements[n].value : '').trim();
    const p = {}; ['full_name','business_name','contact_person','phone','whatsapp','email','business_address','city','state','category','product_service','description','special_requirements'].forEach(k => p[k] = g(k));
    p.number_of_stalls = parseInt(st.value); p.participation_dates = dates; // total is computed by the database, not sent
    submitBtn.disabled = true; submitBtn.textContent = 'SUBMITTING...';
    const { data, error } = await sb.rpc('register_vendor', { p });
    submitBtn.disabled = false; submitBtn.textContent = 'SUBMIT & GENERATE REGISTRATION FORM';
    if (error) { err.textContent = 'Submission failed: ' + error.message; return; }
    last = data; regNo.textContent = data.registration_number;
    preview.innerHTML = docHTML(data);
    f.hidden = true; result.hidden = false; scrollTo(0, 0);
  };
  printBtn.onclick = () => printDoc(last);
  editBtn.onclick = () => { result.hidden = true; f.hidden = false; };
})();
