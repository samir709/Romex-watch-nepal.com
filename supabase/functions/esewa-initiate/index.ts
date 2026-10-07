import { admin,cors,json,fail } from "../_shared.ts";
async function hmac(message:string,secret:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message));return btoa(String.fromCharCode(...new Uint8Array(sig)));}
Deno.serve(async req=>{
 const pre=cors(req);if(pre)return pre;
 try{
  const {order_id}=await req.json();
  const {data:o,error}=await admin.from("orders").select("*").eq("id",order_id).single();if(error)throw error;
  if(o.payment_status==="paid")return fail(new Error("Order is already paid"));
  const secret=Deno.env.get("ESEWA_SECRET_KEY")!,code=Deno.env.get("ESEWA_PRODUCT_CODE")||"EPAYTEST";
  const site=Deno.env.get("SITE_URL")||new URL(req.url).origin;
  const transaction_uuid=o.order_number;
  const total=Number(o.total).toFixed(2).replace(/\.00$/,'');
  const signed="total_amount,transaction_uuid,product_code";
  const signature=await hmac(`total_amount=${total},transaction_uuid=${transaction_uuid},product_code=${code}`,secret);
  await admin.from("orders").update({payment_gateway:"esewa",payment_status:"initiated",provider_reference:transaction_uuid,updated_at:new Date().toISOString()}).eq("id",order_id);
  return json({action:Deno.env.get("ESEWA_URL")||"https://rc-epay.esewa.com.np/api/epay/main/v2/form",fields:{amount:total,tax_amount:"0",total_amount:total,transaction_uuid,product_code:code,product_service_charge:"0",product_delivery_charge:"0",success_url:`${site}/payment-return.html?gateway=esewa&order_id=${order_id}`,failure_url:`${site}/payment-return.html?gateway=esewa&order_id=${order_id}`,signed_field_names:signed,signature}});
 }catch(e){return fail(e)}
});
