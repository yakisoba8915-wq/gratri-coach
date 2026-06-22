import type { OffTrainingDayType,OffTrainingPlan,OffTrainingPlanItem,OffTrainingPreferences,TrainingCategory,Weekday,WeeklyOffTrainingDay } from "./types";

type LegacyPreferences=Omit<OffTrainingPreferences,"equipment"|"location"|"focusAbility"|"targetTrickType"|"injuryConcern">&{equipment:string;location:string;focusAbility:string;targetTrickType:string;injuryConcern:string};
interface Seed {name:string;category:TrainingCategory;base:string;purpose:string;jump?:boolean;backRisk?:boolean;caution?:string;}
const item=(name:string,category:TrainingCategory,base:string,purpose:string,extra:Partial<Seed>={}):Seed=>({name,category,base,purpose,...extra});
const list=(value:string|string[]):string[]=>Array.isArray(value)?value:[value];
const weekdays:Weekday[]=["月","火","水","木","金","土","日"];
type ActiveType="shiba"|"strength";
const schedules:Record<number,Partial<Record<Weekday,ActiveType>>>={1:{"土":"strength"},2:{"火":"shiba","土":"strength"},3:{"月":"shiba","水":"strength","土":"shiba"},4:{"月":"shiba","火":"strength","木":"shiba","土":"strength"}};

const shibaWithEquipment:Seed[]=[
  item("シバカツプレス練習","シバカツ","5分","プレス時の重心位置を覚える"),item("ノーズプレス姿勢","シバカツ","左右30秒","ノーズ側への荷重を安定させる"),
  item("テールプレス姿勢","シバカツ","左右30秒","テール側への荷重を安定させる"),item("乗せ替え練習","シバカツ","10回","左右の重心移動を滑らかにする"),
  item("オーリー動作確認","シバカツ","8回","弾く順番を身体に覚えさせる"),item("ノーリー動作確認","シバカツ","8回","前足側の弾きを整える"),
  item("回転導入練習","シバカツ","左右8回","目線と肩の先行動作を整える"),item("着地姿勢確認","シバカツ","8回","低く安定した着地を身につける")
];
const shibaWithoutEquipment:Seed[]=[
  item("プレス姿勢キープ","シバカツ","左右30秒","プレス姿勢の軸を作る"),item("重心移動練習","シバカツ","左右10回","板を想定した荷重移動を覚える"),
  item("回転イメージジャンプ","シバカツ","左右6回","回転の導入と目線を整える",{jump:true}),item("片足バランス","筋トレ","左右30秒","プレスと着地の安定を高める"),
  item("着地姿勢確認","シバカツ","8回","低く安定した着地を身につける")
];
const strengthSeeds:Seed[]=[
  item("スクワット","筋トレ","10回","弾きに必要な脚力を作る"),item("ブルガリアンスクワット","筋トレ","左右10回","片足での着地を安定させる"),
  item("RDL","筋トレ","8回","ヒップヒンジと着地姿勢を強くする",{backRisk:true,caution:"腰を反らさず軽い重量から行う"}),item("ジャンプスクワット","筋トレ","10回","弾きの初速を上げる",{jump:true}),
  item("ボックスジャンプ","筋トレ","6回","爆発力と着地精度を高める",{jump:true}),item("片足スクワット","筋トレ","左右8回","片足での安定性を高める"),
  item("プランク","筋トレ","30秒","体幹を安定させる"),item("ロシアンツイスト","筋トレ","左右10回","回転を生む体幹を作る"),
  item("片足バランス","筋トレ","左右30秒","着地とプレスを安定させる"),item("全身サーキット","筋トレ","5分","滑り続ける体力を作る")
];
const flexibilitySeeds:Seed[]=[
  item("股関節ストレッチ","柔軟","左右30秒","低い姿勢を取りやすくする"),item("ハムストリングスストレッチ","柔軟","左右30秒","着地姿勢の可動域を広げる"),
  item("足首ストレッチ","柔軟","左右30秒","足首の可動域を広げる"),item("胸椎回旋","柔軟","左右8回","上半身の回旋を滑らかにする"),
  item("ふくらはぎストレッチ","柔軟","左右30秒","足首と下腿の負担を軽くする")
];

