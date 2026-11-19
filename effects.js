'use strict';
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const menu=$('.menu-toggle'),nav=$('.navlinks');
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);menu.textContent=open?'Close':'Menu';});
 nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!$('#search-dialog').open)$('.search-toggle').click();}});
 $('#site-search').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();$('#search-results a')?.focus();}});
 $('#search-results').addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp'].includes(e.key))return;e.preventDefault();const links=$$('#search-results a'),i=links.indexOf(document.activeElement);links[(i+(e.key==='ArrowDown'?1:-1)+links.length)%links.length]?.focus();});
 const track=document.createElement('div');track.className='marquee-track';
 const projects=$$('.project');
 for(let copy=0;copy<2;copy++)for(const card of projects){const a=document.createElement('a');a.href='#'+card.id;a.textContent=card.querySelector('h3').textContent;if(copy){a.tabIndex=-1;a.setAttribute('aria-hidden','true');}track.append(a);}
 $('.focus-band').replaceChildren(track);
 const clock=document.createElement('p');clock.className='local-time';$('.contact-panel').append(clock);
 function updateClock(){clock.textContent=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}).format(new Date())+' in Herndon, Virginia';}updateClock();setInterval(updateClock,60000);
 let queued=false;
 function scrollState(){queued=false;const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;$('.scroll-progress').style.transform=`scaleX(${max?y/max:0})`;$('.site-header').classList.toggle('scrolled',y>20);$('.back-top').hidden=y<650;}
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(scrollState);}},{passive:true});scrollState();
 if(!reduced&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');observer.unobserve(e.target);}}),{threshold:.08});$$('.section h2,.timeline article,.skill-grid article,.publications article,.education,.contact-panel').forEach(el=>{el.classList.add('reveal-pending');observer.observe(el);});
 $$('.name-line>span').forEach((el,i)=>el.animate([{transform:'translateY(115%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:1100,delay:100+i*140,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));
 $$('.hero .eyebrow,.hero .intro,.hero .actions,.hero-links,.credentials').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'none'}],{duration:850,delay:350+i*90,fill:'backwards'}));
 }
 if(fine&&!reduced){$$('.project,.skill-grid article,.featured').forEach(el=>el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',e.clientX-r.left+'px');el.style.setProperty('--my',e.clientY-r.top+'px');}));const terminal=$('.terminal');terminal.addEventListener('pointermove',e=>{const r=terminal.getBoundingClientRect();terminal.style.transform=`perspective(900px) rotateX(${-(e.clientY-r.top-r.height/2)/50}deg) rotateY(${(e.clientX-r.left-r.width/2)/60}deg)`;});terminal.addEventListener('pointerleave',()=>terminal.style.transform='none');$$('.hero .button,.contact-panel .button').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.08}px,${(e.clientY-r.top-r.height/2)*.12}px)`;});el.addEventListener('pointerleave',()=>el.style.transform='none');});}
 if(!reduced){const lines=$$('.terminal-content a,.terminal-content p');const texts=lines.map(el=>el.textContent);lines.forEach(el=>el.style.visibility='hidden');let row=0;
 function typeLine(){if(row>=lines.length)return;const el=lines[row],text=texts[row++];el.style.visibility='visible';if(el.tagName==='P'){setTimeout(typeLine,160);return;}el.textContent='';el.classList.add('typing');let i=0;const timer=setInterval(()=>{el.textContent=text.slice(0,++i);if(i===text.length){clearInterval(timer);el.classList.remove('typing');setTimeout(typeLine,220);}},28);}setTimeout(typeLine,500);}
 // All backgrounds are procedural drawings; no portraits or remote graphics.
 const starCanvas=$('#starfield'),planetCanvas=$('#planet'),horizonCanvas=$('#horizon');
 const sc=starCanvas.getContext('2d'),pc=planetCanvas.getContext('2d'),hc=horizonCanvas.getContext('2d');
 if(!sc||!pc||!hc)return;
 let w=0,h=0,pw=0,ph=0,hw=0,hh=0,stars=[],visibleHero=true,visibleFooter=false;
 const golden=Math.PI*(3-Math.sqrt(5));const sphere=Array.from({length:1000},(_,i)=>{const y=1-2*i/999,r=Math.sqrt(1-y*y);return [Math.cos(i*golden)*r,y,Math.sin(i*golden)*r];});
 const ring=Array.from({length:650},(_,i)=>({a:i*golden,r:1.35+(Math.sin(i*97.13)+1)*.24}));
 function size(canvas){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);canvas.width=r.width*d;canvas.height=r.height*d;canvas.getContext('2d').setTransform(d,0,0,d,0,0);return [r.width,r.height];}
 function resize(){[w,h]=size(starCanvas);[pw,ph]=size(planetCanvas);[hw,hh]=size(horizonCanvas);stars=Array.from({length:Math.min(220,Math.floor(w*h/6000))},(_,i)=>({x:(Math.sin(i*127.1)*.5+.5)*w,y:(Math.cos(i*311.7)*.5+.5)*h,r:.5+(i%4)*.28,phase:i*2.3}));}resize();addEventListener('resize',resize,{passive:true});
 if('IntersectionObserver' in window){new IntersectionObserver(es=>es.forEach(e=>visibleHero=e.isIntersecting)).observe($('#home'));new IntersectionObserver(es=>es.forEach(e=>visibleFooter=e.isIntersecting)).observe($('.closing'));}
 function planet(t){pc.clearRect(0,0,pw,ph);const R=Math.min(pw*.255,ph*.3),cx=pw*.53,cy=ph*.42,angle=t*.00008;const glow=pc.createRadialGradient(cx-R*.4,cy-R*.4,0,cx,cy,R*1.65);glow.addColorStop(0,'#b5884933');glow.addColorStop(1,'#b5884900');pc.fillStyle=glow;pc.fillRect(0,0,pw,ph);
 function ringHalf(front){pc.fillStyle='#bd9657';for(const p of ring){const a=p.a+angle,x=Math.cos(a)*R*p.r,y=Math.sin(a)*R*p.r*.28,z=Math.sin(a);if((z>=0)!==front)continue;pc.globalAlpha=.13+.23*(Math.sin(p.a*19)+1)/2;pc.beginPath();pc.arc(cx+x,cy+y-x*.22,.7,0,Math.PI*2);pc.fill();}pc.globalAlpha=1;}
 ringHalf(false);pc.fillStyle='#11100d';pc.beginPath();pc.arc(cx,cy,R,0,Math.PI*2);pc.fill();for(const [x,y,z] of sphere){const xx=x*Math.cos(angle)+z*Math.sin(angle),zz=z*Math.cos(angle)-x*Math.sin(angle);if(zz<0)continue;const light=Math.max(.06,(-xx*.55-y*.5+zz*.6));pc.globalAlpha=.12+light*.75;pc.fillStyle='#d5b67f';pc.beginPath();pc.arc(cx+xx*R,cy+y*R,Math.max(.5,1.55*zz),0,Math.PI*2);pc.fill();}pc.globalAlpha=1;ringHalf(true);const ma=angle*1.5+.5,mx=cx+Math.cos(ma)*R*1.7,my=cy+Math.sin(ma)*R*.55;pc.fillStyle='#bfa576';pc.beginPath();pc.arc(mx,my,5,0,Math.PI*2);pc.fill();}
 function horizon(t){hc.clearRect(0,0,hw,hh);const cy=hh+hw*.35,r=hw*.72;const g=hc.createRadialGradient(hw/2,cy,r*.75,hw/2,cy,r*1.1);g.addColorStop(0,'#c8874a00');g.addColorStop(.85,'#c8874a17');g.addColorStop(1,'#c8874a00');hc.fillStyle=g;hc.fillRect(0,0,hw,hh);for(let i=0;i<1300;i++){const a=i*golden+t*.000015,v=Math.sqrt(i/1300),x=hw/2+Math.cos(a)*r*v,y=cy-Math.sqrt(Math.max(0,r*r-(x-hw/2)**2))+(Math.sin(a)*.5+.5)*hh;if(y>hh)continue;hc.globalAlpha=.1+.4*(1-y/hh);hc.fillStyle='#d0a16d';hc.fillRect(x,y,1.2,1.2);}hc.globalAlpha=1;}
 let last=0;function frame(t){if(!document.hidden&&t-last>32){last=t;sc.clearRect(0,0,w,h);for(const s of stars){sc.globalAlpha=reduced?.35:.2+.25*(Math.sin(t*.00065+s.phase)+1)/2;sc.fillStyle='#d9c7a7';sc.beginPath();sc.arc(s.x,(s.y-scrollY*.025%h+h)%h,s.r,0,Math.PI*2);sc.fill();}sc.globalAlpha=1;if(visibleHero)planet(reduced?0:t);if(visibleFooter)horizon(reduced?0:t);}if(!reduced)requestAnimationFrame(frame);}frame(100);if(reduced){planet(0);horizon(0);addEventListener('resize',()=>{frame(100);planet(0);horizon(0);});}
})();
