(function(){
  // Countdown timers
  function startCountdown(el){
    const targetAttr = el.dataset.countdown;
    if(!targetAttr){
      return;
    }
    const target = new Date(targetAttr);
    if(Number.isNaN(target.getTime())){
      return;
    }
    const spans = el.querySelectorAll('span');
    if(!spans.length){
      return;
    }
    let timerId;
    const zeroValues = ['00d','00h','00m'];
    function tick(){
      const now = new Date();
      const diff = target - now;
      if(diff <= 0){
        spans.forEach((s,idx)=>{ s.textContent = zeroValues[idx] || '00'; });
        if(timerId){
          clearInterval(timerId);
        }
        return;
      }
      const days = Math.floor(diff/86400000);
      const hours = Math.floor((diff%86400000)/3600000);
      const minutes = Math.floor((diff%3600000)/60000);
      spans[0].textContent = String(days).padStart(2,'0')+'d';
      spans[1].textContent = String(hours).padStart(2,'0')+'h';
      spans[2].textContent = String(minutes).padStart(2,'0')+'m';
    }
    tick();
    timerId = setInterval(tick,1000);
  }
  document.querySelectorAll('.countdown').forEach(startCountdown);

  // Add to calendar
  function buildICS({title,start,end,description,location}){
    const uid = (typeof crypto === 'object' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : 'pv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PV Wedding//EN',
      'BEGIN:VEVENT',
      'UID:'+uid,
      'DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z',
      'DTSTART:'+start,
      'DTEND:'+end,
      'SUMMARY:'+title,
      'DESCRIPTION:'+description,
      'LOCATION:'+location,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\\r\\n');
  }
  function downloadICS(data){
    const blob = new Blob([data],{type:'text/calendar'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pv-wedding.ics';
    link.click();
    URL.revokeObjectURL(url);
  }
  document.querySelectorAll('[data-ics]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const data = buildICS({
        title:btn.dataset.title,
        start:btn.dataset.start,
        end:btn.dataset.end,
        description:btn.dataset.description || '',
        location:btn.dataset.location || ''
      });
      downloadICS(data);
    });
  });

  // RSVP embed + envelope modal
  const TALLY_BASE = "https://tally.so/r/me4zkO";
  const DISPLAY_PARAMS = "transparentBackground=1&hideTitle=1&hideBranding=1&hideFooter=1";
  const qs = window.location.search.replace(/^\\?/,'');
  const tallyGlue = (qs && DISPLAY_PARAMS) ? '&' : '';
  const tallyUrl = TALLY_BASE + (qs ? ('?' + qs) : '') + (DISPLAY_PARAMS ? ((qs ? tallyGlue : '?') + DISPLAY_PARAMS) : '');

  function ensureHideBranding(){
    let attempts = 0;
    const maxAttempts = 10;
    const styleId = 'hide-tally-branding';
    const inject = ()=>{
      let style = document.getElementById(styleId);
      if(!style){
        style = document.createElement('style');
        style.id = styleId;
        style.textContent = '.tally-powered,[data-sentry-element="ContentV2"]{display:none !important;}';
        document.head.appendChild(style);
      }
      document.querySelectorAll('.tally-powered,[data-sentry-element="ContentV2"]').forEach(el=>{
        el.style.setProperty('display','none','important');
      });
      attempts += 1;
      if(attempts < maxAttempts){
        setTimeout(inject, 250);
      }
    };
    inject();
  }

  document.querySelectorAll('[data-tally-frame]').forEach(frame=>{
    if(!frame.src){
      frame.src = tallyUrl;
      frame.dataset.ready = '1';
    }
  });
  ensureHideBranding();

  const rsvpModal = document.getElementById('rsvpModal');
  const envelopeShell = rsvpModal?.querySelector('.envelope-shell');
  const modalClose = rsvpModal?.querySelector('[data-modal-close]');
  const modalOverlay = rsvpModal?.querySelector('[data-modal-overlay]');
  const rsvpOpeners = document.querySelectorAll('[data-open-rsvp]');
  const fallbackSection = document.querySelector('#garre-rsvp');
  let lastFocused;

  function scrollToFallback(){
    if(fallbackSection){
      fallbackSection.scrollIntoView({behavior:'smooth'});
    }
  }

  function trapFocus(evt){
    if(evt.key !== 'Tab' || !rsvpModal?.classList.contains('is-visible')){
      return;
    }
    const focusable = rsvpModal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    const list = Array.from(focusable).filter(node=>!node.hasAttribute('disabled'));
    if(!list.length){
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    if(evt.shiftKey && document.activeElement === first){
      last.focus();
      evt.preventDefault();
    } else if(!evt.shiftKey && document.activeElement === last){
      first.focus();
      evt.preventDefault();
    }
  }

  function closeModal(){
    if(!rsvpModal){
      return;
    }
    rsvpModal.classList.remove('is-visible');
    rsvpModal.classList.remove('opacity-100');
    rsvpModal.classList.add('pointer-events-none','opacity-0');
    envelopeShell?.classList.remove('envelope-open');
    rsvpModal.setAttribute('aria-hidden','true');
    document.body.classList.remove('overflow-hidden');
    const onFadeOut = ()=>{
      rsvpModal.classList.add('hidden');
      if(lastFocused && typeof lastFocused.focus === 'function'){
        lastFocused.focus();
      }
    };
    rsvpModal.addEventListener('transitionend', onFadeOut, {once:true});
    window.removeEventListener('keydown', handleKeydown);
  }

  function handleKeydown(evt){
    if(evt.key === 'Escape'){
      closeModal();
    } else {
      trapFocus(evt);
    }
  }

  function openModal(evt){
    if(evt){
      evt.preventDefault();
    }
    if(!rsvpModal){
      scrollToFallback();
      return;
    }
    lastFocused = document.activeElement;
    rsvpModal.classList.remove('hidden','pointer-events-none','opacity-0');
    requestAnimationFrame(()=>{
      rsvpModal.classList.add('is-visible');
      rsvpModal.classList.add('opacity-100');
      envelopeShell?.classList.add('envelope-open');
    });
    document.body.classList.add('overflow-hidden');
    rsvpModal.setAttribute('aria-hidden','false');
    modalClose?.focus();
    window.addEventListener('keydown', handleKeydown);
  }

  rsvpOpeners.forEach(btn=>{
    btn.addEventListener('click', openModal);
  });

  if(modalClose){
    modalClose.addEventListener('click', closeModal);
  }
  if(modalOverlay){
    modalOverlay.addEventListener('click', closeModal);
  }
  if(rsvpModal){
    rsvpModal.addEventListener('click', (evt)=>{
      const isInsideEnvelope = envelopeShell && envelopeShell.contains(evt.target);
      if(!isInsideEnvelope){
        closeModal();
      }
    });
  }
})();
