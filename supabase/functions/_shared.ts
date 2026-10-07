import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl=Deno.env.get("SUPABASE_URL")!;
const serviceKey=Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}});
const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
export function cors(req:Request){if(req.method==="OPTIONS")return new Response("ok",{headers});}
export function json(data:any,status=200){return new Response(JSON.stringify(data),{status,headers});}
export function fail(e:any){console.error(e);return json({error:e?.message||String(e)},400);}
