export type ShibakatsuCategory="press"|"ollie"|"nollie"|"bs180"|"fs180"|"bs360"|"fs360";
export type ShibakatsuDifficulty="beginner"|"intermediate"|"advanced";

export interface ShibakatsuMenuDetail {
  name:string;
  duration:string;
  purpose:string;
  youtubeUrl?:string;
  videoUrl?:string;
}
export interface ShibakatsuMenuEntry {
  category:ShibakatsuCategory;
  difficulty:ShibakatsuDifficulty;
  menu:ShibakatsuMenuDetail;
}
export interface ShibakatsuMenuRequest {
  focusAbilities:string[];
  targetTrickTypes:string[];
  limit:number;
}

export const shibakatsuMenus:ShibakatsuMenuEntry[]=[
  {category:"press",difficulty:"beginner",menu:{name:"ノーズプレス姿勢キープ",duration:"左右30秒",purpose:"ノーズ側の重心位置を覚える"}},
  {category:"press",difficulty:"beginner",menu:{name:"テールプレス姿勢キープ",duration:"左右30秒",purpose:"テール側の重心位置を覚える"}},
  {category:"press",difficulty:"intermediate",menu:{name:"ノーズ・テール乗せ替え",duration:"10回",purpose:"前後の荷重移動を滑らかにする"}},
  {category:"ollie",difficulty:"beginner",menu:{name:"オーリー動作分解",duration:"8回",purpose:"引き付けと弾きの順番を整える"}},
  {category:"ollie",difficulty:"intermediate",menu:{name:"オーリー連続動作",duration:"10回",purpose:"一定のリズムで弾く感覚を作る"}},
  {category:"nollie",difficulty:"beginner",menu:{name:"ノーリー動作分解",duration:"8回",purpose:"前足側の弾きと引き付けを整える"}},
  {category:"nollie",difficulty:"intermediate",menu:{name:"ノーリー連続動作",duration:"10回",purpose:"前足主導の動作を安定させる"}},
  {category:"bs180",difficulty:"intermediate",menu:{name:"BS180回転導入",duration:"左右8回",purpose:"背中側への目線と肩の先行を覚える"}},
  {category:"fs180",difficulty:"intermediate",menu:{name:"FS180回転導入",duration:"左右8回",purpose:"正面側への回転軸を整える"}},
  {category:"bs180",difficulty:"intermediate",menu:{name:"BS180着地姿勢",duration:"8回",purpose:"回転後の板と上体を安定させる"}},
  {category:"fs180",difficulty:"intermediate",menu:{name:"FS180着地姿勢",duration:"8回",purpose:"回転後の低い着地を身につける"}},
  {category:"bs360",difficulty:"advanced",menu:{name:"BS360分割ドリル",duration:"6回",purpose:"180以降の目線と引き付けをつなげる"}},
  {category:"fs360",difficulty:"advanced",menu:{name:"FS360分割ドリル",duration:"6回",purpose:"回転の先行と着地までの軸を整える"}},
  {category:"press",difficulty:"advanced",menu:{name:"プレス・180連携",duration:"左右6回",purpose:"プレスから回転への乗せ替えを磨く"}}
];

function preferredCategories(focusAbilities:string[],targetTrickTypes:string[]):ShibakatsuCategory[]{
  const categories:ShibakatsuCategory[]=[];
  if(focusAbilities.includes("プレス安定")||targetTrickTypes.includes("プレス系")||targetTrickTypes.includes("乗り系"))categories.push("press");
  if(focusAbilities.includes("弾き")||targetTrickTypes.includes("オーリー系"))categories.push("ollie");
  if(focusAbilities.includes("弾き")||targetTrickTypes.includes("ノーリー系"))categories.push("nollie");
  if(focusAbilities.includes("回転力")){categories.push("bs180","fs180");}
  if(targetTrickTypes.includes("360系")||targetTrickTypes.includes("540系"))categories.push("bs360","fs360");
  if(focusAbilities.includes("着地安定"))categories.push("bs180","fs180");
  return [...new Set(categories)];
}

export function getShibakatsuMenus({focusAbilities,targetTrickTypes,limit}:ShibakatsuMenuRequest):ShibakatsuMenuEntry[]{
  const preferred=preferredCategories(focusAbilities,targetTrickTypes);
  const difficultyOrder:ShibakatsuDifficulty[]=targetTrickTypes.some((value)=>value==="360系"||value==="540系")?["advanced","intermediate","beginner"]:["beginner","intermediate","advanced"];
  return [...shibakatsuMenus].sort((a,b)=>{
    const categoryDifference=(preferred.includes(a.category)?0:1)-(preferred.includes(b.category)?0:1);
    return categoryDifference||difficultyOrder.indexOf(a.difficulty)-difficultyOrder.indexOf(b.difficulty);
  }).slice(0,limit);
}
