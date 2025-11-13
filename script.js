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
    function tick(){
      const now = new Date();
      const diff = target - now;
      const spans = el.querySelectorAll('span');
      if(diff <=0){
        spans.forEach(s=>s.textContent='00');
        return;
      }
      const days = Math.floor(diff/86400000);
      const hours = Math.floor((diff%86400000)/3600000);
      const minutes = Math.floor((diff%3600000)/60000);
      const seconds = Math.floor((diff%60000)/1000);
      spans[0].textContent = String(days).padStart(2,'0')+'d';
      spans[1].textContent = String(hours).padStart(2,'0')+'h';
      spans[2].textContent = String(minutes).padStart(2,'0')+'m';
      spans[3].textContent = String(seconds).padStart(2,'0')+'s';
    }
    tick();
    setInterval(tick,1000);
  }
  document.querySelectorAll('.countdown').forEach(startCountdown);

  // Add to calendar
  function buildICS({title,start,end,description,location}){
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PV Wedding//EN',
      'BEGIN:VEVENT',
      'UID:'+crypto.randomUUID(),
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

  // RSVP embed
  const tallyFrame = document.getElementById('tallyFrame');
  if(tallyFrame){
    const TALLY_BASE = "https://tally.so/r/me4zkO";
    const DISPLAY_PARAMS = "transparentBackground=1&hideTitle=1";
    const qs = window.location.search.replace(/^\\?/,'');
    const glue = (qs && DISPLAY_PARAMS) ? '&' : '';
    const url = TALLY_BASE + (qs ? ('?' + qs) : '') + (DISPLAY_PARAMS ? ((qs ? glue : '?') + DISPLAY_PARAMS) : '');
    tallyFrame.src = url;
  }

  const stickyButton = document.querySelector('[data-sticky-rsvp]');
  if(stickyButton){
    stickyButton.addEventListener('click', ()=>{
      const rsvpSection = document.querySelector('#garre-rsvp');
      if(rsvpSection){
        rsvpSection.scrollIntoView({behavior:'smooth'});
      }
    });
  }
})();