const unique=(values:Seed[]):Seed[]=>[...new Map(values.map((value)=>[value.name,value])).values()];
const prioritize=(pool:Seed[],names:string[]):Seed[]=>unique([...names.map((name)=>pool.find((seed)=>seed.name===name)).filter((seed):seed is Seed=>Boolean(seed)),...pool]);
function prescription(seed:Seed,intensity:OffTrainingPreferences["intensity"],knee:boolean):string{
  if(seed.category==="柔軟")return seed.base;
  const sets=intensity==="軽め"?2:intensity==="きつめ"?"3〜4":3;
  if(knee&&seed.name==="片足スクワット")return "左右6回（軽め） × 2セット";
  return `${seed.base} × ${sets}セット`;
}
function toPlanItems(seeds:Seed[],preferences:OffTrainingPreferences|LegacyPreferences,knee:boolean):OffTrainingPlanItem[]{return seeds.map((seed)=>({name:seed.name,category:seed.category,amount:prescription(seed,preferences.intensity,knee),purpose:seed.purpose,caution:seed.caution??(preferences.intensity==="軽め"?"余裕を残し、休憩を長めに取る":"痛みが出たら中止する")}));}
function shibaPriorities(focus:string[],withEquipment:boolean):Seed[]{
  const base=withEquipment?shibaWithEquipment:shibaWithoutEquipment;const names:string[]=[];
  if(focus.includes("プレス安定"))names.push(...(withEquipment?["シバカツプレス練習","ノーズプレス姿勢","テールプレス姿勢","乗せ替え練習"]:["プレス姿勢キープ","重心移動練習","片足バランス"]));
  if(focus.includes("弾き"))names.push(withEquipment?"オーリー動作確認":"着地姿勢確認");
  if(focus.includes("回転力"))names.push(withEquipment?"回転導入練習":"回転イメージジャンプ");
  if(focus.includes("着地安定"))names.push("着地姿勢確認","片足バランス");
  return unique([...names.map((name)=>base.find((seed)=>seed.name===name)).filter((seed):seed is Seed=>Boolean(seed)),...base]);
}
function strengthPriorities(focus:string[],injuries:string[],intensity:OffTrainingPreferences["intensity"]):{strength:Seed[];flexibility:Seed[]}{
  const names:string[]=[];const flexNames:string[]=[];
  if(focus.includes("弾き"))names.push("ジャンプスクワット","スクワット","ボックスジャンプ");
  if(focus.includes("回転力")){names.push("ロシアンツイスト");flexNames.push("胸椎回旋");}
  if(focus.includes("着地安定"))names.push("片足スクワット","片足バランス","ブルガリアンスクワット");
  if(focus.includes("プレス安定")){names.push("片足バランス","プランク");flexNames.push("股関節ストレッチ");}
  if(focus.includes("柔軟性"))flexNames.push("股関節ストレッチ","ハムストリングスストレッチ","足首ストレッチ","胸椎回旋");
  if(focus.includes("体力"))names.push("全身サーキット","スクワット","ジャンプスクワット");
  const back=injuries.includes("腰")||injuries.includes("複数ある"),knee=injuries.includes("膝")||injuries.includes("複数ある"),ankle=injuries.includes("足首")||injuries.includes("複数ある");
  if(back){names.unshift("プランク");flexNames.unshift("股関節ストレッチ");}if(knee){names.unshift("片足バランス","プランク");flexNames.unshift("股関節ストレッチ");}if(ankle){names.unshift("片足バランス");flexNames.unshift("足首ストレッチ","ふくらはぎストレッチ");}
  let strength=unique([...names.map((name)=>strengthSeeds.find((seed)=>seed.name===name)).filter((seed):seed is Seed=>Boolean(seed)),...strengthSeeds]).filter((seed)=>!(back&&seed.backRisk)&&!(knee&&seed.jump));
  if(intensity==="軽め")strength=strength.filter((seed,index,array)=>!seed.jump||array.slice(0,index).filter((item)=>item.jump).length<1);
  return {strength,flexibility:unique([...flexNames.map((name)=>flexibilitySeeds.find((seed)=>seed.name===name)).filter((seed):seed is Seed=>Boolean(seed)),...flexibilitySeeds])};
}

