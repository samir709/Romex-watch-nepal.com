import { admin,cors,json,fail } from "../_shared.ts";
async function hmac(message:string,secret:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message));return btoa(String.fromCharCode(...new Uint8Array(sig)));}
function eq(a:string,b:string){return a===b}
Deno.serve(async req=>{
 const pre=cors(req);if(pre)return pre;
 try{
  const {data}=await req.json();if(!data)throw new Error("Missing eSewa response data");
  const decoded=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data),c=>c.charCodeAt(0))));
  const {data:o,error}=await admin.from("orders").select("*").eq("order_number",decoded.transaction_uuid).single();if(error)throw error;
  const secret=Deno.env.get("ESEWA_SECRET_KEY")!,code=Deno.env.get("ESEWA_PRODUCT_CODE")||"EPAYTEST";
  const fields=decoded.signed_field_names.split(",");
  const message=fields.map((f:string)=>`${f}=${decoded[f]}`).join(",");
  const expected=await hmac(message,secret);
  if(!eq(expected,decoded.signature))throw new Error("Invalid eSewa signature");
  if(decoded.product_code!==code||Number(decoded.total_amount)!==Number(o.total))throw new Error("Payment amount or merchant code mismatch");
  const status=String(decoded.status||"").toUpperCase();
  if(status!=="COMPLETE"){await admin.rpc("restore_order_stock",{p_order_id:o.id});return json({paid:false,order_number:o.order_number,message:`eSewa payment status: ${decoded.status}`});}
  const statusBase=Deno.env.get("ESEWA_STATUS_URL")||"https://uat.esewa.com.np/api/epay/transaction/status/";
  const u=new URL(statusBase);u.searchParams.set("product_code",code);u.searchParams.set("total_amount",String(o.total));u.searchParams.set("transaction_uuid",o.order_number);
  const check=await fetch(u);const verified=await check.json();
  if(verified.status!=="COMPLETE")throw new Error("eSewa status verification did not return COMPLETE");
  await admin.from("orders").update({payment_status:"paid",order_status:"confirmed",provider_transaction_id:decoded.transaction_code||verified.refId,updated_at:new Date().toISOString()}).eq("id",o.id);
  return json({paid:true,order_number:o.order_number});
 }catch(e){return fail(e)}
});
