import type { OffTrainingPlan,OffTrainingPlanItem,OffTrainingPreferences,TrainingCategory,Weekday,WeeklyOffTrainingDay } from "./types";

type LegacyPreferences=Omit<OffTrainingPreferences,"equipment"|"location"|"focusAbility"|"targetTrickType"|"injuryConcern">&{equipment:string;location:string;focusAbility:string;targetTrickType:string;injuryConcern:string};
interface ExerciseSeed {name:string;category:TrainingCategory;baseAmount:string;purpose:string;jump?:boolean;backRisk?:boolean;shoulderRisk?:boolean;caution?:string;}
const seed=(name:string,category:TrainingCategory,baseAmount:string,purpose:string,flags:Partial<ExerciseSeed>={}):ExerciseSeed=>({name,category,baseAmount,purpose,...flags});
const list=(value:string|string[]):string[]=>Array.isArray(value)?value:[value];
const weekdays:Weekday[]=["月","火","水","木","金","土","日"];
const scheduledDays:Record<number,Weekday[]>={1:["土"],2:["火","土"],3:["月","水","土"],4:["月","火","木","土"]};

const catalog:Record<string,ExerciseSeed>={
  "プランク":seed("プランク","筋トレ","30秒","体幹を安定させる"),"ロシアンツイスト":seed("ロシアンツイスト","筋トレ","左右10回","回転軸を強くする"),
  "ジャンプスクワット":seed("ジャンプスクワット","筋トレ","8回","弾きの初速を上げる",{jump:true}),"片足バランス":seed("片足バランス","筋トレ","左右30秒","着地とプレスを安定させる"),
  "股関節ストレッチ":seed("股関節ストレッチ","柔軟","左右40秒","低い姿勢を取りやすくする"),"足首ストレッチ":seed("足首ストレッチ","柔軟","左右40秒","足首の可動域を広げる"),
  "ダッシュ":seed("ダッシュ","筋トレ","20m×5本","瞬発力と体力を高める"),"片足スクワット":seed("片足スクワット","筋トレ","左右8回","片足での着地を安定させる"),
  "ボックスジャンプ代替":seed("段差ジャンプ","筋トレ","6回","弾きと着地を強くする",{jump:true}),"体幹ツイスト":seed("体幹ツイスト","筋トレ","左右10回","回転力を高める"),
  "スクワット":seed("スクワット","筋トレ","10回","弾きに必要な脚力を作る"),"ブルガリアンスクワット":seed("ブルガリアンスクワット","筋トレ","左右8回","着地時の片足安定を高める"),
  "RDL":seed("RDL","筋トレ","8回","ヒップヒンジと着地姿勢を強くする",{backRisk:true,caution:"腰を反らさず軽い重量から行う"}),
  "ケトルベルスイング":seed("ケトルベルスイング","筋トレ","12回","爆発的な伸展力を高める",{backRisk:true}),"ボックスジャンプ":seed("ボックスジャンプ","筋トレ","6回","弾きと着地を高める",{jump:true}),
  "レッグプレス":seed("レッグプレス","筋トレ","10回","下半身の押す力を高める"),"シバカツ練習":seed("シバカツ練習","シバカツ","5分","板操作を安定させる"),
  "回転練習":seed("回転練習","シバカツ","左右8回","目線と回転軸を整える"),"着地練習":seed("着地練習","シバカツ","8回","静かな着地を身につける",{jump:true}),
  "体幹":seed("体幹サーキット","筋トレ","5分","姿勢を崩れにくくする"),"柔軟":seed("全身モビリティ","柔軟","5分","動ける範囲を広げる"),
  "プレス練習":seed("プレス練習","シバカツ","左右5本","プレス姿勢を安定させる"),"オーリー練習":seed("オーリー練習","シバカツ","8本","弾きのタイミングを整える",{jump:true}),
  "ノーリー練習":seed("ノーリー練習","シバカツ","8本","前足の弾きを整える",{jump:true}),"180練習":seed("180練習","シバカツ","左右5本","回転と着地をつなげる",{jump:true}),
  "着地確認":seed("着地確認","シバカツ","左右5本","雪上で着地姿勢を確認する"),"シバカツプレス":seed("シバカツプレス","シバカツ","左右30秒","プレスの重心位置を覚える"),
  "回転ジャンプ":seed("回転ジャンプ","筋トレ","左右6回","空中での回転力を高める",{jump:true}),"メディシンボールツイスト風メニュー":seed("負荷付き体幹ツイスト","筋トレ","左右8回","回転を生む体幹を作る"),
  "ハムストリングスストレッチ":seed("ハムストリングスストレッチ","柔軟","左右40秒","前屈と着地姿勢を改善する"),"胸椎回旋":seed("胸椎回旋","柔軟","左右8回","上半身の回旋を滑らかにする"),
  "サーキットトレーニング":seed("全身サーキット","筋トレ","5分","滑り続ける体力を作る"),"バーピー":seed("バーピー","筋トレ","8回","全身持久力を高める",{jump:true,shoulderRisk:true}),
  "カーフレイズ":seed("カーフレイズ","筋トレ","15回","足首を安定させる"),"デッドバグ":seed("デッドバグ","筋トレ","左右8回","腰を守る体幹安定を作る"),
  "シバカツボード練習":seed("シバカツボード練習","シバカツ","5分","プレスと板操作を高める"),"トリックスノー練習":seed("トリックスノー練習","シバカツ","8回","弾きと乗り系動作を高める")
};
const locationMenus:Record<string,string[]>={"家":["プランク","ロシアンツイスト","ジャンプスクワット","片足バランス","股関節ストレッチ","足首ストレッチ"],"公園":["ジャンプスクワット","ダッシュ","片足スクワット","ボックスジャンプ代替","体幹ツイスト"],"ジム":["スクワット","ブルガリアンスクワット","RDL","ケトルベルスイング","ボックスジャンプ","レッグプレス"],"体育館":["シバカツ練習","回転練習","着地練習","体幹","柔軟"],"雪上施設・室内ゲレンデ":["プレス練習","オーリー練習","ノーリー練習","180練習","着地確認"]};
const focusMenus:Record<string,string[]>={"プレス安定":["片足バランス","シバカツプレス","股関節ストレッチ"],"弾き":["スクワット","ボックスジャンプ","ジャンプスクワット","ケトルベルスイング"],"回転力":["ロシアンツイスト","体幹ツイスト","回転ジャンプ","メディシンボールツイスト風メニュー"],"着地安定":["片足スクワット","片足バランス","着地練習","ブルガリアンスクワット"],"柔軟性":["股関節ストレッチ","ハムストリングスストレッチ","足首ストレッチ","胸椎回旋"],"体力":["ダッシュ","サーキットトレーニング","ジャンプスクワット","バーピー"]};