export function generateOffTrainingPlan(preferences:OffTrainingPreferences|LegacyPreferences,userId:string):OffTrainingPlan{
  const equipment=list(preferences.equipment),locations=list(preferences.location),focus=list(preferences.focusAbility),targets=list(preferences.targetTrickType),injuries=list(preferences.injuryConcern);
  const withEquipment=equipment.some((value)=>["シバカツボードを持っている","トリックスノーを持っている","その他の練習器具を持っている"].includes(value));
  const knee=injuries.includes("膝")||injuries.includes("複数ある");const schedule=schedules[Math.min(preferences.weeklyDays,4)]??schedules[4];
  const shibaCount=preferences.sessionMinutes<=15?3:preferences.sessionMinutes<=30?4:preferences.sessionMinutes<=45?5:6;
  const strengthCount=preferences.sessionMinutes<=15?2:preferences.sessionMinutes<=30?3:preferences.sessionMinutes<=45?4:5;
  const flexCount=preferences.sessionMinutes<=15?1:preferences.sessionMinutes<=30?2:3;
  const shibaPool=shibaPriorities(focus,withEquipment).filter((seed)=>!(knee&&seed.jump));const strengthPools=strengthPriorities(focus,injuries,preferences.intensity);
  if(locations.includes("家"))strengthPools.strength=prioritize(strengthPools.strength,["プランク","ロシアンツイスト","ジャンプスクワット","片足スクワット"]);
  if(locations.includes("公園"))strengthPools.strength=prioritize(strengthPools.strength,["ジャンプスクワット","片足スクワット","片足バランス"]);
  if(locations.includes("ジム")&&preferences.gymAvailable!=="使えない")strengthPools.strength=prioritize(strengthPools.strength,["スクワット","ブルガリアンスクワット","RDL","ボックスジャンプ"]);
  const weeklyPlan:WeeklyOffTrainingDay[]=weekdays.map((day)=>{
    const activeType=schedule[day];if(!activeType)return {day,dayType:"休み",title:"休養日",focus:[],estimatedMinutes:0,items:[]};
    if(activeType==="shiba"){const dayType:OffTrainingDayType=withEquipment?"シバカツの日":"板操作イメージトレーニングの日";return {day,dayType,title:dayType,focus,estimatedMinutes:preferences.sessionMinutes,items:toPlanItems(shibaPool.slice(0,shibaCount),preferences,knee)};}
    const selected=[...strengthPools.strength.slice(0,strengthCount),...strengthPools.flexibility.slice(0,flexCount)];return {day,dayType:"筋トレ＋柔軟の日",title:focus.includes("体力")?"サーキット＋リカバリーDay":"筋力＋モビリティDay",focus,estimatedMinutes:preferences.sessionMinutes,items:toPlanItems(selected,preferences,knee)};
  });
  return {id:`off-plan-${userId}`,title:`${focus.join("・")} × ${targets.join("・")} オフトレプラン`,description:`シバカツ系と筋トレ＋柔軟を分けた、週${preferences.weeklyDays}日・1回${preferences.sessionMinutes}分の週間プランです。`,weeklyDays:preferences.weeklyDays,sessionMinutes:preferences.sessionMinutes,weeklyPlan};
}
