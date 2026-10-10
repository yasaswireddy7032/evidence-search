'use strict';
(async()=>{
 const grid=document.querySelector('#projects-grid'), count=document.querySelector('#project-count');
 try{
  const response=await fetch('projects.json');if(!response.ok)throw new Error('Project collection unavailable');
  const projects=await response.json();
  const render=(filter)=>{
   const selected=projects.filter(p=>filter==='All'||p.category===filter||(filter==='AI systems'&&!['Machine learning','ML operations'].includes(p.category)));
   grid.replaceChildren();
   selected.forEach(p=>{
    const article=document.createElement('article');article.className='project';
    const top=document.createElement('div');top.className='project-top';
    const number=document.createElement('span');number.textContent=String(projects.indexOf(p)+1).padStart(2,'0');
    const category=document.createElement('span');category.textContent=p.category.toUpperCase();top.append(number,category);
    const title=document.createElement('h3');title.textContent=p.title;
    const description=document.createElement('p');description.textContent=p.summary;
    const link=document.createElement('a');link.href=`${p.slug}.html`;link.textContent='View project';link.setAttribute('aria-label',`View ${p.title}`);
    const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');link.append(arrow);
    article.append(top,title,description,link);grid.append(article);
   });count.textContent=`${selected.length} PROJECTS`;
  };render('All');
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
   document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});render(button.dataset.filter);
  }));
 }catch(error){grid.textContent='The project collection could not load. Please refresh the page.';count.textContent='';}
})();
