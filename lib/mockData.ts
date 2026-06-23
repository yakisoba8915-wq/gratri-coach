import type { Goal, PracticeLog, Profile, Training, Trick } from "./types";

type Seed = [string, string, string, number, string[]];
const seeds: Seed[] = [
  ["back-nose-press","バックノーズプレス","Backside Nose Press",1,[]], ["back-tail-press","バックテールプレス","Backside Tail Press",1,[]],
  ["front-nose-press","フロントノーズプレス","Frontside Nose Press",1,[]], ["front-tail-press","フロントテールプレス","Frontside Tail Press",1,[]],
  ["ollie","オーリー","Ollie",2,[]], ["nollie","ノーリー","Nollie",2,[]], ["ollie-bs-180","オーリーBS180","Ollie BS 180",3,["ollie"]],
  ["ollie-fs-180","オーリーFS180","Ollie FS 180",3,["ollie"]], ["nollie-bs-180","ノーリーBS180","Nollie BS 180",4,["nollie"]],
  ["nollie-fs-180","ノーリーFS180","Nollie FS 180",4,["nollie"]], ["owen","オーウェン","Owen",5,["back-nose-press","ollie-bs-180"]],
  ["sone","ソネ","Sone",5,["front-tail-press","nollie-fs-180"]], ["ollie-bs-360","オーリーBS360","Ollie BS 360",6,["ollie-bs-180"]],
  ["ollie-fs-360","オーリーFS360","Ollie FS 360",6,["ollie-fs-180"]], ["nollie-bs-360","ノーリーBS360","Nollie BS 360",7,["nollie-bs-180"]],
  ["nollie-fs-360","ノーリーFS360","Nollie FS 360",7,["nollie-fs-180"]], ["andy","アンディ","Andy",7,["ollie-bs-180"]],
  ["back-nose-180","バックノーズ180","Back Nose 180",5,["back-nose-press","ollie-bs-180"]], ["front-tail-180","フロントテール180","Front Tail 180",5,["front-tail-press","ollie-fs-180"]],
  ["fs-nollie-540","FSノーリー540","FS Nollie 540",9,["nollie-fs-360"]]
];
const categories = ["プレス基礎","プレス基礎","プレス基礎","プレス基礎","弾き基礎","弾き基礎","180系","180系","180系","180系","乗り系","乗り系","360系","360系","360系","360系","弾き系発展","プレス発展","プレス発展","高難度"];

export const initialTricks: Trick[] = seeds.map(([id, nameJa, nameEn, difficulty, prerequisites], index) => ({
  id, nameJa, nameEn, difficulty, prerequisites, category: categories[index],
  description: `${nameJa}の基本動作と安全なステップアップを身につけるためのガイドです。`,
  howTo: ["低い姿勢で進入し、目線を進行方向へ向ける", "軸を板の中心に保ちながらゆっくり動作する", "着地で膝を柔らかく使う"],
  commonMistakes: ["上半身だけを先に回してしまう", "目線が足元に落ちる", "着地で後傾になる"],
  relatedTrainings: index < 6 ? ["balance-board", "hip-stretch"] : ["jump-landing", "core-plank"],
  referenceVideos: ["https://www.youtube.com/results?search_query=" + encodeURIComponent(`グラトリ ${nameJa} やり方`)], imageUrls: [],
  masteryStatus: index < 2 ? "ほぼ安定" : index < 8 ? "練習中" : "未挑戦", favorite: [4, 6, 12].includes(index)
}));

export const initialPracticeLogs: PracticeLog[] = [
  { id:"log-1", date:"2026-06-21", resortName:"かぐらスキー場", trickId:"ollie", successCount:8, failCount:4, memo:"高さが少し出た", selfAnalysis:"踏み切りは良かった", weakPoint:"着地で後傾", nextTask:"目線を先に送る", snowCondition:"シャバ雪", videoUrls:["https://example.com/ollie-video"] },
  { id:"log-2", date:"2026-06-15", resortName:"丸沼高原", trickId:"ollie-bs-180", successCount:3, failCount:9, memo:"回転不足が多い", selfAnalysis:"肩が遅れている", weakPoint:"抜けのタイミング", nextTask:"平地で肩の先行動作を10本", snowCondition:"圧雪", videoUrls:[] },
  { id:"log-3", date:"2026-06-08", resortName:"月山", trickId:"back-nose-press", successCount:7, failCount:3, memo:"安定してきた", selfAnalysis:"重心移動がスムーズ", weakPoint:"保持時間", nextTask:"3秒キープを目指す", snowCondition:"ザラメ", videoUrls:[] }
];

export const trainings: Training[] = [
  { id:"balance-board", name:"バランスボード・プレス", category:"シバカツ", description:"板の上で前後の重心移動を確認", relatedTrickIds:["back-nose-press","front-tail-press"], minutes:10 },
  { id:"jump-landing", name:"180ジャンプ着地", category:"シバカツ", description:"小さなジャンプで目線と着地を練習", relatedTrickIds:["ollie-bs-180","ollie-fs-180"], minutes:10 },
  { id:"core-plank", name:"体幹プランク", category:"筋トレ", description:"回転軸を保つ体幹を作る", relatedTrickIds:["ollie-bs-360","nollie-fs-360"], minutes:5 },
  { id:"squat", name:"スロースクワット", category:"筋トレ", description:"踏み切りと着地に必要な脚力を作る", relatedTrickIds:["ollie","nollie"], minutes:8 },
  { id:"hip-stretch", name:"股関節ストレッチ", category:"柔軟", description:"低い姿勢を取りやすくする", relatedTrickIds:["back-nose-press","front-nose-press"], minutes:6 },
  { id:"ankle-stretch", name:"足首モビリティ", category:"柔軟", description:"深い屈伸と安定した着地を助ける", relatedTrickIds:["ollie","nollie"], minutes:5 }
];
export const initialGoals: Goal[] = [
  { id:"goal-1", season:"2026-27", type:"技をメイクする", trickId:"ollie-bs-360", completed:false },
  { id:"goal-2", season:"2026-27", type:"成功率を上げる", trickId:"ollie-bs-180", targetRate:60, completed:false }
];
export const initialProfile: Profile = { displayName:"グラトリビギナー", stance:"レギュラー", planType:"free" };
