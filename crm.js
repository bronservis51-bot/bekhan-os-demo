'use strict';

// The qualification model follows bron-franchise/src/modules/leads/pipeline.ts.
// This prototype keeps its own synthetic records and browser-local persistence.
const CRM_COLUMNS = [
  {id:'000',title:'Изучают'},
  {id:'010',title:'Есть помещение'},
  {id:'001',title:'Хотят сейчас'},
  {id:'100',title:'Есть деньги'},
  {id:'011',title:'Помещение + сейчас'},
  {id:'110',title:'Деньги + помещение'},
  {id:'101',title:'Деньги + сейчас'},
  {id:'111',title:'Готовы к открытию'},
  {id:'in_work',title:'В работе'},
  {id:'won',title:'Договор'},
  {id:'lost',title:'Отказ'}
];
const LEAD_STATUSES = {new:'Новая',in_work:'В работе',call_back:'Перезвонить',meeting:'Встреча',won:'Договор',lost:'Отказ'};
const LEAD_FIXTURES = {
  d1:{funding:'partial',place:'help',timing:'research',created_at:'2026-11-10T09:00:00+03:00'},
  d2:{funding:'partial',place:'help',timing:'month',created_at:'2026-11-11T11:00:00+03:00'},
  d3:{funding:'full',place:'options',timing:'quarter',created_at:'2026-11-09T10:00:00+03:00'},
  d4:{funding:'full',place:'has',timing:'quarter',created_at:'2026-11-10T14:00:00+03:00'},
  d5:{funding:'full',place:'help',timing:'month',created_at:'2026-11-08T13:00:00+03:00'},
  d6:{funding:'full',place:'has',timing:'month',created_at:'2026-11-06T12:00:00+03:00'},
  d7:{funding:'full',place:'has',timing:'month',created_at:'2026-11-10T15:00:00+03:00'},
  d8:{funding:'none',place:'help',timing:'research',created_at:'2026-11-04T12:00:00+03:00'},
  d9:{funding:'partial',place:'options',timing:'quarter',created_at:'2026-11-05T12:00:00+03:00'}
};
const leadNow = () => `${TODAY}T12:00:00+03:00`;
const leadReadiness = lead => ({money:lead.funding==='full',place:lead.place==='has',now:lead.timing==='month'});
const leadReadinessKey = lead => {const f=leadReadiness(lead);return `${Number(f.money)}${Number(f.place)}${Number(f.now)}`;};
const isReadinessColumn = column => /^[01]{3}$/.test(column);
function leadColumn(lead){
  if(lead.status==='new')return isReadinessColumn(lead.pipeline_column)?lead.pipeline_column:leadReadinessKey(lead);
  return lead.status==='won'||lead.status==='lost'?lead.status:'in_work';
}
function leadLabel(lead){return lead.status==='call_back'||lead.status==='meeting'?LEAD_STATUSES[lead.status]:CRM_COLUMNS.find(c=>c.id===leadColumn(lead))?.title||'Изучают';}
const leadLive = lead => !lead.deleted_at;
const liveLeads = () => data.deals.filter(leadLive);
const paidLeads = () => liveLeads().filter(d=>d.paid);
const activeLeads = () => liveLeads().filter(d=>!['won','lost'].includes(d.status));
function normalizeLead(lead){
  const fixture=LEAD_FIXTURES[lead.id]||{};
  const previousStage=Number(lead.stage)||0;
  return {
    ...fixture,...lead,
    status:LEAD_STATUSES[lead.status]?lead.status:previousStage===5?'lost':previousStage>=3?'won':previousStage===2?'in_work':'new',
    funding:lead.funding??fixture.funding??'',place:lead.place??fixture.place??'',timing:lead.timing??fixture.timing??'',
    instagram:typeof lead.instagram==='string'&&/^[A-Za-z0-9_.]{1,30}$/.test(lead.instagram)?lead.instagram:'',
    phone:typeof lead.phone==='string'?lead.phone:'',
    note:typeof lead.note==='string'?lead.note:lead.next||lead.doubt||'',
    paid:typeof lead.paid==='boolean'?lead.paid:previousStage===4,
    created_at:lead.created_at||fixture.created_at||leadNow(),
    updated_at:lead.updated_at||lead.created_at||fixture.created_at||leadNow(),
    deleted_at:lead.deleted_at||null,
    history:Array.isArray(lead.history)?lead.history:[],crm_schema:2
  };
}
function parseLeadContact(value){
  const name=String(value).trim();
  const profile=/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{1,30})\/?(?:[?#].*)?$/i.exec(name);
  const candidate=profile?.[1]||(name.startsWith('@')?name.slice(1):/^[A-Za-z0-9_][A-Za-z0-9_.]{0,29}$/.test(name)?name:'');
  const instagram=/^[A-Za-z0-9_.]{1,30}$/.test(candidate)?candidate:'';
  return {name:instagram?`@${instagram}`:name,instagram};
}
function leadPhoneDigits(value){return String(value||'').replace(/\D/g,'').replace(/^8(?=\d{10}$)/,'7');}
function leadDate(value){const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'}):'Дата не указана';}
function leadFactors(lead){const column=leadColumn(lead);return isReadinessColumn(column)?{money:column[0]==='1',place:column[1]==='1',now:column[2]==='1'}:leadReadiness(lead);}
function renderLeadFactors(value){return `<div class="lead-factors">${[['money','Деньги','wallet'],['place','Помещение','store'],['now','Сейчас','clock']].map(([key,title,ico])=>`<span class="${value[key]?'yes':'no'}" title="${title}: ${value[key]?'да':'не подтверждено'}">${icon(ico,12)}${title}${value[key]?icon('check',11):''}<span class="screen-reader">: ${value[key]?'да':'не подтверждено'}</span></span>`).join('')}</div>`;}
function leadOptions(value,{auto=true}={}){return `${auto?`<option value="auto" ${value==='auto'?'selected':''}>По анкете — автоматически</option>`:''}${[...CRM_COLUMNS,{id:'call_back',title:'Перезвонить'},{id:'meeting',title:'Встреча'}].map(c=>`<option value="${c.id}" ${value===c.id?'selected':''}>${c.title}</option>`).join('')}`;}
const leadStageValue = lead => ['call_back','meeting'].includes(lead.status)?lead.status:leadColumn(lead);
function groupedLeads(){
  const query=view.dealQuery.trim().toLocaleLowerCase('ru');
  const digits=query.replace(/\D/g,'');
  const phoneQuery=digits.length>=3&&/^[\d\s+()-]+$/.test(query);
  const groups=new Map(CRM_COLUMNS.map(c=>[c.id,[]]));
  for(const lead of liveLeads()){
    if(view.onlyNew&&lead.status!=='new'||view.source!=='Все источники'&&lead.source!==view.source)continue;
    const text=`${lead.name} ${lead.instagram} ${lead.city||''} ${lead.phone}`.toLocaleLowerCase('ru');
    if(query&&!text.includes(query)&&!(phoneQuery&&leadPhoneDigits(lead.phone).includes(digits)))continue;
    groups.get(leadColumn(lead)).push(lead);
  }
  for(const leads of groups.values())leads.sort((a,b)=>b.created_at.localeCompare(a.created_at)||a.id.localeCompare(b.id));
  return groups;
}
function renderLeadTile(lead){
  const phone=leadPhoneDigits(lead.phone);
  return `<article class="lead-tile" draggable="true" data-id="${esc(lead.id)}" aria-label="Заявка: ${esc(lead.name)}"><div class="lead-tile-top"><span>${esc(lead.city||'Город не указан')}</span><span class="lead-grip" title="Перетащить карточку">${icon('menu',14)}</span></div><button type="button" class="lead-open" data-action="deal" data-id="${esc(lead.id)}"><strong>${esc(lead.name)}</strong>${icon('arrow',16)}</button>${renderLeadFactors(leadFactors(lead))}<div class="lead-tile-foot">${lead.instagram?`<a href="https://www.instagram.com/${encodeURIComponent(lead.instagram)}/" target="_blank" rel="noopener noreferrer">${icon('brand',13)}Открыть профиль</a>`:''}${phone?`<a href="tel:+${phone}">${icon('phone',13)}${esc(lead.phone)}</a>`:''}<span>${leadDate(lead.created_at)}</span></div>${lead.note?`<p class="lead-note">${esc(lead.note)}</p>`:''}${['call_back','meeting'].includes(lead.status)?`<div style="margin-top:9px">${pill(LEAD_STATUSES[lead.status],'orange')}</div>`:''}<label class="screen-reader" for="lead-stage-${esc(lead.id)}">Переместить заявку ${esc(lead.name)}</label><select class="lead-stage-select" id="lead-stage-${esc(lead.id)}" data-lead-move="${esc(lead.id)}">${leadOptions(leadStageValue(lead))}</select></article>`;
}
function renderLeadBoard(groups=groupedLeads()){
  return CRM_COLUMNS.map(column=>`<section class="pipeline-column ${column.id==='111'?'ready':''} stage-${column.id}" data-lead-column="${column.id}" id="lead-column-${column.id}" aria-labelledby="lead-heading-${column.id}"><header class="pipeline-column-head"><div><h2 id="lead-heading-${column.id}">${column.title}</h2><span class="pipeline-count">${groups.get(column.id).length}</span><button type="button" class="lead-add-column" data-action="add-deal" data-column="${column.id}" aria-label="Добавить заявку: ${column.title}">${icon('plus',16)}</button></div>${isReadinessColumn(column.id)?renderLeadFactors({money:column.id[0]==='1',place:column.id[1]==='1',now:column.id[2]==='1'}):'<span class="lead-column-spacer"></span>'}</header><div class="pipeline-cards">${groups.get(column.id).map(renderLeadTile).join('')||'<div class="pipeline-empty">Нет заявок</div>'}</div></section>`).join('');
}
function renderLeads(){
  const trash=!!view.crmTrash,groups=groupedLeads();
  const removed=data.deals.filter(d=>d.deleted_at).sort((a,b)=>b.deleted_at.localeCompare(a.deleted_at));
  const actions=btn(trash?'К заявкам':'Корзина','lead-trash',trash?'arrow':'trash')+btn('<span class="screen-reader">Обновить заявки</span>','lead-refresh','reset','', 'aria-label="Обновить заявки" title="Обновить заявки"')+(!trash?btn('Добавить','add-deal','plus','primary'):'');
  const header=head(trash?'Корзина заявок':'Заявки',trash?'Удалённые заявки можно вернуть в прежнюю колонку.':'Готовность к открытию: деньги, помещение и срок.',actions,'Франшизная CRM');
  if(trash)return `<div class="leads-workspace">${header}<div class="lead-trash-list">${removed.map(lead=>`<article class="card lead-trash-item"><div><h2>${esc(lead.name)}</h2><p class="muted small">Удалена ${leadDate(lead.deleted_at)}</p>${lead.note?`<p class="lead-note">${esc(lead.note)}</p>`:''}</div>${btn('Восстановить','lead-restore','reset','small',`data-id="${esc(lead.id)}"`)}</article>`).join('')||'<div class="card empty">В корзине нет заявок.</div>'}</div></div>`;
  const count=[...groups.values()].reduce((sum,items)=>sum+items.length,0);
  return `<div class="leads-workspace">${header}<div class="pipeline-tools"><label class="pipeline-search">${icon('search',18)}<input id="deal-search" aria-label="Поиск заявок" placeholder="Instagram, имя, город, телефон" value="${esc(view.dealQuery)}" autocomplete="off"></label><label class="lead-only-new"><input id="lead-only-new" type="checkbox" ${view.onlyNew?'checked':''}>Только новые</label><div class="pipeline-jump"><select id="lead-jump" aria-label="Перейти к колонке"><option value="" disabled selected>К колонке…</option>${CRM_COLUMNS.map(c=>`<option value="${c.id}">${c.title} (${groups.get(c.id).length})</option>`).join('')}</select></div></div>${view.source!=='Все источники'?`<div class="lead-active-filter">${btn(`Источник: ${esc(view.source)} ×`,'lead-clear-source','','small')}</div>`:''}<p class="lead-filter-empty muted small" id="lead-filter-empty" ${count?'hidden':''}>По выбранным условиям заявок нет.</p><div class="pipeline-board" id="lead-board" role="region" aria-label="Канбан заявок. Прокручивается горизонтально" tabindex="0">${renderLeadBoard(groups)}</div><p class="pipeline-help">Перетаскивайте карточки или выбирайте колонку внизу заявки. В прототипе используются демонстрационные записи; новые анкеты с сайта не загружаются.</p></div>`;
}
function refreshLeadBoard(){
  const board=document.getElementById('lead-board');if(!board)return;
  const groups=groupedLeads();board.innerHTML=renderLeadBoard(groups);
  const empty=document.getElementById('lead-filter-empty');if(empty)empty.hidden=[...groups.values()].some(items=>items.length);
  const select=document.getElementById('lead-jump');if(select)select.innerHTML='<option value="" disabled selected>К колонке…</option>'+CRM_COLUMNS.map(c=>`<option value="${c.id}">${c.title} (${groups.get(c.id).length})</option>`).join('');
}
function jumpLeadColumn(id){const board=document.getElementById('lead-board'),column=document.getElementById(`lead-column-${id}`);if(board&&column)board.scrollTo({left:column.offsetLeft,behavior:'instant'});}
function applyLeadColumn(lead,column){
  if(column==='auto'){lead.status='new';lead.pipeline_column=null;}
  else if(isReadinessColumn(column)){lead.status='new';lead.pipeline_column=column;}
  else if(['in_work','call_back','meeting','won','lost'].includes(column)){lead.status=column;lead.pipeline_column=null;}
  else return false;
  lead.stage=lead.status==='won'?(lead.paid?4:3):lead.status==='lost'?5:lead.status==='new'?0:2;
  lead.updated_at=leadNow();return true;
}
function moveLead(id,column){
  const lead=data.deals.find(d=>d.id===id&&leadLive(d));if(!lead)return;
  const before=leadStageValue(lead);if(!applyLeadColumn(lead,column))return;
  if(before!==leadStageValue(lead))lead.history.push(`12 ноября · Колонка: ${leadLabel(lead)}`);
  const ok=save();render();requestAnimationFrame(()=>jumpLeadColumn(leadColumn(lead)));if(ok)toast('Заявка перемещена');
}
function leadFormState(form){return JSON.stringify([...new FormData(form)]);}
function leadFormDirty(){if(!document.getElementById('modal')?.open)return false;const form=document.querySelector('#modal form[data-form="lead"]');return !!form&&form.dataset.original!==leadFormState(form);}
function attemptCloseModal(){if(leadFormDirty()&&!window.confirm('Закрыть без сохранения изменений?'))return false;closeModal();return true;}
function openLeadEditor(id='',column='000'){
  const existing=data.deals.find(d=>d.id===id&&leadLive(d));
  if(id&&!existing){toast('Заявка находится в корзине или недоступна');return;}
  const lead=existing||normalizeLead({id:'',name:'',phone:'',city:'',budget:0,note:'',history:[],source:'',content:'',due:'',next:'',doubt:''});
  const selected=existing?leadStageValue(lead):column;
  const contact=lead.instagram?`@${lead.instagram}`:lead.name;
  const phone=leadPhoneDigits(lead.phone);
  const phoneLinks=phone?`<div class="actions lead-contact-actions"><a class="btn small" href="tel:+${phone}">${icon('phone',14)}Позвонить</a><a class="btn small" href="https://wa.me/${phone}" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="btn small" href="https://t.me/+${phone}" target="_blank" rel="noopener noreferrer">Telegram</a></div>`:'';
  const primary=field('Instagram или имя *','lead_contact',contact,'text',true,'required maxlength="100" placeholder="@nik или имя" autocomplete="off" autocapitalize="none" spellcheck="false"')+(lead.instagram?`<a class="lead-contact-link" href="https://www.instagram.com/${encodeURIComponent(lead.instagram)}/" target="_blank" rel="noopener noreferrer">${icon('brand',15)}Открыть Instagram</a>`:'')+phoneLinks+`<label class="field full">Колонка<select name="column">${leadOptions(selected,{auto:!!existing})}</select></label>`+textField('Заметка','note',lead.note,true,'placeholder="О чём договорились"');
  const extra=`<details class="lead-extra full-width"><summary>Дополнительно</summary><div class="form-grid">${field('Телефон','phone',lead.phone,'tel',false,'maxlength="30" placeholder="Необязательно"')}${field('Город','city',lead.city,'text',false,'maxlength="80" placeholder="Необязательно"')}${selectField('Деньги по анкете','funding',[['','Не подтверждено'],['full','Есть вся сумма'],['partial','Есть часть суммы'],['none','Пока нет суммы']],lead.funding)}${selectField('Помещение по анкете','place',[['','Не подтверждено'],['has','Есть место с потоком'],['options','Есть варианты'],['help','Нужна помощь с поиском']],lead.place)}${selectField('Срок открытия по анкете','timing',[['','Не подтверждено'],['month','В ближайший месяц'],['quarter','Через 1–3 месяца'],['half','Через 3–6 месяцев'],['research','Пока изучает']],lead.timing)}${field('Бюджет, ₽','budget',lead.budget||'','number',false,'min="0" max="1000000000" step="1000"')}${selectField('Источник','source',[['','По контакту'],['Ручной ввод','Ручной ввод'],['Instagram','Instagram'],['Сайт','Сайт'],['Рекомендация','Рекомендация']],lead.source)}${selectField('Связанный материал','content',[['','Без привязки'],...data.content.map(c=>[c.id,c.title])],lead.content||'')}${field('Следующий контакт','due',lead.due||'','date')}${field('Следующий шаг','next',lead.next||'','text',false,'maxlength="200"')}${textField('Сомнения / причина отказа','doubt',lead.doubt||'')}${textField('Добавить запись в историю','history','')}<label class="lead-only-new full-width"><input name="paid" type="checkbox" ${lead.paid?'checked':''}>Оплата получена</label><p class="sim-note full-width">Договор и оплата учитываются отдельно. Ручной выбор колонки задаёт готовность; пункт «По анкете — автоматически» использует три ответа выше.</p>${existing?`<p class="small muted full-width">Создана ${leadDate(lead.created_at)}</p>`:''}</div></details>`;
  const remove=existing?`<div class="lead-delete-area">${btn('Удалить заявку','lead-delete','trash','small danger',`data-id="${esc(id)}"`)}</div>`:'';
  openModal(existing?'Заявка':'Новая заявка','',form('lead',primary+extra,id,existing?'Сохранить':'Добавить')+remove+(existing&&lead.history.length?`<details class="lead-extra"><summary>История взаимодействий</summary><div class="history">${lead.history.map(h=>`<p>${esc(h)}</p>`).join('')}</div></details>`:''));
  const formElement=document.querySelector('#modal form[data-form="lead"]');if(formElement)formElement.dataset.original=leadFormState(formElement);
  document.querySelector('#modal [name="lead_contact"]')?.focus();
}
function saveLeadForm(form,values){
  const id=form.dataset.id,existing=data.deals.find(d=>d.id===id),parsed=parseLeadContact(values.lead_contact);
  if(!parsed.name){toast('Введите Instagram или имя');return;}
  if(values.lead_contact.trim().startsWith('@')&&!parsed.instagram){toast('Проверьте ник Instagram: до 30 букв, цифр, точек или подчёркиваний');return;}
  if(values.phone&&(!/^[+\d\s().-]+$/.test(values.phone)||leadPhoneDigits(values.phone).length<7||leadPhoneDigits(values.phone).length>15)){toast('Проверьте номер телефона или оставьте поле пустым');return;}
  const history=[...(existing?.history||[])];
  const record=normalizeLead({...existing,id:id||uid(),...parsed,phone:values.phone||'',city:values.city||'',note:values.note||'',funding:values.funding||'',place:values.place||'',timing:values.timing||'',budget:Number(values.budget)||0,source:values.source||(parsed.instagram?'Instagram':'Ручной ввод'),content:values.content||'',due:values.due||'',next:values.next||'',doubt:values.doubt||'',paid:values.paid==='on',history,created_at:existing?.created_at||leadNow(),updated_at:leadNow(),deleted_at:null});
  if(!applyLeadColumn(record,values.column)){toast('Выберите колонку');return;}
  if(existing&&leadStageValue(existing)!==leadStageValue(record))history.push(`12 ноября · Колонка: ${leadLabel(record)}`);
  if(values.history?.trim())history.push(`12 ноября · ${values.history.trim()}`);
  if(existing)Object.assign(existing,record);else data.deals.unshift(record);
  const ok=save();closeModal();view.dealQuery='';view.onlyNew=false;view.crmTrash=false;view.source='Все источники';render();requestAnimationFrame(()=>jumpLeadColumn(leadColumn(record)));if(ok)toast(existing?'Заявка сохранена':'Заявка добавлена');
}
function leadDeleteDialog(id){const lead=data.deals.find(d=>d.id===id);if(!lead)return;openModal('Удалить заявку?','',`<p><strong>${esc(lead.name)}</strong></p><p class="sim-note">Заявка исчезнет из канбана. Её можно восстановить через «Корзина». Несохранённые изменения не будут применены.</p><div class="form-actions">${btn('Назад','deal','','',`data-id="${esc(id)}"`)}${btn('Удалить','lead-delete-confirm','trash','primary',`data-id="${esc(id)}"`)}</div>`);}
function leadRestoreDialog(id){const lead=data.deals.find(d=>d.id===id);if(!lead)return;openModal('Восстановить заявку?','',`<p><strong>${esc(lead.name)}</strong></p><p class="sim-note">Заявка вернётся в колонку «${esc(leadLabel(lead))}».</p><div class="form-actions">${btn('Отмена','close')}${btn('Восстановить','lead-restore-confirm','reset','primary',`data-id="${esc(id)}"`)}</div>`);}
let draggedLeadId=null;
document.addEventListener('click',event=>{
  if(event.target.closest('a[href^="#/"]')&&leadFormDirty()&&!attemptCloseModal()){event.preventDefault();return;}
  const button=event.target.closest('[data-action]');if(!button)return;const id=button.dataset.id;
  switch(button.dataset.action){
    case 'lead-trash':view.crmTrash=!view.crmTrash;render();break;
    case 'lead-clear-source':view.source='Все источники';render();break;
    case 'lead-refresh':try{const stored=JSON.parse(localStorage.getItem(STORAGE));if(stored?.version===1&&Array.isArray(stored.deals))data.deals=stored.deals.map(normalizeLead);render();toast('Список обновлён из данных этого браузера');}catch{toast('Обновить список не удалось');}break;
    case 'lead-delete':leadDeleteDialog(id);break;
    case 'lead-restore':leadRestoreDialog(id);break;
    case 'lead-delete-confirm':{const lead=data.deals.find(d=>d.id===id);if(lead){lead.deleted_at=leadNow();const ok=save();closeModal();render();if(ok)toast('Заявка удалена. Её можно восстановить из корзины');}break;}
    case 'lead-restore-confirm':{const lead=data.deals.find(d=>d.id===id);if(lead){lead.deleted_at=null;const ok=save();closeModal();render();if(ok)toast('Заявка восстановлена');}break;}
  }
});
document.addEventListener('input',event=>{if(event.target.id==='deal-search'){view.dealQuery=event.target.value;refreshLeadBoard();}});
document.addEventListener('change',event=>{
  if(event.target.id==='lead-only-new'){view.onlyNew=event.target.checked;refreshLeadBoard();}
  if(event.target.id==='lead-jump'){jumpLeadColumn(event.target.value);event.target.value='';}
  if(event.target.dataset.leadMove)moveLead(event.target.dataset.leadMove,event.target.value);
});
document.addEventListener('dragstart',event=>{const tile=event.target.closest('.lead-tile');if(!tile)return;draggedLeadId=tile.dataset.id;event.dataTransfer.setData('text/plain',draggedLeadId);event.dataTransfer.effectAllowed='move';tile.classList.add('dragging');});
document.addEventListener('dragover',event=>{const column=event.target.closest('[data-lead-column]');if(!column||!draggedLeadId)return;event.preventDefault();event.dataTransfer.dropEffect='move';document.querySelectorAll('.pipeline-column.drag-over').forEach(c=>c.classList.remove('drag-over'));column.classList.add('drag-over');});
document.addEventListener('dragleave',event=>{const column=event.target.closest('[data-lead-column]');if(column&&!column.contains(event.relatedTarget))column.classList.remove('drag-over');});
document.addEventListener('drop',event=>{const column=event.target.closest('[data-lead-column]');if(!column||!draggedLeadId)return;event.preventDefault();const id=draggedLeadId;draggedLeadId=null;moveLead(id,column.dataset.leadColumn);});
document.addEventListener('dragend',()=>{draggedLeadId=null;document.querySelectorAll('.drag-over,.dragging').forEach(e=>e.classList.remove('drag-over','dragging'));});
window.addEventListener('beforeunload',event=>{if(leadFormDirty()){event.preventDefault();event.returnValue='';}});
window.addEventListener('hashchange',event=>{if(leadFormDirty()&&!window.confirm('Уйти без сохранения заявки?')){event.stopImmediatePropagation();history.replaceState(null,'',new URL(event.oldURL).hash);}});
document.addEventListener('DOMContentLoaded',()=>document.getElementById('modal')?.addEventListener('cancel',event=>{event.preventDefault();attemptCloseModal();}));
