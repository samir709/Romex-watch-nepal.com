import { admin,cors,json,fail } from "../_shared.ts";
Deno.serve(async req=>{
 const pre=cors(req);if(pre)return pre;
 try{
  const {order_id}=await req.json();const {data:o,error}=await admin.from("orders").select("*").eq("id",order_id).single();if(error)throw error;
  const secret=Deno.env.get("KHALTI_SECRET_KEY")!;const base=Deno.env.get("KHALTI_API_BASE")||"https://dev.khalti.com/api/v2";
  const site=Deno.env.get("SITE_URL")||new URL(req.url).origin;
  const payload={return_url:`${site}/payment-return.html?gateway=khalti&order_id=${order_id}`,website_url:site,amount:Math.round(Number(o.total)*100),purchase_order_id:o.order_number,purchase_order_name:"ROMEX Watch Nepal",customer_info:{name:o.customer_name,email:o.customer_email,phone:o.customer_phone}};
  const res=await fetch(`${base}/epayment/initiate/`,{method:"POST",headers:{"Authorization":`Key ${secret}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await res.json();if(!res.ok)throw new Error(data.detail||data.error_key||"Khalti initiation failed");
  await admin.from("orders").update({payment_gateway:"khalti",payment_status:"initiated",provider_reference:data.pidx,updated_at:new Date().toISOString()}).eq("id",order_id);
  return json({payment_url:data.payment_url,pidx:data.pidx});
 }catch(e){return fail(e)}
});
