let all = [], shown = [];
const $ = id => document.getElementById(id);
const CATS = ['Food & Beverages','Fashion & Lifestyle','Beauty & Personal Care','Technology & Innovation','Arts, Crafts & Others'];
const fmtD = d => new Date(d).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});

async function init() {
  if (!sb) { $('lerr').textContent = 'Configure config.js first.'; return; }
  const { data } = await sb.auth.getSession();
  data.session ? load() : ($('login').hidden = false);
}
$('lform').onsubmit = async e => {
  e.preventDefault(); $('lerr').textContent = '';
  const { error } = await sb.auth.signInWithPassword({ email: $('em').value, password: $('pw').value });
  error ? $('lerr').textContent = error.message : load();
};
$('logout').onclick = async () => { await sb.auth.signOut(); location.reload(); };

async function load() {
  const { data, error } = await sb.from('vendors').select('*').order('created_at', { ascending: false });
  if (error) { alert('Could not load vendors: ' + error.message); await sb.auth.signOut(); return location.reload(); }
  all = data; $('login').hidden = true; $('dash').hidden = false;
  $('sV').textContent = all.length;
  $('sS').textContent = all.reduce((a, v) => a + v.number_of_stalls, 0);
  $('sA').textContent = naira(all.reduce((a, v) => a + v.total_amount, 0));
  $('cats').innerHTML = CATS.map(c => `<span>${esc(c)}: <b>${all.filter(v => v.category === c).length}</b></span>`).join('');
  render();
}
function render() {
  const q = $('q').value.trim().toLowerCase(), c = $('fc').value, d = $('fd').value;
  shown = all.filter(v => (!c || v.category === c) && (!d || (v.participation_dates || []).includes(d)) &&
    (!q || [v.registration_number, v.full_name, v.business_name, v.phone].some(x => (x || '').toLowerCase().includes(q))));
  document.querySelector('#tbl tbody').innerHTML = shown.map((v, i) => `<tr><td>${esc(v.registration_number)}</td><td>${esc(v.full_name)}</td><td>${esc(v.business_name)}</td><td>${esc(v.category)}</td><td>${esc(v.phone)}</td><td>${v.number_of_stalls}</td><td>${naira(v.total_amount)}</td><td>${fmtD(v.created_at)}</td><td><button class="green" data-v="${i}">VIEW</button><button class="gold" data-p="${i}">PRINT</button></td></tr>`).join('') || '<tr><td colspan="9">No vendors found.</td></tr>';
}
['q', 'fc', 'fd'].forEach(id => $(id).addEventListener('input', render));
let cur = null;
document.querySelector('#tbl tbody').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.p !== undefined) return printDoc(shown[b.dataset.p]);
  cur = shown[b.dataset.v]; $('mdoc').innerHTML = docHTML(cur); $('modal').hidden = false;
};
$('mclose').onclick = () => $('modal').hidden = true;
$('mprint').onclick = () => printDoc(cur);
$('exp').onclick = () => {
  const H = ['Registration Number','Full Name','Business Name','Contact Person','Phone','WhatsApp','Email','Business Address','City','State','Category','Product/Service','Description','Number of Stalls','Total Amount','Participation Dates','Registration Date'];
  const cell = s => { s = String(s ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const rows = all.map(v => [v.registration_number, v.full_name, v.business_name, v.contact_person, v.phone, v.whatsapp, v.email, v.business_address, v.city, v.state, v.category, v.product_service, v.description, v.number_of_stalls, v.total_amount, (v.participation_dates || []).join('; '), new Date(v.created_at).toLocaleString('en-GB')]);
  const csv = '\ufeff' + [H, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'aap-trade-fair-vendors.csv'; a.click();
};
init();
