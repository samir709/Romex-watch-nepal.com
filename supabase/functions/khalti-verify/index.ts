import { admin,cors,json,fail } from "../_shared.ts";
Deno.serve(async req=>{
 const pre=cors(req);if(pre)return pre;
 try{
  const {order_id,pidx}=await req.json();if(!pidx)throw new Error("Missing Khalti payment id");
  const {data:o,error}=await admin.from("orders").select("*").eq("id",order_id).single();if(error)throw error;
  const secret=Deno.env.get("KHALTI_SECRET_KEY")!;const base=Deno.env.get("KHALTI_API_BASE")||"https://dev.khalti.com/api/v2";
  const res=await fetch(`${base}/epayment/lookup/`,{method:"POST",headers:{"Authorization":`Key ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({pidx})});
  const data=await res.json();if(!res.ok)throw new Error(data.detail||"Khalti lookup failed");
  if(data.status!=="Completed"){if(["User canceled","Expired","Failed"].includes(data.status))await admin.rpc("restore_order_stock",{p_order_id:o.id});return json({paid:false,order_number:o.order_number,message:`Khalti payment status: ${data.status}`})}
  if(Number(data.total_amount)!==Math.round(Number(o.total)*100))throw new Error("Khalti amount mismatch");
  await admin.from("orders").update({payment_gateway:"khalti",payment_status:"paid",order_status:"confirmed",provider_transaction_id:data.transaction_id,provider_reference:pidx,updated_at:new Date().toISOString()}).eq("id",o.id);
  return json({paid:true,order_number:o.order_number});
 }catch(e){return fail(e)}
});
