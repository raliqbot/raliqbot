import type { NextRequest } from "next/server";

export async function GET(request: NextRequest, {params}){
    const {poolId} = await params;
    const {searchParams} = new URL(request.url);
    const address = searchParams.get('address');
    
}