function amountFor(item:ExerciseSeed,intensity:OffTrainingPreferences["intensity"],knee:boolean):string{
  const sets=intensity==="軽め"?2:intensity==="きつめ"?"3〜4":3;
  if(item.category==="柔軟"||item.baseAmount.includes("分"))return `${item.baseAmount} × ${intensity==="軽め"?1:2}セット`;
  if(knee&&item.name==="片足スクワット")return `左右6回（軽め） × 2セット`;
  return `${item.baseAmount} × ${sets}セット`;
}

export function generateOffTrainingPlan(preferences:OffTrainingPreferences|LegacyPreferences,userId:string):OffTrainingPlan{
  const equipment=list(preferences.equipment),locations=list(preferences.location),focus=list(preferences.focusAbility),targets=list(preferences.targetTrickType),injuries=list(preferences.injuryConcern);
  const knee=injuries.includes("膝")||injuries.includes("複数ある"),back=injuries.includes("腰")||injuries.includes("複数ある"),ankle=injuries.includes("足首")||injuries.includes("複数ある"),shoulder=injuries.includes("肩")||injuries.includes("複数ある");
  const names:string[]=[];
  focus.forEach((value)=>names.push(...(focusMenus[value]??[])));
  locations.forEach((value)=>names.push(...(locationMenus[value]??[])));
  if(equipment.includes("シバカツボードを持っている"))names.unshift("シバカツボード練習");
  if(equipment.includes("トリックスノーを持っている"))names.unshift("トリックスノー練習");
  if(back)names.unshift("デッドバグ","股関節ストレッチ");
  if(knee)names.unshift("片足バランス","プランク","股関節ストレッチ");
  if(ankle)names.unshift("足首ストレッチ","カーフレイズ","片足バランス");
  names.push("股関節ストレッチ","足首ストレッチ","プランク");
  const medicallySafe=[...new Set(names)].map((name)=>catalog[name]).filter((item):item is ExerciseSeed=>Boolean(item)).filter((item)=>!(back&&item.backRisk)&&!(shoulder&&item.shoulderRisk)&&!(knee&&item.jump));
  const pool=preferences.intensity==="軽め"?medicallySafe.filter((item,index,array)=>!item.jump||array.slice(0,index).filter((candidate)=>candidate.jump).length<1):preferences.intensity==="きつめ"?[...medicallySafe].sort((a,b)=>Number(Boolean(b.jump||b.category==="筋トレ"))-Number(Boolean(a.jump||a.category==="筋トレ"))):medicallySafe;
  const safePool=pool.length>=3?pool:[catalog["プランク"],catalog["片足バランス"],catalog["股関節ストレッチ"],catalog["足首ストレッチ"]];
  const perDay=preferences.sessionMinutes<=15?3:preferences.sessionMinutes<=30?4:preferences.sessionMinutes<=45?5:6;
  const activeDays=scheduledDays[Math.min(preferences.weeklyDays,4)]??scheduledDays[4];
  const weeklyPlan:WeeklyOffTrainingDay[]=weekdays.map((day)=>{
    const activeIndex=activeDays.indexOf(day);
    if(activeIndex<0)return {day,title:"休養日",focus:[],estimatedMinutes:0,items:[]};
    const selected=Array.from({length:Math.min(perDay,safePool.length)},(_,index)=>safePool[(index+activeIndex*2)%safePool.length]);
    const items:OffTrainingPlanItem[]=selected.map((item)=>({name:item.name,category:item.category,amount:amountFor(item,preferences.intensity,knee),purpose:item.purpose,caution:item.caution??(preferences.intensity==="軽め"?"余裕を残し、セット間を長めに休む":"痛みが出たら中止する")}));
    const dayFocus=[focus[activeIndex%Math.max(focus.length,1)]??"基礎",focus[(activeIndex+1)%Math.max(focus.length,1)]].filter((value,index,array):value is string=>Boolean(value)&&array.indexOf(value)===index);
    return {day,title:`${dayFocus.join("・")}強化Day`,focus:dayFocus,estimatedMinutes:preferences.sessionMinutes,items};
  });
  return {id:`off-plan-${userId}`,title:`${focus.join("・")} × ${targets.join("・")} オフトレプラン`,description:`週${preferences.weeklyDays}日・1回${preferences.sessionMinutes}分、${preferences.intensity}の強度で取り組む週間プランです。`,weeklyDays:preferences.weeklyDays,sessionMinutes:preferences.sessionMinutes,weeklyPlan};
}
