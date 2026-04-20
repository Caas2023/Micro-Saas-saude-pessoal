fetch('https://micro-saas-saude-pessoal.vercel.app/')
  .then(r => r.text())
  .then(t => {
    const m = t.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if(m) {
      console.log('Script Hash na Vercel:', m[1]);
      return fetch('https://micro-saas-saude-pessoal.vercel.app' + m[1])
        .then(r => r.text())
        .then(js => console.log('Contains dummy:', js.includes('dummy.supabase.co')));
    } else {
      console.log("No js found in Vercel HTML");
    }
  });
