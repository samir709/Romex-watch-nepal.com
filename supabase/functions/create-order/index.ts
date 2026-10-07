import { admin,cors,json,fail } from "../_shared.ts";
Deno.serve(async req=>{
  const pre=cors(req); if(pre)return pre;
  try{
    const body=await req.json();
    const {data,error}=await admin.rpc("create_order_secure",{p_customer:body.customer,p_items:body.items,p_promo_code:body.promo_code||null});
    if(error)throw error;
    return json(data);
  }catch(e){return fail(e)}
});
