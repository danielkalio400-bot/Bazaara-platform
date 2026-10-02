import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import type { SportsCompetitionContract, SportsFixtureContract } from "@bazaara/contracts";
import { AppError } from "../errors.js";

function competitionContract(c:{id:string;provider:string;providerId:string;sport:string;name:string;country:string|null}):SportsCompetitionContract{return{id:c.id,provider:c.provider,providerId:c.providerId,sport:c.sport,name:c.name,country:c.country};}
function fixtureContract(f:{id:string;competitionId:string;status:string;startsAt:Date;homeName:string;awayName:string;homeScore:number|null;awayScore:number|null;clock:string|null}):SportsFixtureContract{return{id:f.id,competitionId:f.competitionId,status:f.status,startsAt:f.startsAt.toISOString(),homeName:f.homeName,awayName:f.awayName,homeScore:f.homeScore,awayScore:f.awayScore,clock:f.clock};}
export async function bazasportRoutes(app:FastifyInstance){
  app.get("/v1/sport/competitions",async request=>{const q=z.object({sport:z.string().trim().max(40).optional()}).parse(request.query);const rows=await db.sportsCompetition.findMany({where:{active:true,sport:q.sport},orderBy:{name:"asc"},take:200});return{competitions:rows.map(competitionContract)};});
  app.get("/v1/sport/fixtures",async request=>{const q=z.object({sport:z.string().trim().max(40).optional(),status:z.string().trim().max(40).optional(),from:z.string().datetime().optional(),to:z.string().datetime().optional()}).parse(request.query);const rows=await db.sportsFixture.findMany({where:{status:q.status,startsAt:q.from||q.to?{gte:q.from?new Date(q.from):undefined,lte:q.to?new Date(q.to):undefined}:undefined,competition:q.sport?{sport:q.sport}:undefined},include:{competition:true},orderBy:{startsAt:"asc"},take:250});return{fixtures:rows.map(f=>({...fixtureContract(f),competition:competitionContract(f.competition)}))};});
  app.get("/v1/sport/betting/capabilities",async()=>({realMoneyBettingEnabled:false,reason:"Licensing, age/KYC, geolocation and responsible-gambling controls are not activated."}));
  app.all("/v1/sport/betting/*",async()=>{throw new AppError("REGULATED_FEATURE_DISABLED","Real-money wagering is disabled",403);});
}
