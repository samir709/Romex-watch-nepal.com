(function(){
  const cfg=window.ROMEX_CONFIG||{};
  const ready=Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY &&
    !cfg.SUPABASE_URL.includes('YOUR-PROJECT') && !cfg.SUPABASE_PUBLISHABLE_KEY.includes('YOUR_'));
  window.RomexCloud={
    ready,cfg,
    client: ready && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY):null,
    async session(){if(!this.client)return null;const {data}=await this.client.auth.getSession();return data.session||null},
    async user(){const s=await this.session();return s?.user||null},
    async function(name,body){if(!this.ready)throw new Error('ROMEX database is not configured. Add Supabase values to assets/js/config.js.');const {data,error}=await this.client.functions.invoke(name,{body});if(error)throw error;return data}
  };
})();
