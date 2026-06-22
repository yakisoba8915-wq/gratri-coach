import type { OffTrainingExercise,OffTrainingPlan,OffTrainingPreferences,TrainingCategory } from "./types";

type ExerciseSeed=Omit<OffTrainingExercise,"prescription">&{base:string};
const exercise=(name:string,category:TrainingCategory,base:string,ability:string,caution="痛みが出たら中止する"):ExerciseSeed=>({name,category,base,ability,caution});

export function generateOffTrainingPlan(preferences:OffTrainingPreferences,userId:string):OffTrainingPlan{
  const {equipment,focusAbility,targetTrickType,injuryConcern,intensity}=preferences;
  const hasGym=preferences.gymAvailable!=="使えない"&&(preferences.location==="ジム"||preferences.gymAvailable==="使える");
  const knee=injuryConcern==="膝"||injuryConcern==="複数ある";
  const back=injuryConcern==="腰"||injuryConcern==="複数ある";
  const ankle=injuryConcern==="足首"||injuryConcern==="複数ある";
  const sets=intensity==="軽め"?2:intensity==="きつめ"?4:3;
  const pool:ExerciseSeed[]=[];

  if(equipment==="シバカツボードを持っている")pool.push(exercise("シバカツ・プレス保持","シバカツ","左右30秒","プレス安定・板操作"),exercise("シバカツ・乗り系重心移動","シバカツ","左右8回","乗り系・重心移動"));
  else if(equipment==="トリックスノーを持っている")pool.push(exercise("トリックスノー・オーリー","シバカツ","8回","弾き"),exercise("トリックスノー・180","シバカツ","左右6回","回転力・乗り系"));
  else pool.push(exercise("ライン上プレス姿勢","シバカツ","左右30秒","プレス安定"),exercise("スケータージャンプ","シバカツ","左右8回","板操作・着地安定"));

  if(hasGym){pool.push(exercise("スクワット","筋トレ","8〜10回","弾き・脚力"),exercise("ブルガリアンスクワット","筋トレ","左右8回","片足安定"));if(!back)pool.push(exercise("RDL","筋トレ","8回","ヒップヒンジ・着地安定","腰を反らさず軽い重量から行う"));if(!knee&&!back)pool.push(exercise("ボックスジャンプ","筋トレ","6回","弾き・着地"));if(intensity==="きつめ"&&!back)pool.push(exercise("ケトルベルスイング","筋トレ","12回","瞬発力・体力"));}
  else {pool.push(exercise("プランク","筋トレ","30秒","体幹安定"),exercise("ロシアンツイスト","筋トレ","左右10回","回転力"));if(!knee)pool.push(exercise("ジャンプスクワット","筋トレ","8回","弾き・着地"));else pool.push(exercise("片足バランス","筋トレ","左右30秒","膝周り・着地安定"));}

  if(back)pool.push(exercise("デッドバグ","筋トレ","左右8回","体幹安定","腰を床から浮かせない"),exercise("股関節ストレッチ","柔軟","左右40秒","腰の負担軽減・柔軟性"));
  if(knee)pool.push(exercise("クラムシェル","筋トレ","左右12回","股関節安定"));
  if(ankle)pool.push(exercise("足首モビリティ","柔軟","左右60秒","足首可動域"),exercise("カーフレイズ","筋トレ","15回","足首安定"));
  pool.push(exercise("股関節ストレッチ","柔軟","左右30秒","柔軟性"),exercise("足首ストレッチ","柔軟","左右30秒","着地安定"));

  if(focusAbility==="回転力"||targetTrickType==="360系"||targetTrickType==="540系")pool.unshift(exercise("スタンディング回旋","シバカツ","左右10回","回転力"));
  if(focusAbility==="体力")pool.push(exercise("マウンテンクライマー","筋トレ","30秒","体力・体幹"));
  if(focusAbility==="柔軟性")pool.unshift(exercise("全身モビリティフロー","柔軟","5分","柔軟性"));

  const unique=[...new Map(pool.map((item)=>[item.name,item])).values()];
  const count=intensity==="軽め"?4:intensity==="きつめ"?7:6;
  const selected=unique.slice(0,count);
  const dayLabels=["DAY 1","DAY 2","DAY 3","DAY 4"];
  const days=Array.from({length:preferences.weeklyDays},(_,index)=>({
    label:dayLabels[index]??`DAY ${index+1}`,
    theme:index%2===0?`${focusAbility}を伸ばす日`:`${targetTrickType}につなげる日`,
    exercises:selected.filter((_,exerciseIndex)=>preferences.weeklyDays===1||exerciseIndex%preferences.weeklyDays===index%preferences.weeklyDays||exerciseIndex>=selected.length-preferences.weeklyDays).slice(0,count).map(({base,...item})=>({...item,prescription:`${base} × ${sets}セット`}))
  }));
  return {id:`off-plan-${userId}`,title:`${focusAbility} × ${targetTrickType} オフトレプラン`,description:`週${preferences.weeklyDays}日・1回${preferences.sessionMinutes}分を目安に、${intensity}の強度で取り組むプランです。`,weeklyDays:preferences.weeklyDays,sessionMinutes:preferences.sessionMinutes,days};
}
