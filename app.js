'use strict';
(() => {
 const cards = [...document.querySelectorAll('.project')];
 const filters = [...document.querySelectorAll('[data-filter]')];
 const count = document.querySelector('#project-count');
 function filterProjects(value) {
  let shown=0;
  cards.forEach(card => { card.hidden=value!=='All' && card.dataset.category!==value; if(!card.hidden) shown++; });
  filters.forEach(button=>{const active=button.dataset.filter===value;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  count.textContent=value==='All'?`Showing all ${shown}`:`Showing ${shown} of ${cards.length}`;
 }
 document.querySelector('.filters').hidden=false;
 filters.forEach(button=>button.addEventListener('click',()=>filterProjects(button.dataset.filter)));
 function revealProject(hash) {
  const target=document.getElementById(hash.replace(/^#/,''));
  if(target?.classList.contains('project')) {filterProjects('All');target.querySelector('details').open=true;target.scrollIntoView({block:'start'});}
 }
 window.addEventListener('hashchange',()=>revealProject(location.hash));
 if(location.hash) revealProject(location.hash);
 const dialog=document.querySelector('#search-dialog');
 const input=document.querySelector('#site-search');
 const results=document.querySelector('#search-results');
 const searchButton=document.querySelector('.search-toggle');
 const sections=[['About','#about','Background and focus'],['Work experience','#experience','AWS, Citibank, UNC Charlotte, Jio'],['Projects','#work','Independent engineering projects'],['Skills','#skills','Tools and implementation evidence'],['Research and publications','#research','Manufacturing education and computer vision'],['Education and certifications','#background','UNC Charlotte and professional credentials'],['Contact','#contact','Email, LinkedIn, GitHub'],['Download résumé','Yasaswi-Bhumireddy-AI-Engineer.pdf','Original one-page résumé']];
 const entries=sections.map(([title,href,description])=>({title,href,description,search:href.startsWith('#')?document.querySelector(href)?.textContent:''})).concat(cards.map(card=>({title:card.querySelector('h3').textContent,href:'#'+card.id,description:card.querySelector('.project-summary').textContent,search:card.textContent})));
 function search(){
  const query=input.value.trim().toLowerCase();results.replaceChildren();
  const matches=entries.filter(e=>(e.title+' '+e.description+' '+(e.search||'')).toLowerCase().includes(query));
  for(const entry of matches){const a=document.createElement('a');a.href=entry.href;a.textContent=entry.title;const small=document.createElement('small');small.textContent=entry.description;a.append(small);a.addEventListener('click',()=>{dialog.close();if(entry.href.startsWith('#')){revealProject(entry.href);const target=document.querySelector(entry.href);if(target){target.tabIndex=-1;target.focus({preventScroll:true});}}});results.append(a);}
  if(!matches.length){const p=document.createElement('p');p.textContent='No match. Try agents, retrieval, Python, or research.';results.append(p);}
 }
 function openSearch(){dialog.showModal();input.value='';search();input.focus();}
 if(typeof dialog.showModal==='function'){searchButton.hidden=false;searchButton.addEventListener('click',openSearch);}
 document.querySelector('#close-search').addEventListener('click',()=>dialog.close());
 input.addEventListener('input',search);
 document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,[contenteditable="true"]')&&!dialog.open&&typeof dialog.showModal==='function'){event.preventDefault();openSearch();}});
 const copy=document.querySelector('#copy-email');
 if(navigator.clipboard&&window.isSecureContext){copy.hidden=false;copy.addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('yasaswireddy7032@gmail.com');status.textContent='Email address copied.';}catch{status.textContent='Copy unavailable. You can select the email address above.';}});}
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(items=>{for(const item of items){if(item.isIntersecting){document.querySelectorAll('.navlinks a').forEach(a=>{if(a.hash==='#'+item.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}}},{rootMargin:'-20% 0px -60% 0px',threshold:0});document.querySelectorAll('section[id],#background').forEach(s=>observer.observe(s));}
})();
