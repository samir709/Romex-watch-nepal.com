import { admin,cors,json,fail } from "../_shared.ts";
Deno.serve(async req=>{
 const pre=cors(req);if(pre)return pre;
 try{
  const {code,subtotal}=await req.json();
  const {data:p,error}=await admin.from("promotions").select("*").ilike("code",String(code||"")).eq("active",true).maybeSingle();
  if(error)throw error;
  if(!p)return json({ok:false,message:"Promo code not found."});
  const now=Date.now(),start=p.starts_at?new Date(p.starts_at).getTime():null,end=p.ends_at?new Date(p.ends_at).getTime():null;
  if((start&&now<start)||(end&&now>end))return json({ok:false,message:"Promo code is not active."});
  if(Number(subtotal)<Number(p.min_order))return json({ok:false,message:`Minimum order is Rs. ${Number(p.min_order).toLocaleString('en-NP')}.`});
  let discount=p.type==="percent"?Number(subtotal)*Number(p.value)/100:Number(p.value);
  if(p.max_discount!=null)discount=Math.min(discount,Number(p.max_discount));
  return json({ok:true,code:p.code,discount:Math.round(discount*100)/100});
 }catch(e){return fail(e)}
});
